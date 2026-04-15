# Build All Apps Script
# Run from Seashell root folder

Write-Host "Building All Seashell Apps" -ForegroundColor Cyan

# Clean public
if (Test-Path "public") { Remove-Item -Recurse -Force public }
New-Item -ItemType Directory -Path public | Out-Null
Write-Host "Cleaned public folder" -ForegroundColor Green

# Menu App
Write-Host "Building Menu App..." -ForegroundColor Yellow
Set-Location apps/menu-app
npm run build
Set-Location ../..
Copy-Item -Recurse -Force apps/menu-app/dist/* public/
Write-Host "Menu App done" -ForegroundColor Green

# Management App
Write-Host "Building Management App..." -ForegroundColor Yellow
Set-Location apps/management-app
npm run build
Set-Location ../..
New-Item -ItemType Directory -Path public/management -Force | Out-Null
Copy-Item -Recurse -Force apps/management-app/dist/* public/management/
Write-Host "Management App done" -ForegroundColor Green

# Housekeeping App
Write-Host "Building Housekeeping App..." -ForegroundColor Yellow
Set-Location apps/housekeeping-app
npm run build
Set-Location ../..
New-Item -ItemType Directory -Path public/housekeeping -Force | Out-Null
Copy-Item -Recurse -Force apps/housekeeping-app/dist/* public/housekeeping/
Write-Host "Housekeeping App done" -ForegroundColor Green

# Housekeeping Management App
Write-Host "Building Housekeeping Management App..." -ForegroundColor Yellow
Set-Location apps/housekeeping-management-app
npm run build
Set-Location ../..
New-Item -ItemType Directory -Path public/housekeeping-management -Force | Out-Null
Copy-Item -Recurse -Force apps/housekeeping-management-app/dist/* public/housekeeping-management/
Write-Host "Housekeeping Management App done" -ForegroundColor Green

Write-Host "All apps built! Now run: firebase deploy" -ForegroundColor Cyan
