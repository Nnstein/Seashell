# Seashell Monorepo Deploy Script
$ErrorActionPreference = "Stop"

Write-Host "Cleaning public directory and dist folders..."
if (Test-Path "public") {
    Remove-Item -Path "public\*" -Recurse -Force -ErrorAction SilentlyContinue
}

$apps = Get-ChildItem -Path "apps" -Directory

foreach ($app in $apps) {
    $distPath = Join-Path $app.FullName "dist"
    if (Test-Path $distPath) {
        Remove-Item -Path $distPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   Cleaned $($app.Name)/dist"
    }
}

Write-Host "Creating directory structure..."
New-Item -ItemType Directory -Force -Path "public" | Out-Null
New-Item -ItemType Directory -Force -Path "public\management" | Out-Null
New-Item -ItemType Directory -Force -Path "public\housekeeping" | Out-Null
New-Item -ItemType Directory -Force -Path "public\housekeeping-management" | Out-Null

Write-Host "Building apps sequentially..."

foreach ($app in $apps) {
    Write-Host "   Processing $($app.Name)..."
    Push-Location $app.FullName
    try {
        Write-Host "   Building in $(Get-Location)"
        # Use cmd /c to ensure we use the shell's path resolution for npm
        cmd /c "npm run build"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "BUILD FAILED for $($app.Name)" -ForegroundColor Red
            exit 1
        }
        
        if (-not (Test-Path "dist")) {
            Write-Host "ERROR: dist folder missing after build for $($app.Name)" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "Exception during build: $_" -ForegroundColor Red
        exit 1
    }
    finally {
        Pop-Location
    }
    Write-Host "   Success: $($app.Name)"
}

Write-Host "Copying Artifacts..."

# Menu App (Root)
if (Test-Path "apps\menu-app\dist") {
    Write-Host "Copying Menu App..."
    Copy-Item -Path "apps\menu-app\dist\*" -Destination "public" -Recurse -Force
}
else {
    Write-Error "Menu App dist not found!"
}

# Management App
if (Test-Path "apps\management-app\dist") {
    Write-Host "Copying Management App..."
    Copy-Item -Path "apps\management-app\dist\*" -Destination "public\management" -Recurse -Force
}
else {
    Write-Error "Management App dist not found!"
}

# Housekeeping App
if (Test-Path "apps\housekeeping-app\dist") {
    Write-Host "Copying Housekeeping App..."
    Copy-Item -Path "apps\housekeeping-app\dist\*" -Destination "public\housekeeping" -Recurse -Force
}
else {
    Write-Error "Housekeeping App dist not found!"
}

# Housekeeping Management App
if (Test-Path "apps\housekeeping-management-app\dist") {
    Write-Host "Copying Housekeeping Management App..."
    Copy-Item -Path "apps\housekeeping-management-app\dist\*" -Destination "public\housekeeping-management" -Recurse -Force
}
else {
    Write-Error "Housekeeping Management App dist not found!"
}

Write-Host "Deployment preparation complete!"
Write-Host "Run 'firebase deploy --only hosting' to deploy"
