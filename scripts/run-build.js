/************************************************************
 * GeoMoney TV - Next.js Production Build Runner
 * Constrains Rust/Tokio/Rayon/libuv worker threads to prevent
 * OS thread exhaustion (os error 11 / EAGAIN) on shared hosts.
 ************************************************************/

const { spawnSync } = require("child_process");
const path = require("path");

const env = {
  ...process.env,
  TOKIO_WORKER_THREADS: process.env.TOKIO_WORKER_THREADS || "1",
  RAYON_NUM_THREADS: process.env.RAYON_NUM_THREADS || "1",
  UV_THREADPOOL_SIZE: process.env.UV_THREADPOOL_SIZE || "2",
  NEXT_TELEMETRY_DISABLED: "1",
};

const nextBin = require.resolve("next/dist/bin/next");

const result = spawnSync(process.execPath, [nextBin, "build"], {
  stdio: "inherit",
  env,
  cwd: path.join(__dirname, ".."),
});

if (result.error) {
  console.error("Failed to start Next.js build:", result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
