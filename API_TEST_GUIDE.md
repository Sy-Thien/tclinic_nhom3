# 🧪 TEST API TIME SLOTS

## Test bằng Postman hoặc cURL

### 1. Lấy danh sách khung giờ có sẵn (Public - không cần token)
```bash
curl http://localhost:5000/api/time-slots/available
```

### 2. Admin - Tạo khung giờ đơn (Cần token admin)
```bash
curl -X POST http://localhost:5000/api/admin/time-slots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "doctor_id": 1,
    "date": "2024-11-25",
    "start_time": "08:00",
    "end_time": "09:00",
    "max_patients": 2,
    "room_id": 1,
    "note": "Khám tổng quát"
  }'
```

### 3. Admin - Tạo lịch hàng loạt (Cần token admin)
```bash
curl -X POST http://localhost:5000/api/admin/time-slots/multiple \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "doctor_id": 1,
    "date": "2024-11-25",
    "room_id": 1,
    "slots": [
      {
        "start_time": "08:00",
        "end_time": "08:30",
        "max_patients": 2
      },
      {
        "start_time": "08:30",
        "end_time": "09:00",
        "max_patients": 2
      },
      {
        "start_time": "09:00",
        "end_time": "09:30",
        "max_patients": 2
      }
    ]
  }'
```

### 4. Admin - Xem danh sách time slots (Cần token admin)
```bash
# Tất cả
curl http://localhost:5000/api/admin/time-slots \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Lọc theo bác sĩ
curl "http://localhost:5000/api/admin/time-slots?doctor_id=1" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Lọc theo ngày
curl "http://localhost:5000/api/admin/time-slots?date=2024-11-25" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 5. Admin - Cập nhật khung giờ (Cần token admin)
```bash
curl -X PUT http://localhost:5000/api/admin/time-slots/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "max_patients": 3,
    "is_available": false
  }'
```

### 6. Admin - Xóa khung giờ (Cần token admin)
```bash
curl -X DELETE http://localhost:5000/api/admin/time-slots/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 7. Doctor - Xem lịch làm việc của mình (Cần token doctor)
```bash
# Xem tất cả
curl http://localhost:5000/api/doctor/time-slots \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN"

# Lọc theo ngày
curl "http://localhost:5000/api/doctor/time-slots?date=2024-11-25" \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN"

# Lọc theo khoảng thời gian
curl "http://localhost:5000/api/doctor/time-slots?start_date=2024-11-25&end_date=2024-11-30" \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN"
```

## PowerShell Commands (Windows)

### Test với PowerShell:

```powershell
# 1. Test health endpoint
Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET

# 2. Lấy time slots available (không cần token)
Invoke-RestMethod -Uri "http://localhost:5000/api/time-slots/available" -Method GET

# 3. Admin tạo time slot (thay YOUR_ADMIN_TOKEN)
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_ADMIN_TOKEN"
}

$body = @{
    doctor_id = 1
    date = "2024-11-25"
    start_time = "08:00"
    end_time = "09:00"
    max_patients = 2
    room_id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/admin/time-slots" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

## 📝 Response Examples

### Success Response (200/201):
```json
{
  "message": "Tạo khung giờ thành công",
  "timeSlot": {
    "id": 1,
    "doctor_id": 1,
    "date": "2024-11-25",
    "start_time": "08:00:00",
    "end_time": "09:00:00",
    "max_patients": 2,
    "current_patients": 0,
    "is_available": true,
    "room_id": 1,
    "note": "Khám tổng quát",
    "created_at": "2024-11-22T10:00:00.000Z",
    "updated_at": "2024-11-22T10:00:00.000Z"
  }
}
```

### Error Response (400/404/500):
```json
{
  "message": "Khung giờ này đã tồn tại"
}
```

## 🔐 LẤY TOKEN:

1. Login với admin account
2. Copy token từ response
3. Sử dụng token trong header: `Authorization: Bearer TOKEN`
