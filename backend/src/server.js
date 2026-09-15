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

// Configuração do CORS
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Express 5: rota coringa com parâmetro nomeado
app.options("/{*splat}", cors());

// Permite receber JSON nas requisições
app.use(express.json());

// Conexão com o banco de dados
connectDatabase();

// Rota principal
app.get("/", (req, res) => {
  res.json({
    message: "API Juicers funcionando",
  });
});

// Rotas da API
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/doctors", doctorRoutes);

// Inicialização do servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});