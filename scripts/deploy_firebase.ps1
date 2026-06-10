$ErrorActionPreference = "Stop"

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

$nodeDir = "C:\Program Files\nodejs"
if (Test-Path $nodeDir) {
    $env:Path = $nodeDir + ";" + $env:Path
}

$npmGlobal = Join-Path $env:APPDATA "npm"
if (Test-Path $npmGlobal) {
    $env:Path = $npmGlobal + ";" + $env:Path
}

Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "Проект: temki-1409"
Write-Host ""

$firebaseCmd = Join-Path $npmGlobal "firebase.cmd"
if (-not (Test-Path $firebaseCmd)) {
    Write-Host "Устанавливаю firebase-tools..."
    npm install -g firebase-tools
}

$login = & $firebaseCmd login:list 2>&1 | Out-String
if ($login -match "No authorized accounts") {
    Write-Host "Сначала войди в Firebase:"
    Write-Host "  firebase login"
    Write-Host ""
    Write-Host "Потом снова запусти этот скрипт."
    exit 1
}

Write-Host "Деплой правил Firestore и Storage..."
& $firebaseCmd deploy --only firestore:rules,storage --project temki-1409

Write-Host ""
Write-Host "Готово. Проверь консоль:"
Write-Host "https://console.firebase.google.com/project/temki-1409/overview"
