/**
 * 🎬 DEMO SCRIPT - Appointment Management Features
 * Hướng dẫn test từng bước các tính năng mới
 */

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   📋 QUẢN LÝ LỊCH HẸN CÁ NHÂN - DEMO GUIDE                   ║
║   T-Clinic Management System                                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

🎯 CÁC TÍNH NĂNG ĐÃ TRIỂN KHAI:

1. ✅ Xem danh sách lịch hẹn
2. ✅ Hủy lịch hẹn (+ email tự động)
3. ✅ Đổi thời gian lịch hẹn (+ email tự động)
4. ✅ Email xác nhận khi đặt lịch
5. ✅ Email nhắc lịch trước 24h (tự động)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 BƯỚC 1: CẤU HÌNH EMAIL (BẮT BUỘC)

1. Mở file: server/.env
2. Cập nhật các dòng sau:

   EMAIL_USER=your-clinic-email@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop  # 16-digit App Password

3. Cách tạo Gmail App Password:
   → Truy cập: https://myaccount.google.com/security
   → Bật "2-Step Verification"
   → Tìm "App passwords"
   → Chọn Mail + Windows
   → Copy mật khẩu 16 ký tự

Chi tiết: Xem file EMAIL_SETUP_GUIDE.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 BƯỚC 2: KHỞI ĐỘNG SERVER

Terminal 1 (Backend):
   cd b:\\tclinic_nhom3\\server
   npm start

   ✅ Xem console log: "🚀 Starting reminder scheduler"
   ✅ Server chạy ở: http://localhost:5000

Terminal 2 (Frontend):
   cd b:\\tclinic_nhom3\\client
   npm run dev

   ✅ Client chạy ở: http://localhost:5173

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 BƯỚC 3: TEST TÍNH NĂNG

┌─────────────────────────────────────────────────────────────┐
│ TEST #1: ĐẶT LỊCH MỚI + EMAIL XÁC NHẬN                      │
└─────────────────────────────────────────────────────────────┘

1. Đăng nhập với tài khoản PATIENT:
   URL: http://localhost:5173/login
   Email: (xem TEST_LOGIN_GUIDE.md)

2. Vào trang đặt lịch:
   URL: http://localhost:5173/booking

3. Điền form đầy đủ:
   - Họ tên: Nguyễn Văn Test
   - Email: your-real-email@gmail.com  ⚠️ QUAN TRỌNG
   - Số điện thoại: 0912345678
   - Chuyên khoa: Chọn bất kỳ
   - Ngày khám: Chọn ngày mai (để test reminder)
   - Triệu chứng: Đau đầu, sốt

4. Nhấn "Đặt lịch khám"

5. ✅ Kiểm tra:
   - Alert "Đặt lịch thành công"
   - Inbox email nhận được "✅ ĐẶT LỊCH THÀNH CÔNG"
   - Email có: Mã booking, ngày giờ, chuyên khoa

┌─────────────────────────────────────────────────────────────┐
│ TEST #2: XEM DANH SÁCH LỊCH HẸN                             │
└─────────────────────────────────────────────────────────────┘

1. Vào trang lịch hẹn:
   URL: http://localhost:5173/my-appointments

2. ✅ Kiểm tra:
   - Thấy lịch vừa đặt xuất hiện
   - Badge hiển thị "Chờ xác nhận" (màu cam)
   - Thông tin đầy đủ: Ngày, giờ, chuyên khoa, giá
   - Có 2 button: "🔄 Đổi lịch" và "🚫 Hủy"

3. Test filter:
   - Click "Tất cả" → Thấy tất cả lịch
   - Click "Chờ xác nhận" → Chỉ thấy lịch pending
   - Click "Đã hủy" → Không thấy gì (chưa có lịch hủy)

┌─────────────────────────────────────────────────────────────┐
│ TEST #3: ĐỔI LỊCH HẸN + EMAIL THÔNG BÁO                     │
└─────────────────────────────────────────────────────────────┘

1. Click button "🔄 Đổi lịch" trên 1 appointment

2. ✅ Modal hiện lên với:
   - Date picker (ngày mới)
   - Dropdown giờ (8:00, 8:30, 9:00, ...)
   - Warning box màu vàng

3. Chọn:
   - Ngày mới: (chọn 2 ngày sau)
   - Giờ mới: 14:00

4. Click "✅ Xác nhận đổi lịch"

5. ✅ Kiểm tra:
   - Alert "Đổi lịch thành công! Email xác nhận đã được gửi"
   - Modal đóng lại
   - Lịch hẹn cập nhật ngày giờ mới
   - Status đổi thành "Chờ bác sĩ xác nhận"
   - Inbox email nhận được "🔄 ĐỔI LỊCH KHÁM"
   - Email hiển thị lịch cũ (gạch ngang) vs lịch mới

┌─────────────────────────────────────────────────────────────┐
│ TEST #4: HỦY LỊCH HẸN + EMAIL THÔNG BÁO                     │
└─────────────────────────────────────────────────────────────┘

1. Click button "🚫 Hủy" trên 1 appointment

2. Confirm dialog hiện lên:
   "Bạn có chắc muốn hủy lịch hẹn này?"
   → Click OK

3. ✅ Kiểm tra:
   - Alert "Hủy lịch thành công! Email thông báo đã được gửi"
   - Lịch hẹn biến mất khỏi "Chờ xác nhận"
   - Xuất hiện trong filter "Đã hủy"
   - Badge đổi thành "Đã hủy" (màu đỏ)
   - Button "Đổi lịch" và "Hủy" biến mất
   - Inbox email nhận được "❌ LỊCH KHÁM BỊ HỦY"

┌─────────────────────────────────────────────────────────────┐
│ TEST #5: EMAIL NHẮC LỊCH TỰ ĐỘNG (24H TRƯỚC)                │
└─────────────────────────────────────────────────────────────┘

⚠️ Chú ý: Tính năng này chạy TỰ ĐỘNG mỗi 1 giờ

A. Test Thủ Công (Ngay lập tức):

   Terminal 3:
   cd b:\\tclinic_nhom3\\server
   node testEmailReminder.js

   ✅ Output sẽ hiển thị:
   - Email configuration
   - Số lịch hẹn ngày mai
   - Số email đã gửi thành công

B. Test Tự Động (Đợi 1 giờ):

   1. Đảm bảo server đang chạy (Terminal 1)
   2. Console log sẽ hiển thị mỗi giờ:
      "🔔 Checking appointments for reminders..."
      "📧 Found X appointments to remind"
      "✅ Reminder sent for booking: BKxxxxxxxx"

C. ✅ Kiểm tra:
   - Inbox nhận email "🏥 NHẮC LỊCH KHÁM"
   - Email có thông tin đầy đủ: Ngày, giờ, bác sĩ, chuyên khoa
   - Lưu ý quan trọng: Đến sớm 15', mang giấy tờ
   - Button "Xem chi tiết lịch hẹn"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🐛 TROUBLESHOOTING

Vấn đề: Email không gửi được
→ Giải pháp:
   1. Kiểm tra .env có EMAIL_USER và EMAIL_PASSWORD
   2. Gmail: Dùng App Password, không dùng mật khẩu thường
   3. Xem console logs: "❌ Email error"
   4. Đọc chi tiết: EMAIL_SETUP_GUIDE.md

Vấn đề: Không thấy lịch hẹn
→ Giải pháp:
   1. Đăng nhập với role "patient"
   2. F12 → Console tab → Xem lỗi
   3. Network tab → Check API /api/patient/my-appointments
   4. Database: SELECT * FROM tn_booking WHERE patient_id = ?

Vấn đề: Không đổi được lịch
→ Giải pháp:
   1. Chỉ đổi lịch đang "Chờ xác nhận" hoặc "Đã xác nhận"
   2. Không đổi lịch đã hủy hoặc hoàn thành
   3. Chọn ngày trong tương lai
   4. Network tab → Xem error message

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 TÀI LIỆU THAM KHẢO

1. EMAIL_SETUP_GUIDE.md
   → Hướng dẫn chi tiết cấu hình email

2. APPOINTMENT_MANAGEMENT_COMPLETE.md
   → Tổng hợp tất cả tính năng đã làm

3. TEST_LOGIN_GUIDE.md
   → Danh sách tài khoản test

4. API_TEST_GUIDE.md
   → Các API endpoints và cách dùng

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ CHECKLIST HOÀN THÀNH

Sau khi test xong, đánh dấu ✅:

[ ] Cấu hình email trong .env
[ ] Server khởi động thành công (reminder scheduler running)
[ ] Đặt lịch mới → Nhận email xác nhận
[ ] Xem danh sách lịch hẹn → Hiển thị đúng
[ ] Filter theo trạng thái → Hoạt động
[ ] Đổi lịch → Nhận email thông báo đổi lịch
[ ] Hủy lịch → Nhận email thông báo hủy lịch
[ ] Email nhắc lịch → Gửi cho lịch hẹn ngày mai (test manual)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 HOÀN TẤT!

Nếu tất cả tests đều pass:
→ Hệ thống quản lý lịch hẹn đã sẵn sàng sử dụng!

Nếu gặp vấn đề:
→ Xem phần TROUBLESHOOTING ở trên
→ Hoặc liên hệ support

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
