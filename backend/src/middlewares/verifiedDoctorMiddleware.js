import Doctor from "../models/Doctor.js";

export const verifiedDoctorMiddleware = async (req, res, next) => {
  if (req.user?.role !== "doctor") {
    return res.status(403).json({
      message: "Apenas médicos verificados podem acessar este recurso.",
    });
  }

  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    const verifiedByCfm = Boolean(doctor?.cfmVerifiedAt);
    const legacyDemoEnabled =
      process.env.NODE_ENV === "development" &&
      process.env.ALLOW_LEGACY_DOCTOR_DEMO === "true";

    if (!verifiedByCfm && !(doctor && legacyDemoEnabled)) {
      return res.status(403).json({
        message: "Este perfil médico ainda não foi verificado pelo CFM.",
      });
    }

    return next();
  } catch {
    return res.status(500).json({ message: "Erro ao validar perfil médico." });
  }
};
