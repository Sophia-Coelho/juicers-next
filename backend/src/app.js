import express from "express";
import cors from "cors";
import { connectDatabase } from "./config/database.js";
import userRoutes from "./routes/userRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";

const app = express();

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "API Juicers funcionando" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "API Juicers funcionando" });
});

app.use(async (req, _res, next) => {
  if (req.path === "/api/health") return next();

  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/doctors", doctorRoutes);

app.use((error, _req, res, _next) => {
  console.error("Erro na API Juicers:", error.message);
  res.status(503).json({ message: "A API está temporariamente indisponível." });
});

export default app;
