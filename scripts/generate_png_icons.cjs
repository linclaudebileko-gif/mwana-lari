const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// PowerShell script that draws the refined, professional Mwana Lari emblem cleanly on PNG bitmaps
const psScript = `
Add-Type -AssemblyName System.Drawing

function Generate-MwanaIcon($size, $outputPath, $isMaskable = $false) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # 1. Warm Sunset Gradient Background (Amber #f59e0b to Terracotta #ea580c to Deep #9a3412)
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $cTop = [System.Drawing.Color]::FromArgb(255, 245, 158, 11)   # #f59e0b
    $cBot = [System.Drawing.Color]::FromArgb(255, 154, 52, 18)    # #9a3412
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $cTop, $cBot, 55.0)

    if ($isMaskable) {
        $g.FillRectangle($bgBrush, $rect)
    } else {
        $cornerRad = [int]($size * 0.22)
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = $cornerRad * 2
        $path.AddArc(0, 0, $d, $d, 180, 90)
        $path.AddArc($size - $d, 0, $d, $d, 270, 90)
        $path.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
        $path.AddArc(0, $size - $d, $d, $d, 90, 90)
        $path.CloseFigure()
        $g.FillPath($bgBrush, $path)

        # Subtle white glow border
        $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(45, 255, 255, 255), [Math]::Max(1.5, $size * 0.012))
        $g.DrawPath($borderPen, $path)
    }

    # Scale factor for maskable safe-zone (0.82 for maskable, 1.0 for standard)
    $scale = if ($isMaskable) { 0.80 } else { 1.0 }
    $center = $size * 0.5
    $offsetY = $size * 0.015

    # 2. Savanna Ivory Inner Disc
    $discRadius = [int]($size * 0.35 * $scale)
    $cx = [int]$center
    $cy = [int]($center + $offsetY)
    
    # Shadow behind inner circle
    $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, 69, 26, 3))
    $g.FillEllipse($shadowBrush, $cx - $discRadius, $cy - $discRadius + [int]($size * 0.018), $discRadius * 2, $discRadius * 2)

    $innerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 253, 246, 226)) # #fdf6e2
    $g.FillEllipse($innerBrush, $cx - $discRadius, $cy - $discRadius, $discRadius * 2, $discRadius * 2)

    # 3. Rising Sun of Wisdom behind Baobab
    $sunRadius = [int]($discRadius * 0.44)
    $sunX = $cx
    $sunY = $cy - [int]($discRadius * 0.38)
    $sunRect = New-Object System.Drawing.Rectangle(($sunX - $sunRadius), ($sunY - $sunRadius), ($sunRadius * 2), ($sunRadius * 2))
    $sunBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($sunRect, [System.Drawing.Color]::FromArgb(255, 254, 240, 138), [System.Drawing.Color]::FromArgb(255, 245, 158, 11), 90.0)
    $g.FillEllipse($sunBrush, $sunRect)

    # 4. Sacred Baobab Foliage (Layered Lush Emerald & Forest Green)
    $treeWidth = [int]($discRadius * 1.55)
    $treeHeight = [int]($discRadius * 0.95)
    $treeTop = $cy - [int]($discRadius * 0.70)
    $treeRect = New-Object System.Drawing.Rectangle(($cx - [int]($treeWidth/2)), $treeTop, $treeWidth, $treeHeight)
    $foliageBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($treeRect, [System.Drawing.Color]::FromArgb(255, 74, 222, 128), [System.Drawing.Color]::FromArgb(255, 20, 83, 45), 90.0)

    # Multi-cloud canopy clusters
    $g.FillEllipse($foliageBrush, $cx - [int]($discRadius * 0.65), $treeTop + [int]($treeHeight * 0.15), [int]($discRadius * 0.8), [int]($treeHeight * 0.75))
    $g.FillEllipse($foliageBrush, $cx - [int]($discRadius * 0.15), $treeTop + [int]($treeHeight * 0.15), [int]($discRadius * 0.8), [int]($treeHeight * 0.75))
    $g.FillEllipse($foliageBrush, $cx - [int]($discRadius * 0.45), $treeTop, [int]($discRadius * 0.9), [int]($treeHeight * 0.8))

    # 5. Ancient Baobab Trunk & Roots
    $trunkW = [int]($discRadius * 0.32)
    $trunkH = [int]($discRadius * 0.58)
    $trunkY = $cy - [int]($discRadius * 0.05)
    $trunkRect = New-Object System.Drawing.Rectangle(($cx - [int]($trunkW/2)), $trunkY, $trunkW, $trunkH)
    $trunkBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($trunkRect, [System.Drawing.Color]::FromArgb(255, 120, 53, 15), [System.Drawing.Color]::FromArgb(255, 69, 26, 3), 45.0)

    $trunkPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $trunkPath.AddLine($cx - [int]($trunkW * 0.45), $trunkY, $cx + [int]($trunkW * 0.45), $trunkY)
    $trunkPath.AddLine($cx + [int]($trunkW * 0.45), $trunkY, $cx + [int]($trunkW * 0.9), $trunkY + $trunkH)
    $trunkPath.AddLine($cx + [int]($trunkW * 0.9), $trunkY + $trunkH, $cx - [int]($trunkW * 0.9), $trunkY + $trunkH)
    $trunkPath.CloseFigure()
    $g.FillPath($trunkBrush, $trunkPath)

    # 6. Mascot Koko / Mwana Emblem (Center of Tree)
    $headR = [int]($discRadius * 0.22)
    $headY = $cy - [int]($discRadius * 0.26)
    $headBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 251, 191, 36))
    $g.FillEllipse($headBrush, $cx - $headR, $headY - $headR, $headR * 2, $headR * 2)

    # Kongo Headband (Green, Red)
    $hbPenGreen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 22, 163, 74), [Math]::Max(1.5, $size * 0.012))
    $hbPenRed = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 220, 38, 38), [Math]::Max(1.2, $size * 0.009))
    $g.DrawArc($hbPenGreen, $cx - $headR, $headY - $headR, $headR * 2, $headR * 2, 200, 140)
    $g.DrawArc($hbPenRed, $cx - $headR, $headY - $headR + [int]($size * 0.008), $headR * 2, $headR * 2, 200, 140)

    # Eyes & Smile
    $eyeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 69, 26, 3))
    $eyeR = [Math]::Max(1.5, $size * 0.012)
    $g.FillEllipse($eyeBrush, $cx - [int]($headR * 0.45), $headY - [int]($headR * 0.1), $eyeR * 2, $eyeR * 2)
    $g.FillEllipse($eyeBrush, $cx + [int]($headR * 0.45) - [int]($eyeR * 2), $headY - [int]($headR * 0.1), $eyeR * 2, $eyeR * 2)
    
    $smilePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 69, 26, 3), [Math]::Max(1.2, $size * 0.009))
    $g.DrawArc($smilePen, $cx - [int]($headR * 0.35), $headY, [int]($headR * 0.7), [int]($headR * 0.5), 20, 140)

    # 7. Open Golden Book of Roots at Base
    $bookW = [int]($discRadius * 1.05)
    $bookH = [int]($discRadius * 0.35)
    $bookY = $cy + [int]($discRadius * 0.44)
    
    $pageBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle(($cx - [int]($bookW/2)), $bookY, $bookW, $bookH)),
        [System.Drawing.Color]::White,
        [System.Drawing.Color]::FromArgb(255, 254, 243, 199),
        45.0
    )
    $bookPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $bookPath.AddLine($cx - [int]($bookW/2), $bookY, $cx, $bookY - [int]($bookH * 0.35))
    $bookPath.AddLine($cx, $bookY - [int]($bookH * 0.35), $cx + [int]($bookW/2), $bookY)
    $bookPath.AddLine($cx + [int]($bookW/2), $bookY, $cx + [int]($bookW/2), $bookY + $bookH)
    $bookPath.AddLine($cx + [int]($bookW/2), $bookY + $bookH, $cx, $bookY + [int]($bookH * 0.7))
    $bookPath.AddLine($cx, $bookY + [int]($bookH * 0.7), $cx - [int]($bookW/2), $bookY + $bookH)
    $bookPath.CloseFigure()
    $g.FillPath($pageBrush, $bookPath)

    $goldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 217, 119, 6), [Math]::Max(1.5, $size * 0.01))
    $g.DrawPath($goldPen, $bookPath)
    $g.DrawLine($goldPen, $cx, $bookY - [int]($bookH * 0.35), $cx, $bookY + [int]($bookH * 0.7))

    # Red Bookmark ribbon
    $ribbonBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 220, 38, 38))
    $rw = [Math]::Max(2, [int]($size * 0.015))
    $g.FillRectangle($ribbonBrush, $cx - [int]($rw/2), $bookY + [int]($bookH * 0.4), $rw, [int]($bookH * 0.5))

    # 8. Golden Sparkles of Wisdom ✨
    $sparkleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 254, 240, 138))
    $spR = [Math]::Max(2.0, $size * 0.015)
    $g.FillEllipse($sparkleBrush, $cx - [int]($discRadius * 0.8), $cy - [int]($discRadius * 0.5), $spR * 2, $spR * 2)
    $g.FillEllipse($sparkleBrush, $cx + [int]($discRadius * 0.75), $cy - [int]($discRadius * 0.5), $spR * 2, $spR * 2)

    # Cleanup & Save PNG
    $g.Dispose()
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "✅ PNG généré avec succès : $outputPath ($size x $size)"
}

Generate-MwanaIcon 192 "${path.join(iconsDir, 'icon-192x192.png').replace(/\\/g, '/')}" $false
Generate-MwanaIcon 512 "${path.join(iconsDir, 'icon-512x512.png').replace(/\\/g, '/')}" $false
Generate-MwanaIcon 512 "${path.join(iconsDir, 'icon-maskable-512x512.png').replace(/\\/g, '/')}" $true
Generate-MwanaIcon 144 "${path.join(iconsDir, 'icon-144x144.png').replace(/\\/g, '/')}" $false
Generate-MwanaIcon 96  "${path.join(iconsDir, 'icon-96x96.png').replace(/\\/g, '/')}" $false
`;

const psFilePath = path.join(__dirname, 'temp_gen_icons.ps1');
fs.writeFileSync(psFilePath, psScript, 'utf8');

try {
  console.log('🖼️ Génération des icônes PNG officielles haute résolution...');
  execSync(`powershell -ExecutionPolicy Bypass -File "${psFilePath}"`, { stdio: 'inherit' });
  console.log('🎉 Toutes les icônes PNG ont été générées avec succès !');
} finally {
  if (fs.existsSync(psFilePath)) fs.unlinkSync(psFilePath);
}
