const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const path = require("path");
const https = require("https");
const fs = require("fs");

// ── Startup cleanup ──────────────────────────────────────────────────────────
// Remove public/_next if it exists. A stale _next folder inside public_html
// causes Apache to serve old, hashed CSS/JS files instead of proxying the
// live /_next/static/ requests to Next.js, resulting in an unstyled page.
const staleNextDir = path.join(__dirname, "public", "_next");
if (fs.existsSync(staleNextDir)) {
  fs.rmSync(staleNextDir, { recursive: true, force: true });
  console.log("[Startup] Removed stale public/_next directory.");
}
// ─────────────────────────────────────────────────────────────────────────────

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = process.env.PORT || 3000;

const app = next({
  dev,
  conf: {
    distDir: ".next",
  },
});

const handle = app.getRequestHandler();

function runNewsSync() {
  console.log(`[Scheduler] Running news sync at ${new Date().toISOString()}`);
  const options = {
    hostname: "127.0.0.1",
    port: port,
    path: "/api/cron/sync",
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET || ""}`,
    },
  };
  const req = require("http").request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      try {
        const result = JSON.parse(data);
        console.log(
          `[Scheduler] Sync complete — news: ${result.synced?.news ?? "?"}`,
          `tickers: ${result.synced?.tickers ?? "?"}`,
          `videos: ${result.synced?.videos?.added ?? "?"}`,
        );
      } catch {
        console.log("[Scheduler] Sync response:", data.slice(0, 200));
      }
    });
  });
  req.on("error", (err) =>
    console.error("[Scheduler] Sync failed:", err.message),
  );
  req.end();
}

app.prepare().then(() => {
  // Run news sync immediately on startup, then every hour
  setTimeout(() => {
    runNewsSync();
    setInterval(runNewsSync, 60 * 60 * 1000);
  }, 15000); // wait 15s after boot before first sync

  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      // Handle service worker
      if (pathname === "/sw.js") {
        res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
        res.setHeader("Content-Type", "application/javascript");
        res.end("");
        return;
      }

      // Let Next.js handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://0.0.0.0:${port}`);
    });
});
