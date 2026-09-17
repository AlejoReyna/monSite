import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
if (!args.includes("--allow-server")) {
  console.error(
    "Servidor desactivado por defecto: este equipo ha sufrido bloqueos. " +
    "Para iniciarlo deliberadamente usa: npm run dev -- --allow-server",
  );
  process.exit(1);
}
if (args.some((arg) => /^--(?:turbo|turbopack)(?:=|$)/.test(arg))) {
  console.error("Este arranque usa Webpack para evitar la ruta de Turbopack investigada.");
  process.exit(1);
}

const child = spawn(process.execPath, [
  "--max-old-space-size=1536",
  fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url)),
  "dev",
  "--webpack",
  ...args.filter((arg) => arg !== "--allow-server"),
], {
  cwd: fileURLToPath(new URL("..", import.meta.url)),
  stdio: "inherit",
  env: {
    ...process.env,
    // Inherit the heap limit in Node workers as well. This is not an RSS cap.
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --max-old-space-size=1536`.trim(),
    RAYON_NUM_THREADS: "2",
  },
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1);
});
