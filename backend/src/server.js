import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({ path: [".env.local", ".env"] });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
