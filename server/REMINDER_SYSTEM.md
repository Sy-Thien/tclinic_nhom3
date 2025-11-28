# 📧 Hệ Thống Nhắc Lịch Tự Động

Hệ thống gửi email nhắc lịch khám tự động cho bệnh nhân trước 24 giờ.

## 🚀 Tính Năng

- ✅ **Tự động kiểm tra**: Chạy mỗi 1 giờ để tìm lịch hẹn cần nhắc
- ✅ **Gửi email đẹp**: Email HTML với đầy đủ thông tin lịch hẹn
- ✅ **Tránh gửi trùng**: Đánh dấu `reminder_sent = true` sau khi gửi
- ✅ **API quản lý**: Admin có thể test và xem thống kê
- ✅ **Email templates**: Xác nhận đặt lịch, nhắc lịch, hủy lịch

## ⚙️ Cấu Hình Email

### 1. Sử dụng Gmail

Cập nhật file `.env`:

\`\`\`env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
CLIENT_URL=http://localhost:5173
\`\`\`

### 2. Tạo App Password cho Gmail

1. Vào [Google Account Security](https://myaccount.google.com/security)
2. Bật "2-Step Verification" (xác minh 2 bước)
3. Vào "App passwords" (Mật khẩu ứng dụng)
4. Chọn "Mail" và "Other device" → Nhập tên "T-Clinic"
5. Copy mật khẩu 16 ký tự → Dán vào `EMAIL_PASSWORD`

### 3. Sử dụng dịch vụ khác

**SMTP Gmail:**
\`\`\`
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
\`\`\`

**SMTP Outlook:**
\`\`\`
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
\`\`\`

**SMTP Yahoo:**
\`\`\`
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=465
\`\`\`

## 🗄️ Database Migration

Thêm 2 trường vào bảng `tn_booking`:

\`\`\`bash
cd server
node runMigration.js 20251126-add-reminder-fields-to-bookings.js
\`\`\`

Hoặc chạy SQL trực tiếp:

\`\`\`sql
ALTER TABLE tn_booking 
ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE COMMENT 'Đã gửi email nhắc lịch chưa',
ADD COLUMN reminder_sent_at DATETIME NULL COMMENT 'Thời điểm gửi email nhắc lịch';
\`\`\`

## 📋 API Endpoints

### 1. Gửi nhắc lịch thủ công cho 1 booking

\`\`\`http
POST /api/reminders/send/:bookingId
Authorization: Bearer <admin-token>
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Đã gửi email nhắc lịch thành công",
  "messageId": "<...@smtp.gmail.com>"
}
\`\`\`

### 2. Chạy kiểm tra và gửi tất cả nhắc lịch

\`\`\`http
POST /api/reminders/check-and-send
Authorization: Bearer <admin-token>
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Đã kiểm tra và gửi nhắc lịch",
  "result": {
    "total": 5,
    "success": 4,
    "failed": 1
  }
}
\`\`\`

### 3. Xem thống kê nhắc lịch

\`\`\`http
GET /api/reminders/stats
Authorization: Bearer <admin-token>
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "stats": {
    "totalReminders": 127,
    "todayReminders": 8,
    "pendingReminders": 12
  }
}
\`\`\`

## 🎨 Email Templates

### 1. Nhắc Lịch Khám (24h trước)

- ✅ Thông tin đầy đủ: Ngày, giờ, bác sĩ, chuyên khoa
- ✅ Mã booking để tra cứu
- ✅ Lưu ý quan trọng (đến sớm 15 phút, mang giấy tờ)
- ✅ Nút "Xem chi tiết lịch hẹn"
- ✅ Thông tin liên hệ phòng khám

### 2. Xác Nhận Đặt Lịch

- ✅ Gửi ngay sau khi đặt lịch thành công
- ✅ Thông tin ngày giờ khám
- ✅ Mã booking và trạng thái

### 3. Thông Báo Hủy Lịch

- ✅ Gửi khi lịch bị hủy (bác sĩ/admin/bệnh nhân)
- ✅ Hướng dẫn đặt lịch mới

## 🔧 Cách Hoạt Động

### Luồng Tự Động

1. **Server khởi động** → Scheduler bắt đầu chạy
2. **Mỗi 1 giờ** → Kiểm tra database
3. **Query lịch hẹn:**
   - Ngày khám = hiện tại + 24h
   - Trạng thái: `confirmed` hoặc `waiting_doctor_confirmation`
   - `reminder_sent = false`
   - Bệnh nhân có email
4. **Gửi email** cho từng lịch hẹn
5. **Cập nhật DB:**
   - `reminder_sent = true`
   - `reminder_sent_at = NOW()`

### Ví Dụ

**Hôm nay:** 26/11/2025 10:00 AM

**Scheduler tìm lịch:**
- Ngày khám: 27/11/2025
- Trạng thái: confirmed
- Chưa gửi nhắc lịch

**Kết quả:**
- Tìm thấy 5 lịch
- Gửi email thành công 4 lịch
- 1 lịch thất bại (email không hợp lệ)

## 📝 Code Structure

\`\`\`
server/
├── services/
│   ├── emailService.js          # Tạo và gửi email
│   └── reminderService.js       # Logic kiểm tra và lên lịch
├── controllers/
│   └── reminderController.js    # API endpoints
├── routes/
│   └── reminderRoutes.js        # Routes definition
└── migrations/
    └── 20251126-add-reminder-fields-to-bookings.js
\`\`\`

## 🧪 Testing

### 1. Test gửi email cho 1 booking

\`\`\`bash
curl -X POST http://localhost:5000/api/reminders/send/123 \\
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
\`\`\`

### 2. Test chạy scheduler thủ công

\`\`\`bash
curl -X POST http://localhost:5000/api/reminders/check-and-send \\
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
\`\`\`

### 3. Kiểm tra logs

\`\`\`bash
# Server console sẽ hiển thị:
🔔 Checking appointments for reminders...
📧 Found 3 appointments to remind
✅ Reminder sent for booking: BK001
✅ Reminder sent for booking: BK002
✅ Reminder sent for booking: BK003
✅ Reminder summary: 3 sent, 0 failed
\`\`\`

## 🐛 Troubleshooting

### Email không gửi được

1. **Check email credentials:**
   \`\`\`bash
   echo $EMAIL_USER
   echo $EMAIL_PASSWORD
   \`\`\`

2. **Test SMTP connection:**
   \`\`\`javascript
   // Trong emailService.js, thêm test:
   const transporter = createTransporter();
   transporter.verify((error, success) => {
     if (error) console.log('❌ SMTP Error:', error);
     else console.log('✅ SMTP Ready');
   });
   \`\`\`

3. **Check Gmail settings:**
   - Bật "Less secure app access" (không khuyến khích)
   - Hoặc dùng "App passwords" (khuyến nghị)

### Scheduler không chạy

1. **Check server logs:**
   \`\`\`
   🚀 Starting appointment reminder scheduler...
   ✅ Scheduler started - checking every hour
   \`\`\`

2. **Test manual trigger:**
   \`\`\`bash
   curl -X POST http://localhost:5000/api/reminders/check-and-send
   \`\`\`

### Database lỗi

1. **Check migration:**
   \`\`\`sql
   SHOW COLUMNS FROM tn_booking LIKE 'reminder_%';
   \`\`\`

2. **Check data:**
   \`\`\`sql
   SELECT * FROM tn_booking 
   WHERE appointment_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
   AND reminder_sent = 0;
   \`\`\`

## 🔐 Security Notes

- ⚠️ **Không commit** file `.env` lên Git
- ⚠️ **App Password** an toàn hơn mật khẩu gốc
- ⚠️ API endpoints chỉ cho **admin** truy cập
- ⚠️ Rate limit cho email (tránh spam)

## 📈 Future Improvements

- [ ] SMS reminder (Twilio/AWS SNS)
- [ ] Push notification (Firebase)
- [ ] Email queue (Bull/Redis)
- [ ] Retry failed emails
- [ ] Custom reminder time (12h, 2h before)
- [ ] Multi-language support
- [ ] Email tracking (open rate)
- [ ] Unsubscribe option

## 👨‍💻 Development

\`\`\`bash
# Start server
cd server
npm run dev

# Check logs
# Console sẽ hiển thị mỗi lần scheduler chạy
\`\`\`

## 📞 Support

Nếu có vấn đề, liên hệ:
- Email: support@tclinic.com
- GitHub: [tclinic_nhom3](https://github.com/Sy-Thien/tclinic_nhom3)

---

**Tác giả:** T-Clinic Development Team  
**Ngày tạo:** 26/11/2025  
**Phiên bản:** 1.0.0
