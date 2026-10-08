import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import {
  CfmVerificationError,
  verifyDoctorWithCfm,
} from "../services/cfmService.js";

function isLegacyDoctorDemoEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.ALLOW_LEGACY_DOCTOR_DEMO === "true"
  );
}

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role = "patient", doctorVerification } = req.body;

    if (!["patient", "doctor"].includes(role)) {
      return res.status(400).json({ message: "Perfil de usuário inválido" });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Nome, e-mail e senha são obrigatórios",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Usuário já existe",
      });
    }

    let doctorRecord = null;
    if (role === "doctor") {
      doctorRecord = await verifyDoctorWithCfm(doctorVerification || {});
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    if (user.role === "doctor") {
      await Doctor.create({
        userId: user._id,
        crm: doctorRecord.crm,
        crmUf: doctorRecord.uf,
        cfmVerifiedAt: doctorRecord.verifiedAt,
      });
    }

    return res.status(201).json({
      message: "Usuário criado com sucesso",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof CfmVerificationError) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "E-mail e senha são obrigatórios",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "E-mail ou senha inválidos",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "E-mail ou senha inválidos",
      });
    }

    let legacyDemoLogin = false;
    if (user.role === "doctor") {
      const doctorProfile = await Doctor.findOne({ userId: user._id });
      const verifiedDoctor = Boolean(doctorProfile?.cfmVerifiedAt);
      legacyDemoLogin =
        !verifiedDoctor && Boolean(doctorProfile) && isLegacyDoctorDemoEnabled();

      if (!verifiedDoctor && !legacyDemoLogin) {
        return res.status(403).json({
          message: "Este perfil médico ainda não foi verificado pelo CFM.",
          code: "DOCTOR_VERIFICATION_REQUIRED",
        });
      }
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Login realizado com sucesso",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.role === "doctor"
          ? { doctorVerificationMode: legacyDemoLogin ? "legacy-demo" : "cfm" }
          : {}),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const reverifyDoctor = async (req, res) => {
  try {
    const { email, password, doctorVerification } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "E-mail e senha são obrigatórios",
      });
    }

    const user = await User.findOne({ email });
    if (!user || user.role !== "doctor" || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "E-mail ou senha inválidos" });
    }

    const verification = await verifyDoctorWithCfm(doctorVerification || {});

    await Doctor.findOneAndUpdate(
      { userId: user._id },
      {
        crm: verification.crm,
        crmUf: verification.uf,
        cfmVerifiedAt: verification.verifiedAt,
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
      }
    );

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "CRM validado e perfil médico reativado.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        doctorVerificationMode: "cfm",
      },
    });
  } catch (error) {
    if (error instanceof CfmVerificationError) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Nome é obrigatório",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { name },
      {
        returnDocument: "after",
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado",
      });
    }

    return res.status(200).json({
      message: "Usuário atualizado com sucesso",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
