$ErrorActionPreference = "Stop"

Write-Host "Preparing GeoMoney for Hostinger Deployment..." -ForegroundColor Cyan

Write-Host "Cleaning up old build files..."
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "public/_next") { Remove-Item -Recurse -Force "public/_next" }
if (Test-Path "GeoMoney_Hostinger.zip") { Remove-Item -Force "GeoMoney_Hostinger.zip" }

Write-Host "Building the Next.js application..." -ForegroundColor Yellow
npm run build

# Remove public/_next AGAIN in case copy-static.js or any plugin recreated it during build.
# A stale public/_next in public_html causes Apache to serve old CSS hashes → unstyled pages.
if (Test-Path "public/_next") {
    Write-Host "Removing public/_next created during build (not needed — Apache proxy handles this)..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "public/_next"
}

Write-Host "Creating GeoMoney_Hostinger.zip..." -ForegroundColor Yellow
Compress-Archive -Path "src", "public", ".next", "prisma", "scripts", "package.json", "package-lock.json", "server.js", "next.config.js", "tailwind.config.ts", "postcss.config.js", "tsconfig.json", ".env" -DestinationPath "GeoMoney_Hostinger.zip" -Force

Write-Host "DONE! You can now upload 'GeoMoney_Hostinger.zip' to Hostinger." -ForegroundColor Green
