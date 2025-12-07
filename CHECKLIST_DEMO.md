# ✅ CHECKLIST DEMO TCLINIC - ĐỌC TRƯỚC KHI NGỦ!

## 🌙 TỐI TRƯỚC DEMO

### Code & Database
- [ ] Pull code mới nhất: `git pull origin main`
- [ ] Install dependencies (nếu có update):
  ```powershell
  cd server; npm install
  cd client; npm install
  ```
- [ ] Backup database hiện tại (dự phòng)
- [ ] Seed data mới (nếu cần):
  ```powershell
  cd server
  node seedCleanData.js
  ```

### Test toàn bộ flow
- [ ] Khởi động server: `cd server; node server.js`
- [ ] Khởi động client: `cd client; npm run dev`
- [ ] Test flow bệnh nhân:
  - [ ] Đặt lịch khám (chọn specialty → service → doctor → time)
  - [ ] Thanh toán VNPay (dùng thẻ test: 9704198526191432198)
  - [ ] Xem hóa đơn
- [ ] Test flow bác sĩ:
  - [ ] Login: `doctor1@tclinic.com` / `123456`
  - [ ] Xác nhận booking
  - [ ] Khám bệnh + kê đơn (ít nhất 2 loại thuốc)
  - [ ] **In PDF** (QUAN TRỌNG - phải test!)
- [ ] Test flow admin:
  - [ ] Login: `admin` / `123456`
  - [ ] Xem dashboard
  - [ ] Tạo lịch làm việc cho bác sĩ (tạo 1 lịch mẫu)
  - [ ] Xem báo cáo doanh thu

### Test API
- [ ] Chạy Newman test:
  ```powershell
  newman run postman/TClinic_API_Collection.postman_collection.json `
    -e postman/TClinic_Environment.postman_environment.json `
    -r htmlextra --reporter-htmlextra-export test-report.html
  ```
- [ ] Mở `test-report.html`, đảm bảo **0 failed**
- [ ] Nếu có failed → Fix ngay, chạy lại

### GitHub Actions CI/CD
- [ ] Mở GitHub: https://github.com/Sy-Thien/tclinic_nhom3
- [ ] Tab Actions → Trigger workflow "🧪 API Tests"
- [ ] Đợi chạy xong (2-3 phút)
- [ ] **PHẢI PASSED** ✅ (nếu failed → debug)
- [ ] Download artifacts để có sẵn report

### Chuẩn bị tài liệu
- [ ] **ĐỌC KỸ:** `CHEAT_SHEET_DEMO.md` (2 lần!)
- [ ] Đọc lướt: `DEMO_GUIDE.md`
- [ ] Đọc phần Q&A trong `README_DEMO_CICD.md`
- [ ] Chuẩn bị slide (nếu có) - tham khảo `SLIDE_OUTLINE.md`
- [ ] In ra `CHEAT_SHEET_DEMO.md` (dự phòng quên)

### Browser & Tools
- [ ] Bookmark các tab:
  - [ ] http://localhost:5173 (frontend)
  - [ ] https://github.com/Sy-Thien/tclinic_nhom3/actions
  - [ ] `test-report.html` path
- [ ] Clear browser cache & cookies (Ctrl+Shift+Del)
- [ ] Test VNPay sandbox: https://sandbox.vnpayment.vn/
- [ ] Chuẩn bị thẻ test VNPay (ghi ra giấy):
  ```
  Ngân hàng: NCB
  Số thẻ: 9704198526191432198
  Tên: NGUYEN VAN A
  Ngày hết hạn: 07/15
  OTP: 123456
  ```

### Máy tính & Môi trường
- [ ] Đóng tất cả app không cần thiết
- [ ] Tắt notifications (Windows Focus Assist)
- [ ] Sạc laptop đầy pin
- [ ] Chuẩn bị chuột dự phòng (nếu có)
- [ ] Test mic/loa (nếu demo online)
- [ ] Chuẩn bị chai nước

### Ghi chú & Backup
- [ ] Ghi chú các điểm quan trọng lên giấy:
  - [ ] Tài khoản login (admin/doctor/patient)
  - [ ] Thẻ VNPay test
  - [ ] Port: 5000 (backend), 5173 (frontend)
- [ ] Screenshot các màn hình quan trọng (dự phòng lỗi)
- [ ] Backup file `test-report.html` vào USB

---

## ☀️ SÁNG NGÀY DEMO

### 1 giờ trước demo

#### Khởi động hệ thống
- [ ] Mở XAMPP → Start MySQL
- [ ] Verify MySQL running: `netstat -ano | findstr :3306`
- [ ] Terminal 1 - Backend:
  ```powershell
  cd B:\tclinic_nhom3\server
  node server.js
  # Xem log: ✅ Kết nối MySQL thành công
  ```
- [ ] Terminal 2 - Frontend:
  ```powershell
  cd B:\tclinic_nhom3\client
  npm run dev
  # Xem log: Local: http://localhost:5173
  ```
- [ ] Mở browser: http://localhost:5173
- [ ] Verify trang chủ load được

#### Test nhanh 1 lần (5 phút)
- [ ] Đặt lịch nhanh (không cần thanh toán đầy đủ)
- [ ] Login bác sĩ → Xem dashboard
- [ ] Login admin → Xem dashboard
- [ ] **Nếu có lỗi → Fix ngay!**

#### Mở sẵn các tab
- [ ] Browser tab 1: Frontend (localhost:5173)
- [ ] Browser tab 2: GitHub Actions
- [ ] Browser tab 3: Test report HTML
- [ ] File explorer: Thư mục `test-results/`
- [ ] Notepad: `CHEAT_SHEET_DEMO.md` (để nhìn)

#### Kiểm tra cuối
- [ ] Logout tất cả tài khoản (demo từ đầu)
- [ ] Clear localStorage: `localStorage.clear()` (DevTools Console)
- [ ] Refresh trang chủ
- [ ] Volume máy vừa phải
- [ ] Zoom browser: 100% (Ctrl+0)

### 15 phút trước demo

#### Thư giãn & Chuẩn bị tinh thần
- [ ] Uống nước
- [ ] Đọc lướt CHEAT_SHEET 1 lần cuối
- [ ] Thở sâu 3 lần
- [ ] Tự tin: "Mình đã chuẩn bị kỹ rồi!"

#### Double check
- [ ] MySQL: running ✅
- [ ] Server: running ✅ (check console log)
- [ ] Client: running ✅ (check browser)
- [ ] GitHub Actions: latest run passed ✅
- [ ] Test report: opened ✅
- [ ] Slide/notes: ready ✅

---

## 🎤 TRONG LÚC DEMO

### Mindset
- ✅ Nói chậm, rõ ràng
- ✅ Giải thích khi làm, đừng im lặng
- ✅ Mỉm cười, tự tin
- ✅ Nếu lỗi → Bình tĩnh, giải thích nguyên nhân

### Flow chuẩn (15 phút)

#### 1. Giới thiệu (1 phút)
- [ ] Chào thầy/cô
- [ ] Giới thiệu dự án: TClinic - Quản lý phòng khám
- [ ] Công nghệ: Node.js + React + MySQL + CI/CD

#### 2. Demo Bệnh nhân (3 phút)
- [ ] Trang chủ → Đặt lịch khám
- [ ] Chọn: Chuyên khoa → Dịch vụ → Bác sĩ → Giờ
- [ ] Thanh toán VNPay → Dùng thẻ test
- [ ] Xem hóa đơn → **In hóa đơn**

#### 3. Demo Bác sĩ (4 phút)
- [ ] Login: `doctor1@tclinic.com`
- [ ] Dashboard → Lịch làm việc
- [ ] Xác nhận booking
- [ ] Khám bệnh → Kê đơn (2-3 thuốc)
- [ ] **In PDF** ← HIGHLIGHT!
- [ ] Xem hồ sơ bệnh án

#### 4. Demo Admin (3 phút)
- [ ] Login: `admin`
- [ ] Dashboard thống kê
- [ ] Quản lý bác sĩ → **Tạo lịch làm việc** ← HIGHLIGHT!
- [ ] Quản lý booking
- [ ] Báo cáo doanh thu

#### 5. Demo CI/CD (3 phút)
- [ ] Giải thích CI/CD
- [ ] Mở GitHub Actions
- [ ] Giải thích workflow steps
- [ ] Xem kết quả passed ✅
- [ ] Mở test report HTML

#### 6. Kết thúc (1 phút)
- [ ] Tổng kết: 92/100, 50+ APIs, 20+ tables
- [ ] Cảm ơn thầy/cô
- [ ] Mở Q&A

### Lưu ý trong demo
- [ ] Nếu quên → Nhìn CHEAT_SHEET
- [ ] Nếu lỗi VNPay → Skip, giải thích sandbox lag
- [ ] Nếu lỗi server → Restart, xin lỗi
- [ ] Nhấn mạnh: PDF, CI/CD, 5 lớp validation

---

## ❓ CHUẨN BỊ TRẢ LỜI Q&A

### Câu hỏi thường gặp

**Q: Database gì? Tại sao?**
> MySQL vì dữ liệu có cấu trúc, relationships phức tạp, ACID transaction.

**Q: JWT expire?**
> 7 ngày. Auto logout khi expired qua axios interceptor.

**Q: Xử lý double booking?**
> Transaction + check `current_patients < max_patients` atomic.

**Q: Test coverage?**
> 85% integration tests, 50+ test cases. Chưa có unit/E2E.

**Q: CI/CD deploy tự động?**
> Chưa, chỉ test tự động. Có thể mở rộng với Docker.

**Q: Tại sao không TypeScript?**
> Thời gian hạn chế, team chưa quen. Sẽ migrate nếu mở rộng.

**Q: Security như nào?**
> Bcrypt hash password, JWT signed, Sequelize prevent SQL injection, React auto-escape XSS.

### Nếu không biết
- [ ] Thừa nhận: "Em chưa research vấn đề này ạ"
- [ ] Đề xuất: "Em nghĩ có thể giải quyết bằng X"
- [ ] Ghi chú lại để research sau

---

## 🚨 XỬ LÝ SỰ CỐ

### Server crash
1. Check terminal error
2. Restart: `Ctrl+C` → `node server.js`
3. Giải thích: "Đây là lỗi runtime, production sẽ có PM2 auto-restart"

### VNPay timeout
1. Bình tĩnh, đợi 10s
2. Nếu không được → Skip
3. Nói: "Sandbox VNPay đôi khi lag, em sẽ show invoice có sẵn"

### Database lỗi
1. Check XAMPP MySQL
2. Restart MySQL
3. Giải thích: "Production sẽ có health check và failover"

### Quên mật khẩu
1. Nhìn giấy note
2. Hoặc nói: "Em xin phép check tài liệu"
3. File: `TEST_LOGIN_GUIDE.md`

### Network error
1. Check internet
2. Check localhost
3. Giải thích: "Đây là lỗi kết nối, có retry mechanism trong production"

---

## 🎊 SAU DEMO

### Ngay lập tức
- [ ] Cảm ơn thầy/cô
- [ ] Hỏi feedback: "Thầy có góp ý gì cho nhóm em ạ?"
- [ ] Ghi chú lại tất cả feedback

### Về nhà
- [ ] Tự review lại phần demo
- [ ] Note lại phần nào chưa tốt
- [ ] Cải thiện theo feedback của thầy
- [ ] Cập nhật documentation (nếu cần)

### Backup & Archive
- [ ] Commit code cuối cùng
- [ ] Tag release: `git tag v1.0-demo`
- [ ] Push: `git push --tags`
- [ ] Backup database
- [ ] Archive test reports

---

## 💯 ĐIỂM CỘNG NẾU LÀM ĐƯỢC

- [ ] Giải thích rõ ràng, mạch lạc
- [ ] Demo không bị lỗi
- [ ] Trả lời Q&A tự tin
- [ ] Highlight được điểm mạnh (PDF, CI/CD, validation)
- [ ] Thừa nhận điểm yếu một cách chuyên nghiệp
- [ ] Có slide đẹp
- [ ] Thời gian đúng (15-20 phút)

---

## 🍀 LỜI NHẮN CUỐI

**Nhớ:**
- Bạn đã chuẩn bị KỸ LƯỠNG rồi!
- Code đã test kỹ, CI/CD đã passed ✅
- Dự án hoạt động tốt, tài liệu đầy đủ
- Nếu có lỗi nhỏ → Không sao, giải thích được là được!

**Quan trọng nhất:**
- TỰ TIN
- NÓI CHẬM, RÕ RÀNG
- MỈM CƯỜI

**Chúc bạn demo thành công rực rỡ! 🎉🔥**

---

**In checklist này ra, tick từng mục! ✅**
