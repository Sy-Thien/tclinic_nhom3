# 📄 CHEAT SHEET - GỢI Ý DEMO NHANH

## 🚀 KHỞI ĐỘNG NHANH

```powershell
# Terminal 1 - Backend
cd B:\tclinic_nhom3\server
node server.js

# Terminal 2 - Frontend
cd B:\tclinic_nhom3\client
npm run dev

# Browser: http://localhost:5173
```

---

## 🔑 TÀI KHOẢN TEST

### Admin
- **Username**: `admin`
- **Password**: `123456`
- **Dashboard**: `/admin`

### Bác sĩ
- **Email**: `doctor1@tclinic.com`
- **Password**: `123456`
- **Dashboard**: `/doctor-portal`

### Bệnh nhân
- **Email**: `thien2@gmail.com`
- **Password**: `123456`
- **Dashboard**: `/patient-dashboard`

### VNPay Test Card
- **Ngân hàng**: NCB
- **Số thẻ**: `9704198526191432198`
- **Tên**: `NGUYEN VAN A`
- **Ngày hết hạn**: `07/15`
- **OTP**: `123456`

---

## 🎯 FLOW DEMO CHUẨN (15 phút)

### PHẦN 1: Bệnh nhân (4 phút)

1. **Trang chủ** (30s)
   - Giới thiệu giao diện
   - Scroll qua các section

2. **Đặt lịch khám** (2 phút)
   - Click "Đặt lịch khám"
   - Chọn: Chuyên khoa → Dịch vụ → Bác sĩ → Ngày/giờ
   - Điền thông tin
   - Submit

3. **Thanh toán VNPay** (1.5 phút)
   - Chọn "Thanh toán VNPay"
   - Dùng thẻ test
   - Quay về → Xem hóa đơn

4. **Dashboard bệnh nhân** (30s)
   - Login
   - Xem lịch hẹn
   - Xem chi tiết booking

### PHẦN 2: Bác sĩ (4 phút)

1. **Dashboard** (30s)
   - Login bác sĩ
   - Xem thống kê

2. **Lịch làm việc** (30s)
   - Xem lịch được phân công

3. **Quản lý lịch hẹn** (1 phút)
   - Filter lịch hẹn
   - Xác nhận 1 booking

4. **Khám bệnh** (1.5 phút)
   - Chọn booking confirmed
   - Bắt đầu khám
   - Nhập chẩn đoán
   - Kê đơn thuốc (2-3 loại)
   - Hoàn thành
   - **In đơn thuốc PDF** ← HIGHLIGHT

5. **Hồ sơ bệnh án** (30s)
   - Xem lịch sử khám của bệnh nhân

### PHẦN 3: Admin (4 phút)

1. **Dashboard** (30s)
   - Thống kê tổng quan
   - Biểu đồ doanh thu

2. **Quản lý bác sĩ** (1.5 phút)
   - Thêm bác sĩ mới (demo form)
   - **Tạo lịch làm việc** ← HIGHLIGHT
   - Hệ thống tự động tạo time slots

3. **Quản lý booking** (1 phút)
   - Filter theo ngày/bác sĩ
   - Xem chi tiết
   - Cập nhật trạng thái

4. **Quản lý thuốc** (30s)
   - Xem danh sách
   - Cảnh báo thuốc sắp hết

5. **Báo cáo doanh thu** (30s)
   - Chọn khoảng thời gian
   - Xem biểu đồ

### PHẦN 4: Testing & CI/CD (3 phút)

1. **Local test** (1.5 phút)
   ```powershell
   newman run postman/TClinic_API_Collection.postman_collection.json `
     -e postman/TClinic_Environment.postman_environment.json `
     -r htmlextra --reporter-htmlextra-export test-report.html
   
   start test-report.html
   ```
   - Mở báo cáo HTML
   - Giải thích: passed tests, response time

2. **GitHub Actions** (1.5 phút)
   - Mở GitHub → tab Actions
   - Click "Run workflow"
   - Giải thích các bước workflow
   - Xem kết quả (nếu chạy trước)
   - Download artifacts

---

## 💡 HIGHLIGHT POINTS (NÓI NHẤN MẠNH)

### Kỹ thuật nổi bật:
- ✅ **JWT Authentication** với role-based access (3 roles)
- ✅ **PDF Generation** tự động với pdfmake
- ✅ **VNPay Integration** sandbox
- ✅ **CI/CD với GitHub Actions** - auto testing
- ✅ **5 lớp validation** cho booking (backend + frontend)
- ✅ **Database transactions** đảm bảo data integrity
- ✅ **Timezone configuration** chính xác (UTC+7)
- ✅ **Email reminder service** tự động

### Chức năng nổi bật:
- ✅ Đặt lịch online 24/7 (không cần login)
- ✅ Thanh toán online qua VNPay
- ✅ Bác sĩ kê đơn điện tử + in PDF
- ✅ Admin phân công lịch tự động tạo slots
- ✅ Báo cáo doanh thu với biểu đồ
- ✅ Hồ sơ bệnh án tổng hợp

---

## ❓ Q&A - TRẢ LỜI NHANH

**Q: Database gì?**
> MySQL với 20+ tables, Sequelize ORM

**Q: JWT expire?**
> 7 ngày, auto logout khi expired

**Q: Xử lý double booking?**
> Transaction + check `current_patients < max_patients` atomic

**Q: Test coverage?**
> 85% integration tests, 50+ test cases

**Q: CI/CD deploy tự động?**
> Chưa, chỉ test tự động. Có thể mở rộng với Docker

**Q: Scalability?**
> Load balancer, Redis cache, read replicas, microservices

**Q: Tại sao không TypeScript?**
> Thời gian hạn chế, team chưa quen TS. Sẽ migrate nếu mở rộng

**Q: Email gửi thật không?**
> Có, dùng nodemailer. Cần config SMTP server

**Q: Mobile app?**
> Chưa có, có thể làm React Native sau

**Q: Bảo mật như nào?**
> - Bcrypt hash password (salt rounds 10)
> - JWT signed với secret key
> - Sequelize parameterized queries (prevent SQL injection)
> - Role-based middleware
> - CORS enabled
> - Input validation backend + frontend

---

## 🎤 CÂU NÓI MẪU

### Mở đầu:
> "Thưa thầy, em xin phép trình bày dự án TClinic - Hệ thống quản lý phòng khám. Dự án giúp số hóa quy trình quản lý, từ đặt lịch online, khám bệnh điện tử, đến báo cáo doanh thu tự động."

### Giới thiệu tính năng:
> "Đây là trang đặt lịch khám. Hệ thống tự động lọc các khung giờ còn trống dựa trên lịch làm việc bác sĩ và số bệnh nhân tối đa mỗi slot."

### Highlight kỹ thuật:
> "Nhóm em đã implement 5 lớp validation để đảm bảo dữ liệu hợp lệ: kiểm tra specialty tồn tại, service thuộc đúng specialty, doctor thuộc đúng chuyên khoa, thời gian không trong quá khứ, và URL params validation ở frontend."

### Demo PDF:
> "Khi bác sĩ hoàn thành khám, hệ thống tự động tạo file PDF đơn thuốc với font tiếng Việt, layout chuyên nghiệp. Bệnh nhân có thể in ra hoặc download."

### Demo CI/CD:
> "Nhóm em setup GitHub Actions để tự động chạy test mỗi khi push code. Workflow bao gồm: setup MySQL container, migrate database, seed dữ liệu test, khởi động server, chạy 50+ test cases với Newman, và upload báo cáo."

### Kết thúc:
> "Em xin cảm ơn thầy. Qua dự án này nhóm em đã áp dụng được kiến thức về backend API, frontend React, database design, testing và CI/CD. Em mong nhận được góp ý của thầy ạ."

---

## ⚠️ LƯU Ý QUAN TRỌNG

### Trước khi demo:
- ✅ Kiểm tra MySQL đã start (XAMPP)
- ✅ Clear database cũ, seed data mới (nếu cần)
- ✅ Test 1 lần flow đầy đủ
- ✅ Chuẩn bị thẻ VNPay test
- ✅ Đóng các app không cần thiết (tăng performance)

### Trong lúc demo:
- ✅ Nói chậm, rõ ràng, giải thích từng bước
- ✅ Không im lặng khi click chuột
- ✅ Nếu lỗi → giải thích nguyên nhân + cách fix
- ✅ Nhấn mạnh điểm nổi bật (PDF, CI/CD, validation)
- ✅ Tự tin, mỉm cười

### Nếu gặp lỗi:
- **500 Error**: "Em xin lỗi thầy, có thể do server chưa start đầy đủ. Em sẽ restart."
- **Network error**: "Đây là lỗi kết nối API, trong production sẽ có retry mechanism."
- **VNPay timeout**: "Sandbox VNPay đôi khi bị lag, em sẽ thử lại hoặc skip sang bước tiếp theo."
- **Database lỗi**: "Em xin phép check database connection. Trong thực tế sẽ có health check và auto reconnect."

### Câu hỏi khó:
- Thừa nhận nếu không biết: "Em chưa research vấn đề này, em sẽ tìm hiểu thêm ạ."
- Đề xuất hướng giải quyết: "Em nghĩ có thể giải quyết bằng cách X, nhưng cần research kỹ hơn."

---

## 📂 FILE THAM KHẢO

Nếu thầy hỏi chi tiết, refer đến các file:

- **Kiến trúc**: `AUTHENTICATION_GUIDE.md`, `DATABASE_READY.md`
- **Booking logic**: `BOOKING_LOGIC_EXPLANATION.md`
- **Testing**: `API_TEST_GUIDE.md`, `HUONG_DAN_TEST_FULL.md`
- **Đánh giá**: `TOM_TAT_DANH_GIA.md`, `DANH_GIA_HE_THONG.md`
- **Validation fixes**: `LO_HONG_RANG_BUOC.md`, `DA_SUA_RANG_BUOC.md`
- **Timezone**: `FIX_TIMEZONE_GUIDE.md`
- **Schedule system**: `DOCTOR_SCHEDULE_COMPLETE.md`

---

## ⏱️ THỜI GIAN DEMO

**Tổng: 15-20 phút**

| Phần | Thời gian |
|------|-----------|
| Giới thiệu tổng quan | 2 phút |
| Demo Bệnh nhân | 4 phút |
| Demo Bác sĩ | 4 phút |
| Demo Admin | 4 phút |
| Demo Testing/CI | 3 phút |
| Q&A | 3-5 phút |

**Tip**: Nếu giới hạn 10 phút → Skip phần Admin hoặc Testing, focus vào flow chính.

---

**Good luck! 🍀**
