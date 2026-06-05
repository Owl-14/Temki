$ErrorActionPreference = "Stop"

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host "Сначала войди в GitHub: gh auth login --web"
    exit 1
}

gh repo create nashi-temki --public --source=. --remote=origin --push --description "Лендинг наших темок"
gh api repos/{owner}/nashi-temki/pages -X POST -f "build_type=legacy" -f "source[branch]=main" -f "source[path]=/"

Write-Host ""
Write-Host "Готово! Сайт появится через пару минут на:"
gh repo view --web
