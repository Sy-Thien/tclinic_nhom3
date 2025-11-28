# ✅ HỖ TRỢ TRANG LỊCH LÀM VIỆC BÁC SĨ

## 📋 TÌNH TRẠNG HIỆN TẠI

Trang "Lịch & Khám" (`/doctor/schedule-view`) đã được:
- ✅ Tạo file component: `DoctorScheduleView.jsx`
- ✅ Tạo file CSS: `DoctorScheduleView.module.css`
- ✅ Thêm route vào App.jsx
- ✅ Thêm menu item vào sidebar Doctor
- ✅ Kết nối API `/api/doctor/time-slots`

## 🔧 CẬP NHẬT ĐÃ THỰC HIỆN

### 1. Server Backend
```javascript
// GET /api/doctor/time-slots
- Hỗ trợ query parameters: date, start_date, end_date
- Return TimeSlots với Bookings đầy đủ
- Attributes: booking_code, patient_name, patient_phone, status, appointment_date, appointment_time
```

### 2. Frontend Component
```jsx
// DoctorScheduleView
- 3 chế độ xem: Ngày / Tuần / Tháng
- Thống kê nhanh: Tổng slots, lịch hẹn, chờ xác nhận, đã xác nhận
- Chi tiết bệnh nhân theo khung giờ
- Điều hướng tuần/tháng trước/sau
- Hiện "Hôm nay" button
```

## 📊 THÊM DỮ LIỆU VÀO DATABASE

### Cách 1: Sử dụng MySQL Workbench
1. Mở MySQL Workbench
2. Kết nối database: `tn_clinic`
3. Chạy SQL script:

```sql
-- Lấy doctor_id
SELECT id, full_name FROM tn_doctors LIMIT 1;

-- Insert sample time slots (thay đổi date/doctor_id theo nhu cầu)
INSERT INTO tn_time_slots (doctor_id, date, start_time, end_time, max_patients, current_patients, is_available, room_id, created_at, updated_at) VALUES
(1, '2025-11-22', '08:00:00', '08:30:00', 2, 0, true, 1, NOW(), NOW()),
(1, '2025-11-22', '08:30:00', '09:00:00', 2, 0, true, 1, NOW(), NOW()),
(1, '2025-11-22', '09:00:00', '09:30:00', 2, 0, true, 1, NOW(), NOW()),
(1, '2025-11-22', '09:30:00', '10:00:00', 2, 0, true, 1, NOW(), NOW()),
(1, '2025-11-22', '10:00:00', '10:30:00', 2, 0, true, 1, NOW(), NOW()),
(1, '2025-11-22', '10:30:00', '11:00:00', 2, 0, true, 1, NOW(), NOW()),
(1, '2025-11-22', '13:00:00', '13:30:00', 2, 0, true, 1, NOW(), NOW()),
(1, '2025-11-22', '13:30:00', '14:00:00', 2, 0, true, 1, NOW(), NOW()),
(1, '2025-11-22', '14:00:00', '14:30:00', 2, 0, true, 1, NOW(), NOW()),
(1, '2025-11-22', '14:30:00', '15:00:00', 2, 0, true, 1, NOW(), NOW());

-- Kiểm tra
SELECT * FROM tn_time_slots WHERE doctor_id = 1 ORDER BY date, start_time;
```

### Cách 2: Sử dụng Admin Panel
1. Truy cập: http://localhost:5173/admin/schedule-management
2. Chọn bác sĩ
3. Chọn ngày (2025-11-22)
4. Chọn "Tạo hàng loạt"
5. Điền thông tin:
   - Giờ làm: 08:00 - 17:00
   - Giờ nghỉ: 12:00 - 13:00
   - Khoảng cách: 30 phút
   - Số BN/khung: 2
6. Click "Tạo Lịch"

## 🚀 KIỂM TRA KẾT QUẢ

1. **Đăng nhập với tài khoản bác sĩ:**
   - URL: http://localhost:5173/login
   - Email: doctor account
   - Password: password

2. **Truy cập trang:**
   - http://localhost:5173/doctor/schedule-view

3. **Giao diện sẽ hiển thị:**
   - ✅ Header "📅 Lịch Làm Việc & Lịch Khám"
   - ✅ 3 nút chọn: Ngày / Tuần / Tháng
   - ✅ Nút điều hướng: ◀ "Hôm nay" ▶
   - ✅ Ngày hiện tại
   - ✅ Thống kê (4 numbers)
   - ✅ Danh sách/grid khung giờ
   - ✅ Bệnh nhân theo khung giờ (nếu có)

## 🔧 DEBUG

### Nếu trang trống:
1. **Kiểm tra console (F12):**
   - Có lỗi fetch?
   - Có error từ server?

2. **Kiểm tra dữ liệu:**
   ```bash
   # Terminal, chạy query này
   # Kiểm tra có time slots không
   SELECT COUNT(*) FROM tn_time_slots WHERE doctor_id = 1;
   ```

3. **Kiểm tra token:**
   - Mở DevTools → Application → LocalStorage
   - Xem có `token` và `user` không?
   - Role của user có phải "doctor" không?

4. **Kiểm tra API:**
   ```bash
   # PowerShell
   $token = "YOUR_DOCTOR_TOKEN"
   $headers = @{"Authorization" = "Bearer $token"}
   Invoke-RestMethod -Uri "http://localhost:5000/api/doctor/time-slots" -Headers $headers
   ```

### Nếu lỗi "Cannot read property 'date' of undefined":
- Có thể TimeSlot data không có attribute `date`
- Kiểm tra migration có chạy không: `npx sequelize-cli db:migrate:status`

### Nếu lỗi authorization:
- Kiểm tra user role có phải "doctor" không
- Kiểm tra token còn hạn không

## 📝 CẦU TRÚC DỮ LIỆU

```
TimeSlot:
- id: INT
- doctor_id: INT (FK -> doctors)
- date: DATE
- start_time: TIME
- end_time: TIME
- max_patients: INT
- current_patients: INT
- is_available: BOOLEAN
- room_id: INT (FK -> rooms)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

Relationships:
- TimeSlot.bookings (1-Many Booking)
```

## 🎯 TIẾP THEO

1. ✅ Trang lịch đã hoàn thành
2. 📝 Cần thêm dữ liệu vào DB
3. 🧪 Test với dữ liệu thực
4. 🔄 Hoàn thiện tính năng

---

**Cần hỗ trợ thêm?** Kiểm tra logs hoặc console để tìm lỗi cụ thể.
