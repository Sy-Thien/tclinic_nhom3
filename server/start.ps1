# Start TClinic Backend Server
Write-Host "🚀 Starting TClinic Backend Server..." -ForegroundColor Cyan
Write-Host "📁 Working Directory: $PWD" -ForegroundColor Gray
Write-Host "⏰ Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Kill existing processes on port 5000
$existingProcess = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($existingProcess) {
    Write-Host "⚠️  Port 5000 is in use. Stopping existing process..." -ForegroundColor Yellow
    Stop-Process -Id $existingProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Start server
Write-Host "▶️  Starting node server.js..." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

node server.js
