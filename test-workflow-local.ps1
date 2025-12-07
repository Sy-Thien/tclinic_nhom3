# 🧪 Script mô phỏng GitHub Actions workflow ở local
# Chạy: .\test-workflow-local.ps1

param(
    [switch]$SkipBackup,
    [switch]$KeepTestDB
)

$ErrorActionPreference = "Stop"
$originalDB = "tn_clinic"
$testDB = "tn_clinic_test"
$backupDB = ""
$serverPID = $null

Write-Host "`n🧪 SIMULATE GITHUB ACTIONS WORKFLOW - LOCAL TEST" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

function Step {
    param($num, $total, $message)
    Write-Host "[$num/$total] " -NoNewline -ForegroundColor Yellow
    Write-Host $message -ForegroundColor White
}

function Success {
    param($message)
    Write-Host "✅ $message" -ForegroundColor Green
}

function Error {
    param($message)
    Write-Host "❌ $message" -ForegroundColor Red
}

function Cleanup {
    Write-Host "`n[11/11] " -NoNewline -ForegroundColor Yellow
    Write-Host "Cleanup..." -ForegroundColor White
    
    # Stop server
    if ($serverPID) {
        try {
            Stop-Process -Id $serverPID -Force -ErrorAction SilentlyContinue
            Success "Server stopped"
        } catch {
            Write-Host "Server already stopped" -ForegroundColor Gray
        }
    }
    
    # Drop test database
    if (-not $KeepTestDB) {
        try {
            mysql -u root -e "DROP DATABASE IF EXISTS $testDB;" 2>$null
            Success "Test database dropped"
        } catch {
            Write-Host "Test database cleanup skipped" -ForegroundColor Gray
        }
    }
    
    # Restore original database
    if ($backupDB -and -not $SkipBackup) {
        try {
            mysql -u root -e "DROP DATABASE IF EXISTS $originalDB;" 2>$null
            mysql -u root -e "CREATE DATABASE $originalDB;" 2>$null
            mysqldump -u root $backupDB | mysql -u root $originalDB 2>$null
            mysql -u root -e "DROP DATABASE $backupDB;" 2>$null
            Success "Original database restored"
        } catch {
            Write-Host "Database restore skipped" -ForegroundColor Gray
        }
    }
}

try {
    # 1. Check MySQL
    Step 1 11 "Checking MySQL..."
    $mysqlRunning = Get-Process mysqld -ErrorAction SilentlyContinue
    if (-not $mysqlRunning) {
        Error "MySQL is not running. Start XAMPP MySQL first."
        exit 1
    }
    Success "MySQL is running"

    # 2. Backup current database
    if (-not $SkipBackup) {
        Step 2 11 "Backing up current database..."
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupDB = "${originalDB}_backup_$timestamp"
        
        mysql -u root -e "CREATE DATABASE $backupDB;" 2>$null
        mysqldump -u root $originalDB | mysql -u root $backupDB 2>$null
        Success "Database backed up to: $backupDB"
    } else {
        Step 2 11 "Skipping backup (--SkipBackup flag)"
    }

    # 3. Create test database
    Step 3 11 "Creating test database..."
    mysql -u root -e "DROP DATABASE IF EXISTS $testDB;" 2>$null
    mysql -u root -e "CREATE DATABASE $testDB;" 2>$null
    Success "Test database '$testDB' created"

    # 4. Install dependencies
    Step 4 11 "Installing dependencies..."
    Push-Location server
    if (-not (Test-Path "node_modules")) {
        npm install --silent
    }
    Pop-Location
    Success "Dependencies installed"

    # 5. Sync database
    Step 5 11 "Syncing database schema..."
    
    # Create sync script
    $syncScript = @"
const { sequelize } = require('./models');

async function syncDB() {
    try {
        await sequelize.sync({ force: true });
        console.log('✅ Database synced');
        process.exit(0);
    } catch (err) {
        console.error('❌ Sync failed:', err.message);
        process.exit(1);
    }
}

syncDB();
"@
    
    $syncScript | Out-File -FilePath "server/sync-test-db.js" -Encoding UTF8
    
    Push-Location server
    $env:DB_NAME = $testDB
    node sync-test-db.js
    Remove-Item sync-test-db.js -ErrorAction SilentlyContinue
    Pop-Location
    
    Success "Database synced"

    # 6. Seed test data
    Step 6 11 "Seeding test data..."
    
    $seedScript = @"
const bcrypt = require('bcrypt');
const { Admin, Specialty, Doctor, Service, Room } = require('./models');

async function seed() {
    try {
        // Admin
        const hash = await bcrypt.hash('admin123', 10);
        await Admin.create({
            username: 'admin',
            password: hash,
            email: 'admin@tclinic.com',
            full_name: 'Administrator'
        });
        
        // Specialty
        await Specialty.create({
            specialty_id: 1,
            name: 'Nội khoa',
            description: 'Khám nội khoa tổng quát'
        });
        
        // Room
        await Room.create({
            room_id: 1,
            name: 'Phòng 101',
            floor: 1,
            description: 'Phòng khám'
        });
        
        // Doctor
        const docHash = await bcrypt.hash('doctor123', 10);
        await Doctor.create({
            doctor_id: 1,
            full_name: 'Bác sĩ Test',
            email: 'doctor1@tclinic.com',
            password: docHash,
            phone: '0901234567',
            specialty_id: 1
        });
        
        // Service
        await Service.create({
            service_id: 1,
            name: 'Khám tổng quát',
            price: 100000,
            specialty_id: 1
        });
        
        console.log('✅ Seed completed');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        process.exit(0);
    }
}

seed();
"@
    
    $seedScript | Out-File -FilePath "server/seed-test.js" -Encoding UTF8
    
    Push-Location server
    $env:DB_NAME = $testDB
    node seed-test.js
    Remove-Item seed-test.js -ErrorAction SilentlyContinue
    Pop-Location
    
    Success "Test data seeded"

    # 7. Start server
    Step 7 11 "Starting server..."
    
    Push-Location server
    $env:DB_NAME = $testDB
    $env:NODE_ENV = "ci"
    $env:SKIP_REMINDER = "true"
    $env:JWT_SECRET = "test-secret"
    
    $serverProcess = Start-Process node -ArgumentList "server.js" -PassThru -WindowStyle Hidden
    $serverPID = $serverProcess.Id
    Pop-Location
    
    Start-Sleep -Seconds 5
    Success "Server started (PID: $serverPID)"

    # 8. Health check
    Step 8 11 "Health check..."
    
    $maxRetries = 6
    $healthy = $false
    
    for ($i = 1; $i -le $maxRetries; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                $healthy = $true
                break
            }
        } catch {
            Write-Host "  Attempt $i/$maxRetries..." -ForegroundColor Gray
            Start-Sleep -Seconds 3
        }
    }
    
    if (-not $healthy) {
        Error "Server health check failed"
        Cleanup
        exit 1
    }
    
    Success "Server is healthy!"

    # 9. Run Newman tests
    Step 9 11 "Running Newman tests..."
    
    # Create results directory
    New-Item -ItemType Directory -Path "test-results" -Force | Out-Null
    
    # Run Newman
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $reportPath = "test-results/report-local-$timestamp.html"
    $jsonPath = "test-results/results-local-$timestamp.json"
    
    $newmanResult = newman run postman/TClinic_API_Collection.postman_collection.json `
        -e postman/TClinic_Environment.postman_environment.json `
        --reporters cli,htmlextra,json `
        --reporter-htmlextra-export $reportPath `
        --reporter-json-export $jsonPath `
        --delay-request 100 `
        --timeout-request 10000 `
        --color on
    
    # Check results
    if ($LASTEXITCODE -ne 0) {
        Error "Newman tests failed!"
        Write-Host "`nCheck $reportPath for details`n" -ForegroundColor Yellow
        Cleanup
        exit 1
    }
    
    Success "All tests passed!"

    # 10. Display summary
    Step 10 11 "Test summary..."
    
    if (Test-Path $jsonPath) {
        $results = Get-Content $jsonPath | ConvertFrom-Json
        $stats = $results.run.stats
        
        Write-Host "`n┌─────────────────────────┬────────┬────────┐" -ForegroundColor Cyan
        Write-Host "│                         │ Total  │ Failed │" -ForegroundColor Cyan
        Write-Host "├─────────────────────────┼────────┼────────┤" -ForegroundColor Cyan
        Write-Host "│ Iterations              │ $($stats.iterations.total.ToString().PadLeft(6)) │ $($stats.iterations.failed.ToString().PadLeft(6)) │" -ForegroundColor White
        Write-Host "│ Requests                │ $($stats.requests.total.ToString().PadLeft(6)) │ $($stats.requests.failed.ToString().PadLeft(6)) │" -ForegroundColor White
        Write-Host "│ Assertions              │ $($stats.assertions.total.ToString().PadLeft(6)) │ $($stats.assertions.failed.ToString().PadLeft(6)) │" -ForegroundColor White
        Write-Host "└─────────────────────────┴────────┴────────┘" -ForegroundColor Cyan
        
        Write-Host "`n📊 Report: $reportPath" -ForegroundColor Cyan
        Write-Host "📄 JSON: $jsonPath`n" -ForegroundColor Cyan
    }

    # Cleanup
    Cleanup

    # Final message
    Write-Host "`n================================================" -ForegroundColor Green
    Write-Host "✅ ALL TESTS PASSED! Ready to push to GitHub." -ForegroundColor Green
    Write-Host "================================================`n" -ForegroundColor Green
    
    # Open report
    Start-Process $reportPath

} catch {
    Error "Unexpected error: $_"
    Cleanup
    exit 1
}
