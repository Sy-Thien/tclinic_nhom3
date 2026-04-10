param(
    [string]$Database = "tn_clinic",
    [string]$RootPassword = $(if ($env:DB_ROOT_PASSWORD) { $env:DB_ROOT_PASSWORD } else { "tclinic2025" }),
    [string]$OutputDir = "./backups"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $OutputDir "$($Database)-$timestamp.sql"

Write-Host "[INFO] Checking database container status..."
$running = docker compose ps --status running db | Out-String
if ($running -notmatch "tclinic-db") {
    throw "Database container is not running. Run 'docker compose up -d db' first."
}

Write-Host "[INFO] Creating backup: $backupFile"
$dumpCommand = "mysqldump -uroot -p$RootPassword --single-transaction --routines --triggers $Database"

# Redirect SQL output to host file
$null = docker compose exec -T db sh -lc $dumpCommand > $backupFile

if (-not (Test-Path $backupFile)) {
    throw "Backup file was not created."
}

$size = (Get-Item $backupFile).Length
if ($size -le 0) {
    throw "Backup file is empty."
}

$latestFile = Join-Path $OutputDir "$($Database)-latest.sql"
Copy-Item -Path $backupFile -Destination $latestFile -Force

Write-Host "[OK] Backup created successfully"
Write-Host "[OK] File: $backupFile"
Write-Host "[OK] Latest alias: $latestFile"