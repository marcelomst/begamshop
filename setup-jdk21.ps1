[propertyType] $PropertyName# Setup JDK 21 for Firebase Emulators (Windows PowerShell)
# - Instala Temurin JDK 21 via winget
# - Actualiza PATH del usuario y de la sesión actual
# - Verifica java -version

# Requiere permisos para instalar con winget
Write-Host "Installing Temurin JDK 21 via winget..." -ForegroundColor Cyan
try {
    winget install --id EclipseAdoptium.Temurin.21.JDK -e --silent
} catch {
    Write-Warning "winget install failed or winget not available. Please install JDK 21 manually from https://adoptium.net/21/."
}

# Detectar ruta de instalación por defecto
$defaultJdkPath = "C:\\Program Files\\Eclipse Adoptium\\jdk-21"
if (!(Test-Path $defaultJdkPath)) {
    # Buscar posibles rutas instaladas bajo Program Files
    $candidate = Get-ChildItem "C:\\Program Files\\Eclipse Adoptium" -Directory -ErrorAction SilentlyContinue |
                 Where-Object { $_.Name -match '^jdk-21' } |
                 Select-Object -First 1
    if ($candidate) {
        $defaultJdkPath = $candidate.FullName
    }
}

Write-Host "Detected JDK path: $defaultJdkPath" -ForegroundColor Cyan

if (!(Test-Path "$defaultJdkPath\\bin\\java.exe")) {
    Write-Warning "JDK 21 not found at $defaultJdkPath. If winget failed, please install manually and re-run."
} else {
    # Actualizar PATH del usuario de forma persistente
    $userPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
    if ($userPath -notlike "*$defaultJdkPath\\bin*") {
        $newUserPath = "$defaultJdkPath\\bin;" + $userPath
        [Environment]::SetEnvironmentVariable('PATH', $newUserPath, 'User')
        Write-Host "User PATH updated persistently." -ForegroundColor Green
    } else {
        Write-Host "User PATH already contains JDK 21 bin." -ForegroundColor Yellow
    }

    # Actualizar PATH de la sesión actual
    $env:PATH = "$defaultJdkPath\\bin;" + $env:PATH

    # Verificar versión
    Write-Host "Verifying java -version..." -ForegroundColor Cyan
    try {
        & java -version
    } catch {
        Write-Warning "java command not found. Ensure PATH is set and restart your terminal/session."
    }
}

Write-Host "Setup complete. You can now start Firebase emulators." -ForegroundColor Green
