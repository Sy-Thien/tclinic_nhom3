# 📧 Hướng Dẫn Cấu Hình Email Cho T-Clinic

## Tổng Quan Tính Năng Email

### 1. Email Xác Nhận Đặt Lịch
- **Khi nào gửi**: Ngay sau khi bệnh nhân đặt lịch thành công
- **Nội dung**: Thông tin lịch hẹn, mã booking, ngày giờ khám
- **Template**: `emailService.sendBookingConfirmation()`

### 2. Email Thông Báo Hủy Lịch
- **Khi nào gửi**: Khi bệnh nhân hủy lịch hẹn
- **Nội dung**: Xác nhận hủy lịch, thông tin lịch đã hủy
- **Template**: `emailService.sendCancellationEmail()`

### 3. Email Thông Báo Đổi Lịch
- **Khi nào gửi**: Khi bệnh nhân đổi thời gian lịch hẹn
- **Nội dung**: Lịch cũ (gạch ngang), lịch mới (in đậm), trạng thái chờ xác nhận
- **Template**: `emailService.sendRescheduleEmail()`

### 4. Email Nhắc Lịch Trước 24h
- **Khi nào gửi**: Tự động mỗi giờ, gửi cho các lịch hẹn trong 24h tới
- **Nội dung**: Nhắc nhở chi tiết lịch khám, lưu ý quan trọng
- **Template**: `emailService.sendAppointmentReminder()`
- **Service**: `reminderService.checkAndSendReminders()` (chạy background)

---

## Cấu Hình Gmail SMTP

### Bước 1: Tạo App Password
1. Truy cập https://myaccount.google.com/security
2. Bật **2-Step Verification** (nếu chưa bật)
3. Tìm **App passwords** (Mật khẩu ứng dụng)
4. Chọn **Mail** và **Windows Computer**
5. Tạo và copy mật khẩu 16 ký tự

### Bước 2: Cập Nhật File .env
```env
# server/.env
EMAIL_USER=your-clinic-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # 16-digit app password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
CLIENT_URL=http://localhost:5173
```

### Bước 3: Khởi Động Lại Server
```powershell
cd b:\tclinic_nhom3\server
npm start
```

---

## Kiểm Tra Email Đang Hoạt Động

### Test 1: Email Đặt Lịch
```powershell
# Frontend: Đặt lịch mới tại http://localhost:5173/booking
# Điền đầy đủ thông tin, đặc biệt là EMAIL
# Sau khi đặt lịch, kiểm tra inbox email
```

### Test 2: Email Hủy Lịch
```powershell
# Frontend: Vào http://localhost:5173/my-appointments
# Nhấn nút "🚫 Hủy" trên lịch hẹn
# Xác nhận → Kiểm tra inbox
```

### Test 3: Email Đổi Lịch
```powershell
# Frontend: Vào http://localhost:5173/my-appointments
# Nhấn nút "🔄 Đổi lịch"
# Chọn ngày giờ mới → Xác nhận
# Kiểm tra inbox
```

### Test 4: Email Nhắc Lịch (Manual)
```javascript
// Tạo file: server/testReminder.js
const reminderService = require('./services/reminderService');

async function test() {
    const result = await reminderService.checkAndSendReminders();
    console.log('Result:', result);
}

test();
```

```powershell
# Chạy test
node server/testReminder.js
```

---

## Troubleshooting

### Lỗi: "Invalid login: 535-5.7.8 Username and Password not accepted"
**Nguyên nhân**: Sai mật khẩu hoặc chưa bật App Password  
**Giải pháp**:
1. Kiểm tra EMAIL_USER có đúng không
2. Xóa khoảng trắng trong EMAIL_PASSWORD
3. Tạo lại App Password từ Google

### Lỗi: "self signed certificate in certificate chain"
**Nguyên nhân**: Proxy/Firewall chặn SSL  
**Giải pháp**: Thêm vào `emailService.js`:
```javascript
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { ... },
    tls: {
        rejectUnauthorized: false  // ⚠️ Chỉ dùng cho dev
    }
});
```

### Email không gửi nhưng không báo lỗi
**Nguyên nhân**: Gmail chặn "Less secure apps"  
**Giải pháp**:
1. Dùng App Password (không dùng mật khẩu chính)
2. Kiểm tra https://myaccount.google.com/lesssecureapps (deprecated)
3. Dùng OAuth2 (advanced)

### Email vào Spam
**Giải pháp**:
1. Thêm địa chỉ gửi vào danh bạ
2. Cấu hình SPF/DKIM (production)
3. Đổi domain email (dùng domain riêng thay vì @gmail.com)

---

## Cấu Hình Reminder Service

### Auto Start (Khuyến Nghị)
Service đã tự động khởi động trong `server.js`:
```javascript
// server/server.js (line ~30)
const reminderService = require('./services/reminderService');
reminderService.startScheduler();  // Chạy mỗi 1 giờ
```

### Thay Đổi Tần Suất
Sửa file `server/services/reminderService.js`:
```javascript
// Chạy mỗi 30 phút
setInterval(() => {
    this.checkAndSendReminders();
}, 30 * 60 * 1000);  // 30 minutes

// Chạy mỗi 6 giờ
setInterval(() => {
    this.checkAndSendReminders();
}, 6 * 60 * 60 * 1000);  // 6 hours
```

### Thay Đổi Thời Gian Nhắc
Sửa file `server/services/reminderService.js` (line ~13):
```javascript
// Nhắc trước 48h
reminderTime.setHours(now.getHours() + 48);

// Nhắc trước 12h
reminderTime.setHours(now.getHours() + 12);

// Nhắc trước 2h
reminderTime.setHours(now.getHours() + 2);
```

---

## Logs & Monitoring

### Xem Email Logs
```powershell
# Terminal đang chạy server sẽ hiển thị:
✅ Booking confirmation sent to: patient@email.com
✅ Reminder sent for booking: BK12345678
❌ Failed to send reminder for: BK87654321
```

### Kiểm Tra Database
```sql
-- Xem lịch hẹn đã gửi nhắc
SELECT booking_code, patient_email, appointment_date, 
       reminder_sent, reminder_sent_at 
FROM tn_booking 
WHERE reminder_sent = true;

-- Xem lịch hẹn cần nhắc
SELECT booking_code, patient_email, appointment_date, appointment_time
FROM tn_booking 
WHERE appointment_date = CURDATE() + INTERVAL 1 DAY
  AND status IN ('confirmed', 'waiting_doctor_confirmation')
  AND reminder_sent = false;
```

---

## API Endpoints Liên Quan

### Frontend Routes (Protected)
```
GET  /api/patient/my-appointments        - Xem danh sách lịch hẹn
PUT  /api/patient/my-appointments/:id/cancel - Hủy lịch (gửi email)
PUT  /api/patient/my-appointments/:id/reschedule - Đổi lịch (gửi email)
POST /api/customer/bookings              - Đặt lịch mới (gửi email)
```

### Email Triggers
| Action | Endpoint | Email Template |
|--------|----------|----------------|
| Đặt lịch mới | POST /api/customer/bookings | sendBookingConfirmation |
| Hủy lịch | PUT /api/patient/.../cancel | sendCancellationEmail |
| Đổi lịch | PUT /api/patient/.../reschedule | sendRescheduleEmail |
| Nhắc trước 24h | Auto (cron job) | sendAppointmentReminder |

---

## Production Checklist

- [ ] Đổi EMAIL_USER sang email chính thức phòng khám
- [ ] Tạo App Password mới cho production
- [ ] Cập nhật CLIENT_URL sang domain thật
- [ ] Test gửi email đến nhiều loại email (Gmail, Yahoo, Outlook)
- [ ] Kiểm tra email không vào Spam
- [ ] Thiết lập cron job backup cho reminder service
- [ ] Monitor email sending rate (Gmail giới hạn 500/ngày)
- [ ] Cân nhắc dùng SendGrid/AWS SES cho production

---

## Email Templates Preview

### 1. Booking Confirmation
```
✅ ĐẶT LỊCH THÀNH CÔNG
Mã: BK12345678

Xin chào Nguyễn Văn A,

Cảm ơn bạn đã đặt lịch khám tại T-Clinic.

📅 22/11/2025 - ⏰ 09:00
🏥 Khám Tim Mạch

Chúng tôi sẽ gửi email nhắc nhở trước giờ khám.
```

### 2. Cancellation Notice
```
❌ LỊCH KHÁM BỊ HỦY

Xin chào Nguyễn Văn A,

Lịch khám của bạn vào 22/11/2025 - 09:00 đã bị hủy.

Nếu muốn đặt lại, vui lòng truy cập website.
```

### 3. Reschedule Notice
```
🔄 ĐỔI LỊCH KHÁM
Mã: BK12345678

Lịch cũ: 22/11/2025 - 09:00
Lịch mới: 23/11/2025 - 14:00

⚠️ Đang chờ bác sĩ xác nhận
```

### 4. Reminder (24h Before)
```
🏥 NHẮC LỊCH KHÁM

Xin chào Nguyễn Văn A,

Bạn có lịch khám vào:
📅 22/11/2025 - ⏰ 09:00
👨‍⚕️ BS. Trần Văn B
🏥 Tim Mạch

⚠️ Vui lòng có mặt trước 15 phút
```

---

**Lưu ý**: Tất cả email đều có thiết kế responsive, hiển thị đẹp trên mobile/desktop.

**Support**: Kiểm tra `server/services/emailService.js` để tùy chỉnh template HTML.
