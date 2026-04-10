const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const path = require("path");
const https = require("https");
const fs = require("fs");

// ── Startup cleanup ──────────────────────────────────────────────────────────
// Remove public_html/_next if it exists. A stale _next folder outside
// the Next.js process causes Apache/Passenger to serve old static files.
const staleNextDirPublic = path.join(__dirname, "public", "_next");
const staleNextDirRoot = path.join(__dirname, "_next");

try {
  if (fs.existsSync(staleNextDirPublic)) {
    fs.rmSync(staleNextDirPublic, { recursive: true, force: true });
  }
} catch (e) {}

try {
  // Be very careful not to delete .next, only _next which is generated if users copy static exports
  if (fs.existsSync(staleNextDirRoot) && !staleNextDirRoot.endsWith(".next")) {
    fs.rmSync(staleNextDirRoot, { recursive: true, force: true });
  }
} catch (e) {}
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

function runIntelligenceReport() {
  console.log(
    `[Scheduler] Running daily intelligence report at ${new Date().toISOString()}`,
  );
  const options = {
    hostname: "127.0.0.1",
    port: port,
    path: "/api/cron/intelligence-report",
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
        if (result.success) {
          console.log(
            `[Scheduler] Intelligence report sent — ${result.sentCount}/${result.totalRecipients} recipients.`,
          );
        } else {
          console.error(
            "[Scheduler] Intelligence report failed:",
            result.error,
          );
        }
      } catch {
        console.log(
          "[Scheduler] Intelligence report response:",
          data.slice(0, 200),
        );
      }
    });
  });
  req.on("error", (err) =>
    console.error(
      "[Scheduler] Intelligence report request failed:",
      err.message,
    ),
  );
  req.end();
}

/**
 * Schedule a callback to run daily at a specific UTC hour and minute.
 * Fires once at the next occurrence, then repeats every 24 hours.
 */
function scheduleDailyAt(utcHour, utcMinute, label, fn) {
  function msUntilNext() {
    const now = new Date();
    const next = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        utcHour,
        utcMinute,
        0,
        0,
      ),
    );
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    return next - now;
  }

  function schedule() {
    const delay = msUntilNext();
    const fireAt = new Date(Date.now() + delay).toISOString();
    console.log(`[Scheduler] ${label} scheduled — next run at ${fireAt} UTC`);
    setTimeout(() => {
      fn();
      setInterval(fn, 24 * 60 * 60 * 1000);
    }, delay);
  }

  schedule();
}

let missingStaticAssetsCount = 0;

app.prepare().then(() => {
  // Run news sync immediately on startup, then every hour
  setTimeout(() => {
    runNewsSync();
    setInterval(runNewsSync, 60 * 60 * 1000);
  }, 15000); // wait 15s after boot before first sync

  // Daily Intelligence Report — 11:20 AM IST = 05:50 UTC
  scheduleDailyAt(5, 50, "Intelligence Report", runIntelligenceReport);

  createServer(async (req, res) => {
    try {
      // Fix for proxies that pass absolute URLs like HTTP/1.1 proxy requests
      if (req.url && req.url.startsWith("http")) {
        try {
          const u = new URL(req.url);
          req.url = u.pathname + u.search;
        } catch (e) {}
      }

      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      // Anti-White-Screen / Cache Invalidater:
      // If Next.js consistently returns 404 for its own generated CSS/JS files,
      // it means the App Router HTML cache in memory is Stale (points to an older build).
      // Restarting the Node process forces the RAM cache to clear and loads the new HTML.
      res.on("finish", () => {
        if (
          res.statusCode === 404 &&
          pathname &&
          pathname.startsWith("/_next/static/")
        ) {
          missingStaticAssetsCount++;
          if (missingStaticAssetsCount >= 3) {
            console.error(
              `[FATAL] Missing Next.js static assets detected (stale HTML cache). Initiating auto-recovery restart...`,
            );
            try {
              const restartTxt = path.join(__dirname, "tmp", "restart.txt");
              if (fs.existsSync(path.dirname(restartTxt)))
                fs.writeFileSync(restartTxt, Date.now().toString());
            } catch (e) {}
            setTimeout(() => process.exit(1), 500); // Allow current request to finish, then crash/restart
          }
        } else if (
          res.statusCode === 200 &&
          pathname &&
          pathname.startsWith("/_next/static/")
        ) {
          missingStaticAssetsCount = 0; // Reset counter on successful static asset serving
        }
      });

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
