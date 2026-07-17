param(
    [string]$Mode = 'dev'
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pkgManager = 'pnpm'

if ($Mode -in @('pnpm','npm','yarn')) {
    $pkgManager = $Mode
    $Mode = 'dev'
}

Push-Location (Join-Path $scriptDir 'frontend')
if ($Mode -eq 'dev') {
    Write-Host "Starting frontend in dev mode with $pkgManager..."
    & $pkgManager run dev
    $code = $LASTEXITCODE
    Pop-Location
    exit $code
}

if ($Mode -eq 'prod') {
    Write-Host "Building frontend for production with $pkgManager..."
    & $pkgManager run build
    Write-Host "Previewing production build..."
    & $pkgManager run preview
    $code = $LASTEXITCODE
    Pop-Location
    exit $code
}

Write-Host "Unknown mode: $Mode"
Write-Host "Usage: .\start.frontend.ps1 [-Mode dev|prod|pnpm|npm|yarn]"
Pop-Location
exit 2
