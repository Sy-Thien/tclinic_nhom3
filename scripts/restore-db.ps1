param(
    [string]$Database = "tn_clinic",
    [string]$RootPassword = $(if ($env:DB_ROOT_PASSWORD) { $env:DB_ROOT_PASSWORD } else { "tclinic2025" }),
    [string]$BackupFile = "./backups/tn_clinic-latest.sql"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    throw "Backup file not found: $BackupFile"
}

Write-Host "[WARN] This will overwrite data in database '$Database'."
Write-Host "[INFO] Backup source: $BackupFile"

$confirm = Read-Host "Type YES to continue"
if ($confirm -ne "YES") {
    Write-Host "[INFO] Restore cancelled."
    exit 0
}

Write-Host "[INFO] Checking database container status..."
$running = docker compose ps --status running db | Out-String
if ($running -notmatch "tclinic-db") {
    throw "Database container is not running. Run 'docker compose up -d db' first."
}

Write-Host "[INFO] Dropping and recreating database '$Database'..."
$null = docker compose exec -T db sh -lc "mysql -uroot -p$RootPassword -e \"DROP DATABASE IF EXISTS $Database; CREATE DATABASE $Database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\""

Write-Host "[INFO] Restoring backup..."
Get-Content -Raw -Path $BackupFile | docker compose exec -T db sh -lc "mysql -uroot -p$RootPassword $Database"

Write-Host "[OK] Restore completed successfully."