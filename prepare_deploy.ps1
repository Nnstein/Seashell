# Create public directories
New-Item -ItemType Directory -Force -Path "public"
New-Item -ItemType Directory -Force -Path "public\management"

# Create public directories
New-Item -ItemType Directory -Force -Path "public"
New-Item -ItemType Directory -Force -Path "public\management"

# Copy Menu App build (Root)
Write-Host "Copying Menu App..."
Copy-Item -Path "Seashell-Menu-App\dist\*" -Destination "public" -Recurse -Force

# Copy Management App build (Subpath)
Write-Host "Copying Management App..."
Copy-Item -Path ".\Seashell-Management-App\dist\*" -Destination ".\public\management" -Recurse -Force

# Housekeeping App
Write-Host "Copying Housekeeping App..."
if (-not (Test-Path ".\public\housekeeping")) {
    New-Item -ItemType Directory -Force -Path ".\public\housekeeping"
}
Copy-Item -Path ".\Seashell-Housekeeping-App\dist\*" -Destination ".\public\housekeeping" -Recurse -Force

# Housekeeping Management App
Write-Host "Copying Housekeeping Management App..."
if (-not (Test-Path ".\public\housekeeping-management")) {
    New-Item -ItemType Directory -Force -Path ".\public\housekeeping-management"
}
Copy-Item -Path ".\Seashell-Housekeeping-Management-App\dist\*" -Destination ".\public\housekeeping-management" -Recurse -Force

Write-Host "Deployment preparation complete!"
