import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import {
  CfmVerificationError,
  verifyDoctorWithCfm,
} from "../services/cfmService.js";
import { isLegacyDoctorDemoEnabled } from "../utils/legacyDoctorDemo.js";

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
        !verifiedDoctor &&
        Boolean(doctorProfile) &&
        isLegacyDoctorDemoEnabled(user.email);

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
    const { name, email } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Nome é obrigatório",
        });
      }

      updates.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({
          message: "Informe um e-mail válido",
        });
      }

      updates.email = email.trim().toLowerCase();
      const existingUser = await User.findOne({
        email: updates.email,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(409).json({
          message: "Este e-mail já está cadastrado",
        });
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Informe os dados que deseja atualizar",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
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
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({
        message: "Este e-mail já está cadastrado",
      });
    }

    return res.status(500).json({
      message: error.message,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Informe a senha atual e a nova senha",
      });
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({
        message: "A nova senha deve ter pelo menos 6 caracteres",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const currentPasswordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!currentPasswordMatches) {
      return res.status(401).json({ message: "A senha atual está incorreta" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: "Senha alterada com sucesso" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
