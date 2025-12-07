# 🧪 TEST WORKFLOW LOCAL (TRƯỚC KHI PUSH GITHUB)

## Mục đích
Script này mô phỏng GitHub Actions workflow ở local để kiểm tra trước khi push code lên GitHub.

## Cách chạy

```powershell
cd B:\tclinic_nhom3
.\test-workflow-local.ps1
```

## Script sẽ làm gì?

1. ✅ Kiểm tra MySQL đang chạy
2. ✅ Backup database hiện tại
3. ✅ Tạo database test mới
4. ✅ Install dependencies
5. ✅ Sync database schema
6. ✅ Seed test data
7. ✅ Start server trong background
8. ✅ Health check
9. ✅ Chạy Newman tests
10. ✅ Hiển thị kết quả
11. ✅ Cleanup (restore database)

## Output mong đợi

```
🧪 SIMULATE GITHUB ACTIONS WORKFLOW - LOCAL TEST
================================================

[1/11] ✅ Checking MySQL...
MySQL is running on port 3306

[2/11] ✅ Backing up current database...
Database backed up to: tn_clinic_backup_20251207_223045

[3/11] ✅ Creating test database...
Test database 'tn_clinic_test' created

[4/11] ✅ Installing dependencies...
Dependencies installed

[5/11] ✅ Syncing database schema...
Database synced successfully

[6/11] ✅ Seeding test data...
Admin created
Doctor created
Specialty created

[7/11] ✅ Starting server...
Server started on port 5000 (PID: 12345)

[8/11] ✅ Health check...
Server is healthy!

[9/11] ✅ Running Newman tests...
┌─────────────────────────┬────────┬────────┐
│                         │ Total  │ Failed │
├─────────────────────────┼────────┼────────┤
│ Iterations              │      1 │      0 │
│ Requests                │     52 │      0 │
│ Test Scripts            │     52 │      0 │
│ Assertions              │    156 │      0 │
└─────────────────────────┴────────┴────────┘

[10/11] ✅ Test results saved to: test-results/

[11/11] ✅ Cleanup...
Server stopped
Test database dropped
Original database restored

================================================
✅ ALL TESTS PASSED! Ready to push to GitHub.
================================================
```

## Nếu có lỗi

Script sẽ dừng lại và hiển thị lỗi chi tiết:

```
[9/11] ❌ Running Newman tests...
FAILED: 3 assertions failed

Details:
- Login API: Expected 200, got 401
- Create Booking: Expected 201, got 500
- Get Doctor Schedule: Expected 200, got 404

Check test-results/report.html for details

================================================
❌ TESTS FAILED! Fix issues before pushing.
================================================
```

## Sau khi chạy

1. Mở `test-results/report.html` để xem chi tiết
2. Nếu pass → An tâm push lên GitHub
3. Nếu fail → Fix lỗi, chạy lại script

## Lợi ích

- ✅ Catch lỗi trước khi push (tiết kiệm GitHub Actions minutes)
- ✅ Test nhanh hơn (không cần wait GitHub queue)
- ✅ Debug dễ hơn (có thể attach debugger local)
- ✅ Không ảnh hưởng database production
