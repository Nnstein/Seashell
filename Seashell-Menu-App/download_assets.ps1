$baseUrl = "c:\Users\Nnstein's PC\Desktop\Google AntiGravity Projects\Seashell\Seashell-Menu-App\public\assets"

# Ensure directories exist
New-Item -ItemType Directory -Force -Path "$baseUrl\images\categories"
New-Item -ItemType Directory -Force -Path "$baseUrl\images\items"
New-Item -ItemType Directory -Force -Path "$baseUrl\videos"
New-Item -ItemType Directory -Force -Path "$baseUrl\landing"

$downloads = @{
    "$baseUrl\landing\landing.jpg"                = "https://images.unsplash.com/photo-1453614512568-c4024d13c247?q=80&w=2832&auto=format&fit=crop"
    
    # Category Images
    "$baseUrl\images\categories\hot.jpg"          = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80"
    "$baseUrl\images\categories\cold.jpg"         = "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"
    "$baseUrl\images\categories\frappe.jpg"       = "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80"
    "$baseUrl\images\categories\appetizers.jpg"   = "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=600&q=80"
    "$baseUrl\images\categories\pizza.jpg"        = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"
    "$baseUrl\images\categories\pasta.jpg"        = "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=600&q=80"
    "$baseUrl\images\categories\main.jpg"         = "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=600&q=80"
    "$baseUrl\images\categories\sweets.jpg"       = "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80"
    "$baseUrl\images\categories\breakfast.jpg"    = "https://images.unsplash.com/photo-1533089862017-ec329abb0a29?auto=format&fit=crop&w=1200&q=80"
    "$baseUrl\images\categories\smoothies.jpg"    = "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=1200&q=80"
    "$baseUrl\images\categories\milkshakes.jpg"   = "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80"
    "$baseUrl\images\categories\fresh-juices.jpg" = "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=1200&q=80"
    "$baseUrl\images\categories\cocktails.jpg"    = "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80"
    "$baseUrl\images\categories\malt.jpg"         = "https://images.unsplash.com/photo-1606759368364-82a1792614b8?auto=format&fit=crop&w=1200&q=80"
    "$baseUrl\images\categories\refreshing.jpg"   = "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80"
    "$baseUrl\images\categories\soups.jpg"        = "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80"
    "$baseUrl\images\categories\salads.jpg"       = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80"
    "$baseUrl\images\categories\risotto.jpg"      = "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1200&q=80"

    # Category Videos
    "$baseUrl\videos\hot.mp4"                     = "https://videos.pexels.com/video-files/855018/855018-hd_1920_1080_30fps.mp4"
    "$baseUrl\videos\cold.mp4"                    = "https://videos.pexels.com/video-files/4109396/4109396-uhd_2560_1440_25fps.mp4"
    "$baseUrl\videos\frappe.mp4"                  = "https://videos.pexels.com/video-files/3007262/3007262-hd_1920_1080_24fps.mp4"
    "$baseUrl\videos\appetizers.mp4"              = "https://videos.pexels.com/video-files/5634926/5634926-uhd_3840_2160_24fps.mp4"
    "$baseUrl\videos\pizza.mp4"                   = "https://videos.pexels.com/video-files/3015488/3015488-uhd_2560_1440_24fps.mp4"
    "$baseUrl\videos\pasta.mp4"                   = "https://videos.pexels.com/video-files/3209663/3209663-uhd_2560_1440_25fps.mp4"
    "$baseUrl\videos\main.mp4"                    = "https://videos.pexels.com/video-files/4253255/4253255-uhd_3840_2160_30fps.mp4"
    "$baseUrl\videos\sweets.mp4"                  = "https://videos.pexels.com/video-files/4689866/4689866-uhd_3840_2160_25fps.mp4"
    "$baseUrl\videos\breakfast.mp4"               = "https://videos.pexels.com/video-files/2941916/2941916-uhd_2560_1440_24fps.mp4"

    # Breakfast Items
    "$baseUrl\images\items\bk-1.jpg"              = "https://images.unsplash.com/photo-1533089862017-ec329abb0a29?auto=format&fit=crop&w=800&q=80"
    "$baseUrl\images\items\bk-2.jpg"              = "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80"
    "$baseUrl\images\items\bk-3.jpg"              = "https://images.unsplash.com/photo-1525351484163-7529414395d8?auto=format&fit=crop&w=800&q=80"
    "$baseUrl\images\items\bk-4.jpg"              = "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=800&q=80"
    "$baseUrl\images\items\bk-5.jpg"              = "https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=800&q=80"
    "$baseUrl\images\items\bk-6.jpg"              = "https://images.unsplash.com/photo-1598373182133-52452f7691ef?auto=format&fit=crop&w=800&q=80"
    "$baseUrl\images\items\bk-7.jpg"              = "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80"
    # bk-8, bk-9 use same image as bk-7, I'll allow them to point to same file in data.ts or download copies.
    "$baseUrl\images\items\bk-10.jpg"             = "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=800&q=80"
    "$baseUrl\images\items\bk-11.jpg"             = "https://images.unsplash.com/photo-1521483450421-a0589197e595?auto=format&fit=crop&w=800&q=80"
    "$baseUrl\images\items\bk-12.jpg"             = "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=800&q=80"
}

foreach ($item in $downloads.GetEnumerator()) {
    $path = $item.Key
    $url = $item.Value
    
    if (-not (Test-Path $path)) {
        Write-Host "Downloading $path..."
        try {
            # Use specific UserAgent to avoid 403s from some CDNs
            Invoke-WebRequest -Uri $url -OutFile $path -UserAgent "Mozilla/5.0" -ErrorAction Stop
        }
        catch {
            Write-Host "Failed to download $url to $path : $_"
        }
    }
    else {
        Write-Host "Skipping existing $path"
    }
}
