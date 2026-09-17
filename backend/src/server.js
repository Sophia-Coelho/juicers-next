import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDatabase } from "./config/database.js";
import userRoutes from "./routes/userRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

connectDatabase();

app.get("/", (req, res) => {
  res.json({
    message: "API Juicers funcionando",
  });
});

app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/doctors", doctorRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});