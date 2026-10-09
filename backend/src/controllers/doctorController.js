import crypto from "crypto";
import { createRequire } from "module";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import Exam from "../models/Exam.js";
import DoctorInvite from "../models/DoctorInvite.js";
import { parseExamPdfText } from "../utils/examPdfParser.js";
import ClinicalNote from "../models/ClinicalNote.js";
import RequestedExam from "../models/RequestedExam.js";
import User from "../models/User.js";
import { sendDoctorInviteEmail } from "../services/doctorInviteEmailService.js";

const require = createRequire(import.meta.url);
const pdfParseModule = require("pdf-parse");

const pdfParse =
  typeof pdfParseModule === "function"
    ? pdfParseModule
    : pdfParseModule.default;

export const createDoctorInvite = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Apenas médicos podem enviar convites",
      });
    }

    const patientName =
      typeof req.body.patientName === "string" ? req.body.patientName.trim() : "";
    const patientEmail =
      typeof req.body.patientEmail === "string"
        ? req.body.patientEmail.trim().toLowerCase()
        : "";

    if (!patientName || !patientEmail) {
      return res.status(400).json({
        message: "Nome e e-mail do paciente são obrigatórios",
      });
    }

    if (!/^[^\s@]+@gmail\.com$/i.test(patientEmail)) {
      return res.status(400).json({
        message: "O convite só pode ser enviado para um endereço @gmail.com",
      });
    }

    const doctor = await Doctor.findOne({ userId }).populate("userId", "name");

    if (!doctor) {
      return res.status(404).json({
        message: "Perfil de médico não encontrado",
      });
    }

    let frontendUrl;
    try {
      const configuredOrigin =
        process.env.FRONTEND_URL || req.get("origin") || "http://localhost:5173";
      const parsedOrigin = new URL(configuredOrigin);
      if (!["http:", "https:"].includes(parsedOrigin.protocol)) {
        throw new Error("FRONTEND_URL precisa usar HTTP ou HTTPS.");
      }
      frontendUrl = parsedOrigin.origin;
    } catch {
      return res.status(500).json({
        message: "Não foi possível determinar o endereço público do site. Configure FRONTEND_URL.",
      });
    }

    const token = crypto.randomBytes(16).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await DoctorInvite.create({
      doctorId: doctor._id,
      patientName,
      patientEmail,
      token,
      expiresAt,
    });

    const inviteLink = `${frontendUrl}/cadastro/${token}`;
    let emailSent = false;

    try {
      await sendDoctorInviteEmail({
        patientEmail,
        patientName,
        doctorName: doctor.userId?.name || "Seu médico",
        inviteLink,
      });
      emailSent = true;
    } catch (emailError) {
      console.error("Falha ao enviar e-mail de convite:", emailError.message);
    }

    return res.status(201).json({
      message: emailSent
        ? "Convite criado e enviado por e-mail."
        : "Convite criado, mas o e-mail não foi enviado. Compartilhe o link manualmente.",
      emailSent,
      invite: {
        id: invite._id,
        patientName: invite.patientName,
        patientEmail: invite.patientEmail,
        token: invite.token,
        status: invite.status,
        expiresAt: invite.expiresAt,
        inviteLink,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getMyDoctorPatients = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Apenas médicos podem acessar esta lista",
      });
    }

    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({
        message: "Perfil de médico não encontrado",
      });
    }

    const patients = await Patient.find({ doctorId: doctor._id })
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      patients,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getMyDoctorPatientById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Apenas médicos podem acessar este paciente",
      });
    }

    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({
        message: "Perfil de médico não encontrado",
      });
    }

    const patient = await Patient.findOne({
      _id: id,
      doctorId: doctor._id,
    }).populate("userId", "name email role");

    if (!patient) {
      return res.status(404).json({
        message: "Paciente não encontrado ou não vinculado a este médico",
      });
    }

    return res.status(200).json({
      patient,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getMyDoctorPatientExams = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Apenas médicos podem acessar exames de pacientes",
      });
    }

    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({
        message: "Perfil de médico não encontrado",
      });
    }

    const patient = await Patient.findOne({
      _id: id,
      doctorId: doctor._id,
    });

    if (!patient) {
      return res.status(404).json({
        message: "Paciente não encontrado ou não vinculado a este médico",
      });
    }

    const exams = await Exam.find({ patientId: patient._id }).sort({
      examDate: 1,
    });

    return res.status(200).json({
      exams,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const uploadPatientExamPdf = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Apenas médicos podem importar exames de pacientes",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Nenhum arquivo PDF enviado",
      });
    }

    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({
        message: "Perfil de médico não encontrado",
      });
    }

    const patient = await Patient.findOne({
      _id: id,
      doctorId: doctor._id,
    });

    if (!patient) {
      return res.status(404).json({
        message: "Paciente não encontrado ou não vinculado a este médico",
      });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const parsedExam = parseExamPdfText(pdfData.text);

    if (!parsedExam.markers || Object.keys(parsedExam.markers).length === 0) {
      return res.status(400).json({
        message: "Não foi possível identificar marcadores no PDF",
      });
    }

    const exam = await Exam.create({
      patientId: patient._id,
      examDate: parsedExam.examDate,
      markers: parsedExam.markers,
      riskLevel: parsedExam.riskLevel,
      alerts: parsedExam.alerts,
      source: "pdf",
      originalFileName: req.file.originalname,
    });

    patient.lastExamDate = parsedExam.examDate;
    patient.examStatus = "recentes";
    await patient.save();

    return res.status(201).json({
      message: "PDF importado e exame criado com sucesso",
      exam,
      extractedMarkers: parsedExam.markers,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getInviteByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const invite = await DoctorInvite.findOne({ token }).populate({
      path: "doctorId",
      populate: {
        path: "userId",
        select: "name email role",
      },
    });

    if (!invite) {
      return res.status(404).json({
        message: "Convite não encontrado",
      });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({
        message: "Este convite não está mais disponível",
      });
    }

    if (invite.expiresAt < new Date()) {
      invite.status = "expired";
      await invite.save();

      return res.status(400).json({
        message: "Convite expirado",
      });
    }

    return res.status(200).json({
      invite: {
        id: invite._id,
        patientName: invite.patientName,
        patientEmail: invite.patientEmail,
        token: invite.token,
        status: invite.status,
        expiresAt: invite.expiresAt,
        doctor: {
          id: invite.doctorId._id,
          name: invite.doctorId.userId.name,
          email: invite.doctorId.userId.email,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const acceptInvite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.params;

    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Apenas pacientes podem aceitar convites",
      });
    }

    const invite = await DoctorInvite.findOne({ token });

    if (!invite) {
      return res.status(404).json({
        message: "Convite não encontrado",
      });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({
        message: "Este convite não está mais disponível",
      });
    }

    if (invite.expiresAt < new Date()) {
      invite.status = "expired";
      await invite.save();

      return res.status(400).json({
        message: "Convite expirado",
      });
    }

    const patientUser = await User.findById(userId).select("email");
    if (
      !patientUser ||
      patientUser.email?.trim().toLowerCase() !== invite.patientEmail.trim().toLowerCase()
    ) {
      return res.status(403).json({
        message: "Este convite foi enviado para outro endereço de e-mail.",
      });
    }

    const patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.status(404).json({
        message: "Perfil de paciente não encontrado. Complete o onboarding antes de aceitar o convite.",
      });
    }

    if (patient.doctorId) {
      return res.status(400).json({
        message: "Este paciente já possui médico vinculado",
      });
    }

    patient.doctorId = invite.doctorId;
    await patient.save();

    invite.status = "accepted";
    invite.acceptedAt = new Date();
    await invite.save();

    return res.status(200).json({
      message: "Convite aceito com sucesso",
      patient,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
async function getDoctorAndPatient(req, patientId) {
  const userId = req.user.id;

  if (req.user.role !== "doctor") {
    return {
      error: {
        status: 403,
        message: "Apenas médicos podem acessar este recurso",
      },
    };
  }

  const doctor = await Doctor.findOne({ userId });

  if (!doctor) {
    return {
      error: {
        status: 404,
        message: "Perfil de médico não encontrado",
      },
    };
  }

  const patient = await Patient.findOne({
    _id: patientId,
    doctorId: doctor._id,
  });

  if (!patient) {
    return {
      error: {
        status: 404,
        message: "Paciente não encontrado ou não vinculado a este médico",
      },
    };
  }

  return { doctor, patient };
}

export const deleteDoctorPatientExam = async (req, res) => {
  try {
    const { patientId, examId } = req.params;

    const { doctor, patient, error } = await getDoctorAndPatient(req, patientId);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const exam = await Exam.findOneAndDelete({
      _id: examId,
      patientId: patient._id,
    });

    if (!exam) {
      return res.status(404).json({
        message: "Exame não encontrado para este paciente",
      });
    }

    const latestExam = await Exam.findOne({ patientId: patient._id }).sort({
      examDate: -1,
    });

    patient.lastExamDate = latestExam?.examDate || "";
    patient.examStatus = latestExam ? "recentes" : "nunca";
    await patient.save();

    return res.status(200).json({
      message: "Exame deletado com sucesso",
      examId,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getDoctorPatientFollowup = async (req, res) => {
  try {
    const { id } = req.params;

    const { doctor, patient, error } = await getDoctorAndPatient(req, id);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const notes = await ClinicalNote.find({
      doctorId: doctor._id,
      patientId: patient._id,
    }).sort({ createdAt: -1 });

    const requestedExams = await RequestedExam.find({
      doctorId: doctor._id,
      patientId: patient._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      notes,
      requestedExams,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const createClinicalNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Texto da anotação é obrigatório",
      });
    }

    const { doctor, patient, error } = await getDoctorAndPatient(req, id);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const note = await ClinicalNote.create({
      doctorId: doctor._id,
      patientId: patient._id,
      text,
    });

    return res.status(201).json({
      message: "Anotação criada com sucesso",
      note,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const toggleRequestedExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { label } = req.body;

    if (!label || !label.trim()) {
      return res.status(400).json({
        message: "Nome do exame solicitado é obrigatório",
      });
    }

    const { doctor, patient, error } = await getDoctorAndPatient(req, id);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    let requestedExam = await RequestedExam.findOne({
      doctorId: doctor._id,
      patientId: patient._id,
      label,
    });

    if (!requestedExam) {
      requestedExam = await RequestedExam.create({
        doctorId: doctor._id,
        patientId: patient._id,
        label,
        isActive: true,
      });
    } else {
      requestedExam.isActive = !requestedExam.isActive;
      await requestedExam.save();
    }

    return res.status(200).json({
      message: requestedExam.isActive
        ? "Exame solicitado com sucesso"
        : "Solicitação de exame removida",
      requestedExam,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
export const getMyDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Apenas médicos podem acessar este perfil",
      });
    }

    const doctor = await Doctor.findOne({ userId }).populate(
      "userId",
      "name email role"
    );

    if (!doctor) {
      return res.status(404).json({
        message: "Perfil de médico não encontrado",
      });
    }

    return res.status(200).json({
      doctor,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateClinicalNote = async (req, res) => {
  try {
    const userId = req.user.id
    const { noteId } = req.params
    const { text } = req.body

    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Apenas médicos podem editar anotações" })
    }

    if (!text?.trim()) {
      return res.status(400).json({ message: "Texto da anotação é obrigatório" })
    }

    const doctor = await Doctor.findOne({ userId })
    if (!doctor) return res.status(404).json({ message: "Perfil de médico não encontrado" })

    const note = await ClinicalNote.findOneAndUpdate(
      { _id: noteId, doctorId: doctor._id },
      { text: text.trim() },
      { returnDocument: "after", runValidators: true }
    )

    if (!note) return res.status(404).json({ message: "Anotação não encontrada" })

    return res.status(200).json({
      message: "Anotação atualizada com sucesso",
      note,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export const deleteClinicalNote = async (req, res) => {
  try {
    const userId = req.user.id
    const { noteId } = req.params

    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Apenas médicos podem excluir anotações" })
    }

    const doctor = await Doctor.findOne({ userId })
    if (!doctor) return res.status(404).json({ message: "Perfil de médico não encontrado" })

    const note = await ClinicalNote.findOneAndDelete({
      _id: noteId,
      doctorId: doctor._id,
    })

    if (!note) return res.status(404).json({ message: "Anotação não encontrada" })

    return res.status(200).json({
      message: "Anotação excluída com sucesso",
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
