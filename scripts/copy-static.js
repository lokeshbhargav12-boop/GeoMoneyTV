const fs = require('fs');
const path = require('path');

const srcStatic = path.join(__dirname, '..', '.next', 'static');
const destStatic = path.join(__dirname, '..', 'public', '_next', 'static');

console.log('Copying Next.js static files for Hostinger compatibility...');

if (fs.existsSync(srcStatic)) {
  // Ensure public/_next exists
  const publicNextDir = path.join(__dirname, '..', 'public', '_next');
  if (!fs.existsSync(publicNextDir)) {
    fs.mkdirSync(publicNextDir, { recursive: true });
  }

  // Recursive copy function
  function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest);
      fs.readdirSync(src).forEach((childItemName) => {
        copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  copyRecursiveSync(srcStatic, destStatic);
  console.log('✅ Successfully copied .next/static to public/_next/static');
  console.log('This ensures LiteSpeed/Apache on Hostinger can serve the CSS/JS files directly.');
} else {
  console.log('⚠️ .next/static does not exist. Make sure to run this after next build.');
}
