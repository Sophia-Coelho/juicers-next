import { Router } from "express";
import {
  createDoctorInvite,
  getMyDoctorPatients,
  getMyDoctorPatientById,
  getMyDoctorPatientExams,
  uploadPatientExamPdf,
  deleteDoctorPatientExam,
  getDoctorPatientFollowup,
  createClinicalNote,
  updateClinicalNote,
  deleteClinicalNote,
  toggleRequestedExam,
  getMyDoctorProfile,
  getInviteByToken,
  acceptInvite,
} from "../controllers/doctorController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { verifiedDoctorMiddleware } from "../middlewares/verifiedDoctorMiddleware.js";
import { uploadPdf } from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/me", authMiddleware, verifiedDoctorMiddleware, getMyDoctorProfile);

router.post("/invites", authMiddleware, verifiedDoctorMiddleware, createDoctorInvite);

router.get("/patients", authMiddleware, verifiedDoctorMiddleware, getMyDoctorPatients);
router.get("/patients/:id", authMiddleware, verifiedDoctorMiddleware, getMyDoctorPatientById);
router.get("/patients/:id/exams", authMiddleware, verifiedDoctorMiddleware, getMyDoctorPatientExams);

router.post(
  "/patients/:id/exams/upload",
  authMiddleware,
  verifiedDoctorMiddleware,
  uploadPdf.single("examPdf"),
  uploadPatientExamPdf
);

router.delete(
  "/patients/:patientId/exams/:examId",
  authMiddleware,
  verifiedDoctorMiddleware,
  deleteDoctorPatientExam
);

router.get("/patients/:id/followup", authMiddleware, verifiedDoctorMiddleware, getDoctorPatientFollowup);
router.post("/patients/:id/notes", authMiddleware, verifiedDoctorMiddleware, createClinicalNote);
router.post("/patients/:id/requested-exams", authMiddleware, verifiedDoctorMiddleware, toggleRequestedExam);

router.put("/notes/:noteId", authMiddleware, verifiedDoctorMiddleware, updateClinicalNote);
router.delete("/notes/:noteId", authMiddleware, verifiedDoctorMiddleware, deleteClinicalNote);

router.get("/invites/:token", getInviteByToken);
router.post("/invites/:token/accept", authMiddleware, acceptInvite);

export default router;
