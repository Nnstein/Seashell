$baseUrl = "c:\Users\Nnstein's PC\Desktop\Google AntiGravity Projects\Seashell\Seashell-Menu-App\public\assets"
$landing = "$baseUrl\landing\landing.jpg"

function Download-Or-Fallback ($url, $dest) {
    try {
        # Try clean URL without query params
        Invoke-WebRequest -Uri $url -OutFile $dest -UserAgent "Mozilla/5.0" -ErrorAction Stop
        Write-Host "Downloaded $dest"
    }
    catch {
        Write-Host "Failed to download $url. Using fallback."
        if (Test-Path $landing) {
            Copy-Item $landing $dest -Force
            Write-Host "Copied fallback to $dest"
        }
    }
}

# Ensure landing exists (it should)
if (-not (Test-Path $landing)) {
    Write-Host "Critical: Landing image missing. Cannot use fallback."
    exit
}

# Missing Images Recovery
# Breakfast Category
$dest = "$baseUrl\images\categories\breakfast.jpg"
if (-not (Test-Path $dest)) { Download-Or-Fallback "https://images.unsplash.com/photo-1533089862017-ec329abb0a29" $dest }

# bk-1 (Same as breakfast category)
$dest = "$baseUrl\images\items\bk-1.jpg"
if (-not (Test-Path $dest)) {
    if (Test-Path "$baseUrl\images\categories\breakfast.jpg") {
        Copy-Item "$baseUrl\images\categories\breakfast.jpg" $dest -Force
    }
    else {
        Download-Or-Fallback "https://images.unsplash.com/photo-1533089862017-ec329abb0a29" $dest
    }
}

# bk-3
$dest = "$baseUrl\images\items\bk-3.jpg"
if (-not (Test-Path $dest)) { Download-Or-Fallback "https://images.unsplash.com/photo-1525351484163-7529414395d8" $dest }

# bk-11
$dest = "$baseUrl\images\items\bk-11.jpg"
if (-not (Test-Path $dest)) { Download-Or-Fallback "https://images.unsplash.com/photo-1521483450421-a0589197e595" $dest }

# Malt
$dest = "$baseUrl\images\categories\malt.jpg"
if (-not (Test-Path $dest)) { Download-Or-Fallback "https://images.unsplash.com/photo-1606759368364-82a1792614b8" $dest }

# Handle duplicate item images (bk-8, bk-9 are copies of bk-7)
if (Test-Path "$baseUrl\images\items\bk-7.jpg") {
    if (-not (Test-Path "$baseUrl\images\items\bk-8.jpg")) { Copy-Item "$baseUrl\images\items\bk-7.jpg" "$baseUrl\images\items\bk-8.jpg" -Force }
    if (-not (Test-Path "$baseUrl\images\items\bk-9.jpg")) { Copy-Item "$baseUrl\images\items\bk-7.jpg" "$baseUrl\images\items\bk-9.jpg" -Force }
}

Write-Host "Recovery complete."
