# ✅ Quản Lý Lịch Hẹn Cá Nhân - Hoàn Tất

## 📋 Tính Năng Đã Triển Khai

### 1. Xem Danh Sách Lịch Hẹn ✅
**Frontend**: `client/src/pages/customer/MyAppointments.jsx`
- Hiển thị tất cả lịch hẹn của bệnh nhân
- Filter theo trạng thái: All, Chờ xác nhận, Đã xác nhận, Hoàn thành, Đã hủy
- Card view với thông tin đầy đủ: Ngày, giờ, bác sĩ, chuyên khoa, giá
- Badge màu sắc theo trạng thái

**Backend**: `server/routes/patientRoutes.js`
- Endpoint: `GET /api/patient/my-appointments`
- Middleware: `verifyToken` + `checkPatientRole`
- Chỉ hiển thị lịch của bệnh nhân đang login

---

### 2. Hủy Lịch Hẹn ✅
**Frontend**:
- Button "🚫 Hủy" trên mỗi lịch hẹn (trạng thái chờ/đã xác nhận)
- Confirm dialog trước khi hủy
- Alert thông báo thành công + refresh danh sách

**Backend**: `server/routes/patientRoutes.js`
- Endpoint: `PUT /api/patient/my-appointments/:id/cancel`
- Validation:
  - Chỉ hủy được lịch của mình
  - Không hủy lịch đã hoàn thành
  - Không hủy lịch đã hủy trước đó
- **Tự động gửi email thông báo hủy lịch** 📧

**Email Template**: `server/services/emailService.js`
- `sendCancellationEmail()` - Thiết kế chuyên nghiệp
- Nội dung: Xác nhận hủy lịch, thông tin lịch đã hủy

---

### 3. Đổi Thời Gian Lịch Hẹn ✅
**Frontend**:
- Button "🔄 Đổi lịch" trên mỗi lịch hẹn
- Modal popup với:
  - Date picker (chỉ chọn ngày tương lai)
  - Dropdown chọn giờ (8:00 - 17:00, mỗi 30 phút)
  - Lưu ý quan trọng (chờ bác sĩ xác nhận lại)
- Kiểm tra conflict nếu đã có bác sĩ

**Backend**: `server/routes/patientRoutes.js`
- Endpoint: `PUT /api/patient/my-appointments/:id/reschedule`
- Body: `{ new_date, new_time }`
- Validation:
  - Không đổi lịch đã hủy/hoàn thành
  - Kiểm tra xung đột giờ với bác sĩ hiện tại
  - Đặt lại status = `waiting_doctor_confirmation`
- **Tự động gửi email thông báo đổi lịch** 📧

**Email Template**: `server/services/emailService.js`
- `sendRescheduleEmail()` - Hiển thị lịch cũ (gạch ngang) vs lịch mới (in đậm)
- Nhấn mạnh: Đang chờ bác sĩ xác nhận

---

### 4. Email Xác Nhận Khi Đặt Lịch ✅
**Trigger**: Ngay sau khi đặt lịch thành công

**Backend**: `server/controllers/bookingController.js`
- Thêm vào `createBooking()` sau khi tạo booking
- Gửi async (không block response)

**Email Template**: `server/services/emailService.js`
- `sendBookingConfirmation()` - Màu xanh lá, badge "Đặt lịch thành công"
- Nội dung: Mã booking, ngày giờ, chuyên khoa
- CTA button: "Xem chi tiết lịch hẹn"

---

### 5. Email Nhắc Lịch Trước Ngày Khám ✅
**Trigger**: Tự động mỗi 1 giờ (background service)

**Backend**: `server/services/reminderService.js`
- `checkAndSendReminders()` - Tìm lịch hẹn trong 24h tới
- `startScheduler()` - Auto start khi server khởi động
- Điều kiện:
  - `appointment_date` = ngày mai
  - `status` IN ('confirmed', 'waiting_doctor_confirmation')
  - `reminder_sent` = false/null
  - `patient_email` IS NOT NULL
- Đánh dấu `reminder_sent = true` sau khi gửi thành công

**Email Template**: `server/services/emailService.js`
- `sendAppointmentReminder()` - Thiết kế đầy đủ nhất
- Nội dung:
  - Ngày giờ khám (màu nổi bật)
  - Bác sĩ phụ trách
  - Chuyên khoa
  - Mã booking
  - Lưu ý quan trọng (đến sớm 15', mang giấy tờ)
  - Link "Xem chi tiết lịch hẹn"

**Auto Start**: `server/server.js`
```javascript
const reminderService = require('./services/reminderService');
reminderService.startScheduler();  // Line ~30
```

---

## 🔧 Cấu Hình Email

### File `.env` (server/)
```env
EMAIL_USER=your-clinic-email@gmail.com
EMAIL_PASSWORD=your-16-digit-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
CLIENT_URL=http://localhost:5173
```

### Hướng Dẫn Tạo Gmail App Password
1. Truy cập https://myaccount.google.com/security
2. Bật "2-Step Verification"
3. Tìm "App passwords" → Chọn Mail + Windows
4. Copy mật khẩu 16 ký tự vào `EMAIL_PASSWORD`

**Chi tiết**: Xem `EMAIL_SETUP_GUIDE.md`

---

## 📊 API Endpoints Mới

### Patient Routes (Protected)
```
GET  /api/patient/my-appointments
     → Lấy danh sách lịch hẹn của bệnh nhân
     → Response: Array of bookings with service/doctor/specialty

PUT  /api/patient/my-appointments/:id/cancel
     → Hủy lịch hẹn
     → Body: {} (empty)
     → Side effect: Gửi email hủy lịch
     → Response: { message, appointment }

PUT  /api/patient/my-appointments/:id/reschedule
     → Đổi thời gian lịch hẹn
     → Body: { new_date, new_time }
     → Side effect: Gửi email đổi lịch, đặt status = waiting_doctor_confirmation
     → Response: { success: true, message, appointment }
```

### Booking Controller (Cập nhật)
```
POST /api/customer/bookings
     → Tạo booking mới
     → Side effect MỚI: Gửi email xác nhận đặt lịch
```

---

## 🎨 Frontend Components

### MyAppointments.jsx
**State quản lý**:
- `appointments` - Danh sách lịch hẹn
- `filter` - Filter theo trạng thái
- `showRescheduleModal` - Hiển thị modal đổi lịch
- `rescheduleData` - { id, newDate, newTime }
- `availableSlots` - Các khung giờ khả dụng

**Functions**:
- `handleCancelAppointment(id)` - Hủy lịch + API call
- `handleOpenRescheduleModal(appointment)` - Mở modal + fetch slots
- `handleSubmitReschedule()` - Submit đổi lịch + API call
- `handleViewDetail(appointment)` - Xem chi tiết trong modal

**UI Components**:
- Filter bar (5 options)
- Appointment cards (grid layout)
- Detail modal (thông tin đầy đủ)
- Reschedule modal (date picker + time dropdown)

### MyAppointments.module.css
**Styles mới**:
- `.btnReschedule` - Button cam đổi lịch
- `.formGroup` - Form group cho modal
- `.dateInput`, `.timeSelect` - Input fields
- `.noteBox` - Warning box màu vàng
- `.btnSubmit` - Button xanh lá xác nhận

---

## 🧪 Testing

### Manual Testing Flow

#### Test 1: Đặt Lịch + Email Xác Nhận
```
1. Đăng nhập tài khoản patient
2. Vào /booking → Điền thông tin đầy đủ (kể cả EMAIL)
3. Submit → Chờ alert "Đặt lịch thành công"
4. ✅ Kiểm tra inbox email → Nhận được email xác nhận
```

#### Test 2: Xem Danh Sách Lịch Hẹn
```
1. Vào /my-appointments
2. ✅ Thấy lịch vừa đặt xuất hiện
3. ✅ Filter hoạt động (All, Chờ xác nhận, etc.)
4. ✅ Badge hiển thị đúng màu sắc
```

#### Test 3: Đổi Lịch + Email Thông Báo
```
1. Click "🔄 Đổi lịch" trên 1 appointment
2. ✅ Modal hiện lên với date picker + time dropdown
3. Chọn ngày mới + giờ mới → "Xác nhận đổi lịch"
4. ✅ Alert "Đổi lịch thành công"
5. ✅ Kiểm tra inbox → Nhận email thông báo đổi lịch
6. ✅ Status đổi thành "Chờ bác sĩ xác nhận"
```

#### Test 4: Hủy Lịch + Email Thông Báo
```
1. Click "🚫 Hủy" trên 1 appointment
2. Confirm dialog → OK
3. ✅ Alert "Hủy lịch thành công"
4. ✅ Kiểm tra inbox → Nhận email thông báo hủy lịch
5. ✅ Status đổi thành "Đã hủy"
6. ✅ Button "Đổi lịch" và "Hủy" biến mất
```

#### Test 5: Email Nhắc Lịch (Automated)
```powershell
# Terminal 1: Khởi động server
cd b:\tclinic_nhom3\server
npm start
# Reminder service tự động chạy mỗi 1 giờ

# Terminal 2: Test thủ công
node server/testEmailReminder.js
# ✅ Hiển thị số lịch hẹn ngày mai
# ✅ Gửi email nhắc cho các lịch chưa gửi
```

---

## 📁 Files Đã Thay Đổi

### Backend
```
✅ server/routes/patientRoutes.js
   - Thêm endpoint PUT /my-appointments/:id/reschedule
   - Cập nhật endpoint PUT /my-appointments/:id/cancel (gửi email)

✅ server/controllers/bookingController.js
   - Thêm gửi email xác nhận trong createBooking()

✅ server/services/emailService.js
   - Thêm sendRescheduleEmail()
   - Cập nhật sendCancellationEmail() (cải thiện template)
   - Có sẵn sendBookingConfirmation() và sendAppointmentReminder()

✅ server/services/reminderService.js
   - Cập nhật query hỗ trợ guest bookings (patient_id = null)
   - Sử dụng patient_email từ booking table nếu không có patient

✅ server/.env (cần cập nhật)
   - EMAIL_USER, EMAIL_PASSWORD, SMTP_HOST, SMTP_PORT

✅ server/testEmailReminder.js (NEW)
   - Script test reminder service thủ công
```

### Frontend
```
✅ client/src/pages/customer/MyAppointments.jsx
   - Thêm state showRescheduleModal, rescheduleData, availableSlots
   - Thêm handleOpenRescheduleModal(), handleSubmitReschedule()
   - Cập nhật handleCancelAppointment() (hiển thị thông báo rõ ràng)
   - Thêm Reschedule Modal UI (date picker + time dropdown)
   - Bỏ button "Nhắc lịch" (dùng email auto thay thế)

✅ client/src/pages/customer/MyAppointments.module.css
   - Thêm .btnReschedule, .formGroup, .dateInput, .timeSelect
   - Thêm .noteBox, .btnSubmit
```

### Documentation (NEW)
```
✅ EMAIL_SETUP_GUIDE.md
   - Hướng dẫn chi tiết cấu hình Gmail SMTP
   - Troubleshooting thường gặp
   - Email templates preview
   - API endpoints liên quan

✅ APPOINTMENT_MANAGEMENT_COMPLETE.md (file này)
   - Tổng hợp tất cả tính năng
   - Testing checklist
   - Files đã thay đổi
```

---

## 🚀 Deployment Checklist

### Production Email Setup
- [ ] Tạo email chính thức phòng khám (support@tclinic.com)
- [ ] Dùng SendGrid/AWS SES thay vì Gmail SMTP
- [ ] Cập nhật CLIENT_URL sang domain production
- [ ] Test gửi email đến nhiều provider (Gmail, Yahoo, Outlook)
- [ ] Kiểm tra email không vào Spam
- [ ] Setup SPF, DKIM, DMARC records
- [ ] Monitor email sending rate

### Database Columns Cần Có
```sql
-- Đảm bảo bảng tn_booking có các cột:
ALTER TABLE tn_booking ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE tn_booking ADD COLUMN IF NOT EXISTS reminder_sent_at DATETIME NULL;
```

### Cron Job (Production)
```bash
# Nếu không dùng built-in scheduler, setup cron:
# Chạy mỗi giờ
0 * * * * cd /path/to/server && node -e "require('./services/reminderService').checkAndSendReminders()"
```

---

## 📞 Support & Troubleshooting

### Email không gửi được?
1. Kiểm tra `.env` có đúng config không
2. Gmail: Dùng App Password, KHÔNG dùng mật khẩu chính
3. Check console logs: `✅ Email sent` hoặc `❌ Email error`
4. Xem chi tiết: `EMAIL_SETUP_GUIDE.md`

### Lịch hẹn không hiển thị?
1. Kiểm tra đã login với role "patient"
2. API endpoint: `GET /api/patient/my-appointments`
3. Check browser console (F12) có lỗi không
4. Kiểm tra database: `SELECT * FROM tn_booking WHERE patient_id = ?`

### Không thể đổi lịch?
1. Kiểm tra status lịch hẹn (chỉ đổi được waiting/confirmed)
2. Chọn ngày trong tương lai
3. Chọn giờ khả dụng (không trùng lịch khác)
4. Check network tab: Response error message

### Reminder service không chạy?
1. Kiểm tra server logs khi khởi động: `🚀 Starting reminder scheduler`
2. Kiểm tra có lịch hẹn ngày mai không
3. Run manual test: `node server/testEmailReminder.js`
4. Kiểm tra column `reminder_sent` trong database

---

## 🎯 Kết Luận

✅ **5/5 tính năng hoàn tất**:
1. ✅ Xem danh sách lịch hẹn
2. ✅ Hủy lịch hẹn (+ email tự động)
3. ✅ Đổi thời gian lịch hẹn (+ email tự động)
4. ✅ Email xác nhận đặt lịch
5. ✅ Email nhắc lịch trước 24h (automated)

**Bonus Features**:
- Filter theo trạng thái
- Modal chi tiết lịch hẹn
- Badge màu sắc trực quan
- Responsive design
- Validation đầy vào
- Xử lý conflict scheduling

**Next Steps** (Optional):
- [ ] Thêm notification browser (Web Push API)
- [ ] Export lịch hẹn sang Google Calendar
- [ ] In phiếu khám bệnh (PDF)
- [ ] Chatbot hỗ trợ đặt lịch
- [ ] SMS reminder (Twilio integration)

---

**Tác giả**: GitHub Copilot AI  
**Ngày hoàn thành**: November 26, 2025  
**Version**: 1.0.0
