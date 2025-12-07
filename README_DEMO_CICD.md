# 📚 TÀI LIỆU DEMO & CI/CD - TCLINIC

## 🎯 MỤC ĐÍCH

Bộ tài liệu này hướng dẫn:
1. **Demo dự án** cho thầy/cô giáo
2. **Chạy CI/CD** với GitHub Actions
3. **Test API** với Newman/Postman
4. **Troubleshoot** các lỗi thường gặp

---

## 📋 DANH SÁCH TÀI LIỆU

### 1. Demo cho thầy
- **`DEMO_GUIDE.md`** ⭐ - Hướng dẫn demo chi tiết (15-20 phút)
- **`CHEAT_SHEET_DEMO.md`** ⭐ - Gợi nhớ nhanh khi demo (phải đọc!)
- **`TEST_LOGIN_GUIDE.md`** - Tài khoản đăng nhập test

### 2. CI/CD & Testing
- **`CI_CD_GUIDE.md`** ⭐ - Hướng dẫn GitHub Actions
- **`API_TEST_GUIDE.md`** - Tài liệu API endpoints
- **`HUONG_DAN_TEST_FULL.md`** - Hướng dẫn test đầy đủ

### 3. Kỹ thuật & Architecture
- **`TOM_TAT_DANH_GIA.md`** - Tự đánh giá hệ thống (92/100)
- **`DANH_GIA_HE_THONG.md`** - Chi tiết từng tiêu chí
- **`AUTHENTICATION_GUIDE.md`** - Cơ chế JWT auth
- **`BOOKING_LOGIC_EXPLANATION.md`** - Logic đặt lịch khám
- **`DATABASE_READY.md`** - Schema database

### 4. Validation & Security
- **`LO_HONG_RANG_BUOC.md`** - Lỗ hổng validation đã phát hiện
- **`DA_SUA_RANG_BUOC.md`** - Các fix đã thực hiện
- **`FIX_TIMEZONE_GUIDE.md`** - Sửa lỗi timezone

### 5. Scripts & Tools
- **`test-workflow-local.ps1`** - Test CI/CD ở local
- **`TEST_WORKFLOW_LOCAL.md`** - Hướng dẫn script
- `.github/workflows/api-tests.yml` - GitHub Actions config

---

## 🚀 QUICK START

### Demo cho thầy (Mai demo)

**1. Đọc trước:**
```
✅ CHEAT_SHEET_DEMO.md  (QUAN TRỌNG!)
✅ DEMO_GUIDE.md         (Đọc lướt, nắm flow)
```

**2. Chuẩn bị:**
```powershell
# Khởi động server
cd B:\tclinic_nhom3\server
node server.js

# Terminal 2: Client
cd B:\tclinic_nhom3\client
npm run dev

# Mở browser: http://localhost:5173
```

**3. Test 1 lần flow:**
- Đặt lịch → Thanh toán VNPay → Bác sĩ khám → In đơn thuốc PDF
- Login admin → Tạo lịch bác sĩ
- Chạy test API: `newman run ...`

**4. Mở sẵn:**
- GitHub Actions tab
- Test report HTML
- CHEAT_SHEET_DEMO.md (để nhìn khi quên)

### Chạy CI/CD

**Option 1: Trigger thủ công (Demo cho thầy)**
1. Mở: https://github.com/Sy-Thien/tclinic_nhom3
2. Tab Actions → Workflow "🧪 API Tests"
3. Click "Run workflow" → main → Run

**Option 2: Tự động khi push**
```powershell
git add .
git commit -m "test: trigger CI"
git push origin main
```

**Option 3: Test local trước**
```powershell
.\test-workflow-local.ps1
# Nếu pass → push lên GitHub
```

### Test API local

```powershell
# Đảm bảo server đang chạy
cd B:\tclinic_nhom3

newman run postman/TClinic_API_Collection.postman_collection.json `
  -e postman/TClinic_Environment.postman_environment.json `
  -r htmlextra --reporter-htmlextra-export test-report.html

start test-report.html
```

---

## 🎤 KỊCh BẢN DEMO CHUẨN (15 phút)

### Phần 1: Giới thiệu (2 phút)
> "Thưa thầy, em xin trình bày dự án TClinic - Hệ thống quản lý phòng khám.
> 
> Hệ thống giúp số hóa quy trình: đặt lịch online, thanh toán VNPay, kê đơn điện tử, báo cáo doanh thu.
> 
> Công nghệ: Node.js + Express + MySQL backend, React frontend, CI/CD với GitHub Actions."

### Phần 2: Demo flow (10 phút)

**Bệnh nhân (3 phút):**
1. Trang chủ → Đặt lịch khám
2. Chọn chuyên khoa → dịch vụ → bác sĩ → giờ
3. Thanh toán VNPay (thẻ test)
4. Xem hóa đơn

**Bác sĩ (3 phút):**
1. Dashboard → Xem lịch làm việc
2. Xác nhận lịch hẹn
3. Khám bệnh → Kê đơn thuốc
4. **In PDF** ← Highlight!
5. Xem hồ sơ bệnh án

**Admin (4 phút):**
1. Dashboard thống kê
2. Quản lý bác sĩ
3. **Tạo lịch làm việc** ← Highlight!
4. Quản lý booking
5. Báo cáo doanh thu

### Phần 3: CI/CD (3 phút)

1. **Giới thiệu:** "Hệ thống tự động test khi push code"
2. **Mở GitHub Actions:** Trigger workflow
3. **Giải thích workflow:** Setup → Test → Upload
4. **Xem kết quả:** All passed ✅
5. **Download report:** Mở HTML

---

## 💡 ĐIỂM NHẤN MẠNH

### Khi demo:
- ✅ **JWT Authentication** - 3 roles, token 7 ngày
- ✅ **PDF Generation** - pdfmake, font tiếng Việt
- ✅ **VNPay Integration** - sandbox test
- ✅ **5 lớp validation** - backend + frontend
- ✅ **CI/CD GitHub Actions** - auto test
- ✅ **Database transactions** - đảm bảo integrity
- ✅ **Email reminders** - node-cron tự động

### Khi Q&A:
- ✅ **MySQL vì**: Dữ liệu có cấu trúc, relationships phức tạp
- ✅ **JWT expire 7 ngày**: Auto logout khi expired
- ✅ **Race condition**: Transaction + atomic increment
- ✅ **Test coverage**: 85% integration tests
- ✅ **Security**: bcrypt, JWT, SQL injection prevention

---

## 📊 THỐNG KÊ DỰ ÁN

**Code:**
- Backend: 50+ API endpoints
- Frontend: 40+ pages/components
- Database: 20+ tables
- Tests: 50+ test cases
- Docs: 20+ markdown files

**Điểm tự đánh giá: 92/100** (Xuất sắc)

**Công nghệ:**
- Node.js 18 + Express
- React 18 + Vite
- MySQL 8.0 + Sequelize ORM
- JWT + bcrypt
- Postman + Newman
- GitHub Actions

---

## ❓ Q&A DỰ KIẾN

<details>
<summary><b>Q: Tại sao chọn MySQL thay vì MongoDB?</b></summary>

> MySQL phù hợp với dữ liệu có cấu trúc rõ ràng và relationships phức tạp (booking → patient → doctor → specialty). ACID transactions đảm bảo tính toàn vẹn khi thanh toán, kê đơn.

</details>

<details>
<summary><b>Q: JWT token có expire không?</b></summary>

> Có, em set 7 ngày. Khi expired, user phải login lại. Frontend có axios interceptor tự động logout khi gặp 401.

</details>

<details>
<summary><b>Q: Xử lý race condition khi 2 người đặt cùng lúc?</b></summary>

> Backend dùng transaction + database lock. Check `current_patients < max_patients` trong transaction, sau đó increment atomic để tránh double booking.

</details>

<details>
<summary><b>Q: Test coverage bao nhiêu %?</b></summary>

> Integration test (API) đạt 85% với 50+ test cases. Chưa có unit test và E2E. Nếu mở rộng sẽ bổ sung Jest (unit test) và Playwright (E2E).

</details>

<details>
<summary><b>Q: CI/CD có deploy tự động không?</b></summary>

> Hiện tại chỉ test tự động. Để deploy cần setup Docker + deployment target (VPS/Heroku/AWS). Có thể mở rộng workflow để auto deploy khi test passed.

</details>

<details>
<summary><b>Q: Hệ thống có gửi email không?</b></summary>

> Có service reminder tự động gửi email nhắc lịch hẹn trước 24h. Dùng nodemailer + node-cron, chạy mỗi giờ.

</details>

---

## 🔧 TROUBLESHOOTING

### Server không start
```powershell
# Check port 5000 có bị chiếm không
netstat -ano | findstr :5000
# Kill process nếu cần
taskkill /PID <PID> /F
```

### MySQL không kết nối
- Check XAMPP MySQL đã start chưa
- Verify credentials trong `server/config/config.json`
- Test: `mysql -u root -p`

### Newman test failed
- Đảm bảo server đang chạy port 5000
- Check database có dữ liệu test
- Xem chi tiết trong `test-report.html`

### GitHub Actions failed
- Download artifacts để xem log chi tiết
- Check workflow file syntax: `.github/workflows/api-tests.yml`
- Verify secrets (nếu dùng): Settings → Secrets

---

## 📞 LIÊN HỆ & LINKS

**GitHub Repo**: https://github.com/Sy-Thien/tclinic_nhom3  
**Live Demo**: [Chưa deploy]  
**Documentation**: Xem các file .md trong repo

**Người liên hệ**: [Email nhóm trưởng]

---

## ✅ CHECKLIST CUỐI CÙNG

### Trước demo (1 ngày):
- [ ] Pull code mới nhất
- [ ] Test toàn bộ flow (booking → payment → exam)
- [ ] Chạy API tests, đảm bảo pass
- [ ] Trigger GitHub Actions, verify passed
- [ ] Đọc CHEAT_SHEET_DEMO.md 2 lần
- [ ] Chuẩn bị slides (nếu có)

### Sáng ngày demo:
- [ ] Start XAMPP MySQL
- [ ] Chạy server + client
- [ ] Test nhanh 1 flow
- [ ] Mở GitHub Actions tab
- [ ] Mở test-report.html
- [ ] In CHEAT_SHEET_DEMO.md (dự phòng)

### Trong demo:
- [ ] Nói chậm, rõ ràng
- [ ] Giải thích khi làm
- [ ] Highlight điểm mạnh
- [ ] Ghi chú câu hỏi của thầy

### Sau demo:
- [ ] Cảm ơn thầy
- [ ] Note feedback
- [ ] Improve theo suggestions

---

## 🎬 KẾT LUẬN

**Câu kết thúc:**
> "Em xin cảm ơn thầy đã lắng nghe. Qua dự án này nhóm em đã học được rất nhiều về full-stack development, testing và CI/CD. Em mong nhận được góp ý của thầy để hoàn thiện hơn ạ."

---

**Chúc bạn demo thành công! 🎉🍀**

*Generated by TClinic Development Team*  
*Last updated: December 7, 2025*
