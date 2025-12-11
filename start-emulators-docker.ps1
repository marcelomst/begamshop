param(
  [switch]$Rebuild
)

Push-Location "$PSScriptRoot"
if ($Rebuild) { docker compose build --no-cache }
docker compose up -d
Pop-Location
