# Configura los paths
$origenBase = "C:\Users\marce\Documents\Oscar\Productos"
$destinoBase = "C:\Users\marce\Documents\BegamShop\tienda\public\assets\images"
$csvPath = "C:\Users\marce\Documents\BegamShop\tienda\imagenes_catalogo.csv"
$hostingURL = "https://begamshop-4b22b.web.app/assets/images"

# Inicializa el CSV
"CODIGO,NOMBRE_PRODUCTO,IMG1,IMG2,IMG3" | Out-File -Encoding UTF8 $csvPath

# Relaciona cada carpeta con su código (ajusta según tus datos reales)
$relacion = @{
    "Rodillos o Rueda para Camas" = "003"
    "Rodillos para Camas" = "005"
    "Tapon de desagote" = "007"
    "Vee de Proa" = "004"
    "Doble Cono Con Tornillos Chicos" = "001"
    "Doble Cono Con Tornillos Grande" = "002"
    "Doble cono grande sin tornillos" = "006"
}

# Procesa cada carpeta
foreach ($nombreProducto in $relacion.Keys) {
    $codigo = $relacion[$nombreProducto]
    $origen = Join-Path $origenBase $nombreProducto
    $imagenes = Get-ChildItem -Path $origen -File
    # Prioriza la imagen cuyo nombre es '1' (sin extensión)
    $img1 = $imagenes | Where-Object { $_.BaseName -eq '1' }
    $resto = $imagenes | Where-Object { $_.BaseName -ne '1' } | Sort-Object Name

    $imgUrls = @()
    $i = 1
    if ($img1) {
        $ext = $img1.Extension
        $nuevoNombre = "${codigo}_1${ext}"
        $destino = Join-Path $destinoBase $nuevoNombre
        Copy-Item $img1.FullName $destino -Force
        $imgUrls += "$hostingURL/$nuevoNombre"
        $i++
    }
    foreach ($img in $resto) {
        $ext = $img.Extension
        $nuevoNombre = "${codigo}_${i}${ext}"
        $destino = Join-Path $destinoBase $nuevoNombre
        Copy-Item $img.FullName $destino -Force
        $imgUrls += "$hostingURL/$nuevoNombre"
        $i++
    }

    while ($imgUrls.Count -lt 3) { $imgUrls += "" }

    "$codigo,""$nombreProducto"",""$($imgUrls[0])"",""$($imgUrls[1])"",""$($imgUrls[2])""" | Out-File -Encoding UTF8 -Append $csvPath
}

Write-Host "Imágenes copiadas y CSV generado en $csvPath"