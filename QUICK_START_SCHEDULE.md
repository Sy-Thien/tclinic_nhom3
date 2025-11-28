# 🚀 HƯỚNG DẪN NHANH - HỆ THỐNG LỊCH KHÁM

## 📦 CÀI ĐẶT

```bash
# 1. Chạy migration
cd server
npx sequelize-cli db:migrate

# 2. Khởi động server
npm start

# 3. Khởi động client (terminal mới)
cd client
npm run dev
```

## 🎯 SỬ DỤNG NHANH

### 1. ADMIN - Tạo Lịch Khám

**Đường dẫn:** `/admin/schedule-management`

**Cách làm:**
1. Chọn bác sĩ
2. Chọn ngày
3. Chọn giữa 2 chế độ:
   - **Đơn lẻ:** Tạo từng khung giờ
   - **Hàng loạt:** Tự động tạo nhiều khung giờ trong ngày

**Ví dụ tạo hàng loạt:**
- Bác sĩ: Nguyễn Văn A
- Ngày: 2024-11-25
- Làm việc: 08:00 - 17:00
- Nghỉ trưa: 12:00 - 13:00
- Khoảng cách: 30 phút
- Số BN/khung: 2

→ Tạo được ~15 khung giờ (trừ giờ nghỉ)

### 2. USER - Đặt Lịch

**Đường dẫn:** `/customer/booking-schedule`

**Cách làm:**
1. Chọn chuyên khoa
2. Chọn bác sĩ (tùy chọn)
3. Chọn ngày
4. Xem các khung giờ có sẵn
5. Click vào khung giờ muốn đặt
6. Điền thông tin bệnh nhân
7. Xác nhận

### 3. DOCTOR - Xem Lịch

**Đường dẫn:** `/doctor/schedule-view`

**Cách xem:**
- **Ngày:** Chi tiết từng khung giờ và bệnh nhân
- **Tuần:** Tổng quan 7 ngày
- **Tháng:** Kế hoạch cả tháng

**Điều hướng:**
- ◀ ▶ : Chuyển trước/sau
- "Hôm nay": Về ngày hiện tại

## 📱 ROUTES CLIENT

Thêm vào Router của bạn:

```jsx
// Admin
import ScheduleManagement from './pages/admin/ScheduleManagement';

// Customer
import BookingSchedule from './pages/customer/BookingSchedule';

// Doctor
import DoctorScheduleView from './pages/doctor/DoctorScheduleView';

// Routes
<Route path="/admin/schedule-management" element={<ScheduleManagement />} />
<Route path="/customer/booking-schedule" element={<BookingSchedule />} />
<Route path="/doctor/schedule-view" element={<DoctorScheduleView />} />
```

## 🔑 API ENDPOINTS

```
# Admin
POST   /api/admin/time-slots           - Tạo khung giờ đơn
POST   /api/admin/time-slots/multiple  - Tạo hàng loạt
GET    /api/admin/time-slots           - Xem danh sách
PUT    /api/admin/time-slots/:id       - Cập nhật
DELETE /api/admin/time-slots/:id       - Xóa

# Public/User
GET    /api/time-slots/available       - Xem khung giờ có sẵn

# Doctor
GET    /api/doctor/time-slots          - Xem lịch làm việc
```

## ⚠️ LƯU Ý

1. **Phải chạy migration trước**
2. Không xóa được khung giờ đã có booking
3. `current_patients` tự động tăng/giảm khi booking/hủy
4. Khung giờ tự động `is_available = false` khi đầy

## 🐛 FIX LỖI NHANH

**Lỗi "Table doesn't exist":**
```bash
cd server
npx sequelize-cli db:migrate
```

**Lỗi "TimeSlot is not defined":**
- Kiểm tra `models/index.js` đã export TimeSlot
- Restart server

**Lỗi "Cannot read property of undefined":**
- Kiểm tra relationships trong models/index.js
- Đảm bảo include đúng model trong query

---

✅ **DONE!** Hệ thống đã sẵn sàng sử dụng.
