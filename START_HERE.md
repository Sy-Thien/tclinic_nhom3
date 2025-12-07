# 🎯 BẮT ĐẦU TỪ ĐÂY - HƯỚNG DẪN DEMO MAI

## 🚨 ĐỌC FILE NÀO TRƯỚC?

### ⭐ BẮT BUỘC PHẢI ĐỌC (Tối nay)

**1. `CHECKLIST_DEMO.md`** ← ĐỌC ĐẦU TIÊN!
- Checklist đầy đủ từ tối trước → sáng demo → sau demo
- Tick từng mục để không quên
- **IN RA GIẤY** để dễ check!

**2. `CHEAT_SHEET_DEMO.md`** ← QUAN TRỌNG NHẤT!
- Gợi nhớ nhanh khi demo
- Tài khoản login, thẻ VNPay test
- Câu nói mẫu, Q&A answers
- **ĐỌC 2-3 LẦN** trước khi ngủ!

**3. `README_DEMO_CICD.md`** ← Tổng quan
- File hub tổng hợp tất cả
- Link đến các file khác
- Thống kê dự án

### 📚 ĐỌC NẾU CÓ THỜI GIAN (Mai sáng)

**4. `DEMO_GUIDE.md`**
- Hướng dẫn demo chi tiết (15-20 phút)
- Kịch bản từng phần
- Câu nói đầy đủ

**5. `CI_CD_GUIDE.md`**
- Cách trigger GitHub Actions
- Giải thích workflow
- Troubleshooting

**6. `SLIDE_OUTLINE.md`**
- Outline 16 slides PowerPoint
- Copy vào PPT nếu cần làm slide

### 📖 THAM KHẢO KHI CẦN

**7. `TEST_WORKFLOW_LOCAL.md`**
- Test CI/CD ở local
- Chỉ dùng nếu muốn test trước khi push

**8. `test-workflow-local.ps1`**
- PowerShell script test local
- Chạy: `.\test-workflow-local.ps1`

---

## ⚡ QUICK START (5 PHÚT HIỂU NGAY)

### Dự án là gì?
**TClinic** - Hệ thống quản lý phòng khám với 3 roles:
- **Bệnh nhân**: Đặt lịch → Thanh toán VNPay
- **Bác sĩ**: Khám bệnh → Kê đơn PDF
- **Admin**: Quản lý toàn bộ + Báo cáo

### Công nghệ dùng gì?
- Backend: Node.js + Express + MySQL
- Frontend: React + Vite
- Testing: Postman + Newman
- CI/CD: GitHub Actions

### Điểm nổi bật để nhấn mạnh?
1. **PDF Generation** - Tự động tạo đơn thuốc PDF
2. **VNPay Integration** - Thanh toán online
3. **CI/CD GitHub Actions** - Auto test khi push code
4. **5 lớp validation** - Backend + Frontend
5. **92/100 điểm** - Tự đánh giá

### Tài khoản test?
```
Admin:    admin / 123456
Bác sĩ:   doctor1@tclinic.com / 123456
Bệnh nhân: thien2@gmail.com / 123456

VNPay test card: 9704198526191432198 / NGUYEN VAN A / 07/15 / OTP: 123456
```

---

## 🎬 KỊCh BẢN DEMO 15 PHÚT

### 1. Giới thiệu (1 phút)
> "TClinic - Hệ thống quản lý phòng khám. Số hóa quy trình từ đặt lịch → thanh toán → khám bệnh → báo cáo."

### 2. Demo Bệnh nhân (3 phút)
- Đặt lịch khám (chọn specialty → service → doctor → time)
- Thanh toán VNPay
- Xem hóa đơn

### 3. Demo Bác sĩ (4 phút)
- Dashboard
- Xác nhận booking
- Khám bệnh + kê đơn
- **IN PDF** ← Highlight!
- Hồ sơ bệnh án

### 4. Demo Admin (3 phút)
- Dashboard
- **Tạo lịch làm việc bác sĩ** ← Highlight!
- Quản lý booking
- Báo cáo doanh thu

### 5. Demo CI/CD (3 phút)
- Giải thích GitHub Actions
- Trigger workflow (nếu chưa chạy)
- Xem kết quả passed ✅
- Mở test report HTML

### 6. Kết thúc (1 phút)
> "Xin cảm ơn thầy. Nhóm em mong nhận feedback để cải thiện ạ."

---

## 🔥 ĐIỀU QUAN TRỌNG NHẤT

### ĐỌC TỐI NAY:
1. ✅ `CHECKLIST_DEMO.md` - Tick từng mục
2. ✅ `CHEAT_SHEET_DEMO.md` - Đọc 2-3 lần
3. ✅ Test toàn bộ flow 1 lần

### LÀM SÁNG MAI:
1. ✅ Khởi động server + client
2. ✅ Test nhanh 1 flow
3. ✅ Mở sẵn GitHub Actions, test report
4. ✅ Đọc lại CHEAT_SHEET 1 lần cuối

### TRONG LÚC DEMO:
1. ✅ Nói chậm, rõ ràng
2. ✅ Giải thích khi làm
3. ✅ Highlight: PDF, CI/CD, validation
4. ✅ Tự tin, mỉm cười

### NẾU QUÊN:
- Nhìn `CHEAT_SHEET_DEMO.md`
- Đọc tài khoản login đã ghi
- Bình tĩnh, thở sâu

---

## 📞 CẦN GIÚP GẤP?

### Lỗi server không start
```powershell
# Kill port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
# Restart
cd server; node server.js
```

### Lỗi MySQL không kết nối
- Mở XAMPP → Start MySQL
- Check port 3306: `netstat -ano | findstr :3306`

### Quên mật khẩu
Xem file `TEST_LOGIN_GUIDE.md` hoặc:
```
admin / 123456
doctor1@tclinic.com / 123456
```

### GitHub Actions failed
- Download artifacts → Xem log
- Hoặc dùng báo cáo local đã chạy trước

---

## ✅ CHECKLIST NGẮN (5 MỤC QUAN TRỌNG)

Trước khi ngủ:
- [ ] Đọc `CHECKLIST_DEMO.md` và `CHEAT_SHEET_DEMO.md`
- [ ] Test toàn bộ flow 1 lần (đặt lịch → thanh toán → khám → PDF)
- [ ] Chạy Newman test, đảm bảo passed
- [ ] Trigger GitHub Actions, đảm bảo passed
- [ ] Ghi tài khoản + thẻ VNPay ra giấy

Sáng ngày demo:
- [ ] Start MySQL (XAMPP)
- [ ] Start server: `cd server; node server.js`
- [ ] Start client: `cd client; npm run dev`
- [ ] Test nhanh 1 flow
- [ ] Mở sẵn: Frontend, GitHub Actions, Test report

---

## 🎊 MESSAGE CUỐI CÙNG

**Bạn đã:**
- ✅ Xây dựng hệ thống full-stack hoàn chỉnh
- ✅ Implement 50+ APIs, 20+ tables
- ✅ Setup CI/CD testing tự động
- ✅ Viết documentation chi tiết
- ✅ Self-assessment: 92/100 điểm

**Bạn chỉ cần:**
- ✅ ĐỌC `CHEAT_SHEET_DEMO.md`
- ✅ TỰ TIN
- ✅ NÓI CHẬM, RÕ RÀNG

**Thầy sẽ thấy được:**
- Kỹ năng kỹ thuật tốt
- Khả năng giải quyết vấn đề
- Làm việc nhóm hiệu quả
- Tư duy system design

---

## 🚀 LỘ TRÌNH ĐỌC (THEO THỨ TỰ)

```
1. START_HERE.md (file này) ← BẠN ĐANG Ở ĐÂY
   ↓
2. CHECKLIST_DEMO.md ← ĐỌC TIẾP
   ↓
3. CHEAT_SHEET_DEMO.md ← ĐỌC SAU
   ↓
4. Test flow 1 lần
   ↓
5. Đọc lại CHEAT_SHEET
   ↓
6. Ngủ ngon!
   ↓
7. Sáng mai: Đọc CHEAT_SHEET 1 lần cuối
   ↓
8. DEMO THÀNH CÔNG! 🎉
```

---

**BẮT ĐẦU NGAY:** Mở file `CHECKLIST_DEMO.md` →

**CHÚC BẠN DEMO THÀNH CÔNG RỰC RỠ! 🔥🎉🍀**

---

*TClinic Development Team*  
*December 7, 2025*
