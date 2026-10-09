import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const mode = process.argv[2];
const serverArgs = mode === "dev"
  ? [fileURLToPath(new URL("../node_modules/nodemon/bin/nodemon.js", import.meta.url)), "src/server.js"]
  : mode === "start"
    ? ["src/server.js"]
    : null;

if (!serverArgs) {
  console.error("Uso: node scripts/runWithSystemCa.js <dev|start>");
  process.exit(1);
}

const child = spawn(process.execPath, serverArgs, {
  env: { ...process.env, NODE_USE_SYSTEM_CA: "1" },
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
  console.error("Não foi possível iniciar o backend:", error.message);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  process.exitCode = signal ? 1 : code ?? 1;
});
