/************************************************************
 * GeoMoney TV - Next.js Production Build Runner
 * Constrains Rust/Tokio/Rayon/libuv worker threads and runs
 * Next.js in-process to prevent OS process/thread exhaustion
 * (os error 11 / EAGAIN) on CloudLinux/Hostinger shared hosts.
 ************************************************************/

process.env.TOKIO_WORKER_THREADS = process.env.TOKIO_WORKER_THREADS || "1";
process.env.RAYON_NUM_THREADS = process.env.RAYON_NUM_THREADS || "1";
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || "2";
process.env.NEXT_TELEMETRY_DISABLED = "1";
process.env.NODE_ENV = "production";

const os = require("os");
const originalCpus = os.cpus.bind(os);
os.cpus = () => {
  const cpus = originalCpus();
  return cpus && cpus.length > 0 ? [cpus[0]] : [{ model: "cpu", speed: 2000, times: { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 } }];
};

process.argv = [process.execPath, require.resolve("next/dist/bin/next"), "build"];
require("next/dist/bin/next");
