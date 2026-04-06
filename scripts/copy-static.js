const fs = require('fs');
const path = require('path');

// ── DEPRECATED ────────────────────────────────────────────────────────────────
// copy-static.js is NO LONGER NEEDED and should NOT be run.
//
// Previously this copied .next/static → public/_next/static so Apache could
// serve CSS/JS directly. This caused a critical bug: after every rebuild the
// CSS file hash changes, but Apache kept serving the OLD hash from public/_next,
// resulting in a completely unstyled page for users.
//
// The fix: Apache now proxies ALL requests (including /_next/static/) to
// Next.js via the RewriteRule in public/.htaccess. Next.js serves its own
// static files correctly with the current build hash.
//
// server.js also auto-deletes public/_next at startup to remove any stale copy.
// ─────────────────────────────────────────────────────────────────────────────

const publicNextDir = path.join(__dirname, '..', 'public', '_next');

if (fs.existsSync(publicNextDir)) {
  fs.rmSync(publicNextDir, { recursive: true, force: true });
  console.log('✅ Removed stale public/_next directory (safe to ignore this script).');
} else {
  console.log('ℹ️  public/_next does not exist — nothing to clean up.');
}
console.warn('⚠️  copy-static.js is deprecated. Do not run it. Apache proxy handles /_next/ now.');
