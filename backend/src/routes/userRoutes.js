import { Router } from "express";
import {
  createUser,
  loginUser,
  reverifyDoctor,
  changePassword,
  updateUserProfile,
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    message: "Rota de usuários funcionando",
  });
});

router.post("/", createUser);
router.post("/login", loginUser);
router.post("/verify-doctor", reverifyDoctor);

router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Perfil carregado",
    user: req.user,
  });
});

router.put("/profile", authMiddleware, updateUserProfile);
router.put("/password", authMiddleware, changePassword);

export default router;
