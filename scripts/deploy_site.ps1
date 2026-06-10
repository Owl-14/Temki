$ErrorActionPreference = "Stop"

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host "Сначала войди в GitHub: gh auth login --web"
    exit 1
}

git remote set-url origin https://github.com/Owl-14/Temki.git
git push -u origin main
gh api repos/Owl-14/Temki/pages -X POST -f "build_type=legacy" -f "source[branch]=main" -f "source[path]=/"

Write-Host ""
Write-Host "Готово! Сайт появится через пару минут на:"
gh repo view --web
