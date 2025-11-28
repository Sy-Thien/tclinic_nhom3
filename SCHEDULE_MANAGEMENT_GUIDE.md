# 📅 HỆ THỐNG QUẢN LÝ LỊCH KHÁM BỆNH

Hệ thống quản lý lịch khám với 3 vai trò chính: Admin, Bác sĩ, và Người dùng/Bệnh nhân.

## 🚀 CÀI ĐẶT

### 1. Chạy Migration để tạo bảng Time Slots

```bash
cd server
npx sequelize-cli db:migrate
```

Migration sẽ tạo:
- Bảng `tn_time_slots` - Lưu trữ các khung giờ khám
- Thêm cột `time_slot_id` vào bảng `tn_booking`

### 2. Khởi động Server và Client

**Server:**
```bash
cd server
npm install
npm start
```

**Client:**
```bash
cd client
npm install
npm run dev
```

## 📋 TÍNH NĂNG THEO VAI TRÒ

### 👨‍💼 ADMIN - Quản Lý Lịch Khám

**Trang:** `ScheduleManagement.jsx`

**Chức năng:**
1. ➕ **Tạo khung giờ đơn lẻ**
   - Chọn bác sĩ
   - Chọn ngày khám
   - Chọn giờ bắt đầu/kết thúc
   - Số lượng bệnh nhân tối đa
   - Phòng khám (tùy chọn)

2. 📋 **Tạo lịch hàng loạt**
   - Tự động tạo nhiều khung giờ trong ngày
   - Chọn khoảng cách giữa các khung giờ (15, 30, 45, 60, 90, 120 phút)
   - Thiết lập giờ nghỉ trưa
   - Số bệnh nhân tối đa mỗi khung

3. 📊 **Xem và quản lý**
   - Xem danh sách khung giờ theo bác sĩ/ngày
   - Bật/tắt khung giờ
   - Xóa khung giờ (nếu chưa có booking)
   - Theo dõi số lượng bệnh nhân đã đặt

**API Endpoints:**
```
POST   /api/admin/time-slots              - Tạo khung giờ đơn
POST   /api/admin/time-slots/multiple     - Tạo nhiều khung giờ
GET    /api/admin/time-slots              - Lấy danh sách
PUT    /api/admin/time-slots/:id          - Cập nhật
DELETE /api/admin/time-slots/:id          - Xóa
```

### 👥 NGƯỜI DÙNG/BỆNH NHÂN - Đặt Lịch Khám

**Trang:** `BookingSchedule.jsx`

**Chức năng:**
1. 🔍 **Tìm kiếm lịch khám**
   - Lọc theo chuyên khoa
   - Lọc theo bác sĩ
   - Chọn ngày khám

2. 📅 **Xem khung giờ có sẵn**
   - Hiển thị theo bác sĩ
   - Xem số chỗ còn trống
   - Xem phòng khám

3. ✅ **Đặt lịch khám**
   - Chọn khung giờ
   - Điền thông tin bệnh nhân
   - Mô tả triệu chứng
   - Xác nhận đặt lịch

**API Endpoints:**
```
GET /api/time-slots/available  - Lấy khung giờ có sẵn
```

### 👨‍⚕️ BÁC SĨ - Xem Lịch Làm Việc và Lịch Hẹn

**Trang:** `DoctorScheduleView.jsx`

**Chức năng:**
1. 📅 **Xem lịch theo nhiều chế độ**
   - Xem theo ngày (chi tiết)
   - Xem theo tuần (tổng quan)
   - Xem theo tháng (kế hoạch)

2. 📊 **Thống kê nhanh**
   - Tổng số khung giờ
   - Tổng lịch hẹn
   - Lịch chờ xác nhận
   - Lịch đã xác nhận

3. 👀 **Xem chi tiết**
   - Danh sách bệnh nhân theo khung giờ
   - Thông tin bệnh nhân
   - Trạng thái lịch hẹn
   - Phòng khám

**API Endpoints:**
```
GET /api/doctor/time-slots  - Xem lịch làm việc của mình
```

## 🗂️ CẤU TRÚC DỰ ÁN

### Backend (Server)
```
server/
├── models/
│   └── TimeSlot.js                    # Model quản lý khung giờ
├── controllers/
│   └── timeSlotController.js          # Logic xử lý time slots
├── routes/
│   └── timeSlotRoutes.js              # API routes
├── migrations/
│   ├── 20251122-create-time-slots-table.js
│   └── 20251122-add-timeslot-to-booking.js
```

### Frontend (Client)
```
client/src/pages/
├── admin/
│   ├── ScheduleManagement.jsx         # Admin quản lý lịch khám
│   └── ScheduleManagement.module.css
├── customer/
│   ├── BookingSchedule.jsx            # User đặt lịch khám
│   └── BookingSchedule.module.css
└── doctor/
    ├── DoctorScheduleView.jsx         # Bác sĩ xem lịch
    └── DoctorScheduleView.module.css
```

## 📊 DATABASE SCHEMA

### Bảng `tn_time_slots`
```sql
- id: INTEGER (PK, Auto Increment)
- doctor_id: INTEGER (FK -> tn_doctors)
- date: DATE (Ngày khám)
- start_time: TIME (Giờ bắt đầu)
- end_time: TIME (Giờ kết thúc)
- max_patients: INTEGER (Số BN tối đa)
- current_patients: INTEGER (Số BN đã đặt)
- is_available: BOOLEAN (Có sẵn không)
- room_id: INTEGER (FK -> tn_rooms)
- note: TEXT (Ghi chú)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Cập nhật bảng `tn_booking`
```sql
+ time_slot_id: INTEGER (FK -> tn_time_slots)
```

## 🎯 LUỒNG HOẠT ĐỘNG

### 1. Admin tạo lịch khám
```
Admin → Chọn bác sĩ → Chọn ngày → Tạo khung giờ → Lưu vào DB
```

### 2. Người dùng đặt lịch
```
User → Chọn chuyên khoa/bác sĩ → Chọn ngày → Xem khung giờ 
→ Chọn khung giờ → Điền thông tin → Đặt lịch → Cập nhật current_patients
```

### 3. Bác sĩ xem lịch
```
Doctor → Chọn chế độ xem (ngày/tuần/tháng) → Xem lịch làm việc 
→ Xem danh sách bệnh nhân → Xem chi tiết
```

## 🔧 CẤU HÌNH

### Environment Variables (`.env`)
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tclinic_db
JWT_SECRET=your_jwt_secret
```

## 📝 GHI CHÚ QUAN TRỌNG

1. **Migration**: Phải chạy migration trước khi sử dụng tính năng
2. **Quan hệ**: TimeSlot liên kết với Doctor, Room, và Booking
3. **Validation**: Không cho xóa khung giờ đã có booking
4. **Auto-update**: `current_patients` tự động tăng/giảm khi có booking mới/hủy

## 🐛 XỬ LÝ LỖI

### Lỗi thường gặp:

1. **"Khung giờ đã tồn tại"**
   - Nguyên nhân: Trùng doctor_id + date + start_time
   - Giải pháp: Kiểm tra lại thông tin hoặc cập nhật khung giờ cũ

2. **"Không thể xóa khung giờ"**
   - Nguyên nhân: Đã có bệnh nhân đặt lịch
   - Giải pháp: Hủy các booking trước hoặc disable khung giờ

3. **"Khung giờ đã đầy"**
   - Nguyên nhân: current_patients >= max_patients
   - Giải pháp: Tăng max_patients hoặc chọn khung giờ khác

## 📞 LIÊN HỆ HỖ TRỢ

Nếu có vấn đề kỹ thuật, vui lòng kiểm tra:
1. Server đang chạy (port 5000)
2. Database đã được migrate
3. Các model đã được import đúng trong `models/index.js`

---

**Phát triển bởi:** TClinic Team
**Ngày cập nhật:** 22/11/2024
