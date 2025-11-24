# Create public directories
New-Item -ItemType Directory -Force -Path "public"
New-Item -ItemType Directory -Force -Path "public\management"

# Copy Menu App build (Root)
Write-Host "Copying Menu App..."
Copy-Item -Path "Seashell-Menu-App\dist\*" -Destination "public" -Recurse -Force

# Copy Management App build (Subpath)
Write-Host "Copying Management App..."
Copy-Item -Path "Seashell-Management-App\dist\*" -Destination "public\management" -Recurse -Force

Write-Host "Deployment preparation complete!"
