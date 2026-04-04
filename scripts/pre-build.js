const fs = require('fs');
const path = require('path');

const publicNextDir = path.join(__dirname, '..', 'public', '_next');

if (fs.existsSync(publicNextDir)) {
  console.log('🧹 Cleaning up old public/_next directory before build to prevent Next.js conflict...');
  fs.rmSync(publicNextDir, { recursive: true, force: true });
}
