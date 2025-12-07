# 📊 SLIDE DEMO - TCLINIC (Outline Text)

## Sử dụng
Copy nội dung này vào PowerPoint/Google Slides. Mỗi heading `##` = 1 slide.

---

## Slide 1: Trang bìa
**TÊU TRUNG TÂM:**
# TClinic
## Hệ thống Quản lý Phòng khám

**Dưới:**
- Nhóm: [Tên nhóm]
- Thành viên: [Danh sách]
- Giảng viên: [Tên thầy/cô]
- Năm: 2025

---

## Slide 2: Bối cảnh & Mục tiêu

### 🎯 Vấn đề
- Phòng khám nhỏ quản lý thủ công bằng sổ sách
- Mất thời gian, dễ sai sót, không hiệu quả

### 💡 Giải pháp
Hệ thống quản lý toàn diện:
- Đặt lịch online 24/7
- Thanh toán điện tử (VNPay)
- Kê đơn thuốc tự động
- Báo cáo doanh thu

### 🎯 Mục tiêu
Số hóa quy trình quản lý phòng khám, tăng hiệu quả, giảm lỗi

---

## Slide 3: Tính năng chính

### 🏥 Bệnh nhân
- ✅ Đăng ký tài khoản
- ✅ Đặt lịch khám online
- ✅ Thanh toán VNPay
- ✅ Xem lịch sử khám, đơn thuốc

### 👨‍⚕️ Bác sĩ
- ✅ Quản lý lịch khám
- ✅ Khám bệnh, kê đơn điện tử
- ✅ In đơn thuốc PDF
- ✅ Xem hồ sơ bệnh án

### 👨‍💼 Admin
- ✅ Quản lý bác sĩ, chuyên khoa
- ✅ Phân công lịch làm việc
- ✅ Quản lý thuốc, tồn kho
- ✅ Báo cáo doanh thu

---

## Slide 4: Kiến trúc hệ thống

### 🏗️ Mô hình 3-tier

```
┌─────────────────────┐
│   FRONTEND (React)  │
│  - React Router v7  │
│  - Axios API calls  │
└─────────┬───────────┘
          │ REST API
          │ JWT Auth
┌─────────▼───────────┐
│  BACKEND (Node.js)  │
│  - Express          │
│  - Sequelize ORM    │
└─────────┬───────────┘
          │ SQL
┌─────────▼───────────┐
│  DATABASE (MySQL)   │
│  - 20+ tables       │
└─────────────────────┘
```

---

## Slide 5: Công nghệ sử dụng

### Backend
- Node.js 18 + Express
- Sequelize ORM
- MySQL 8.0
- JWT Authentication
- bcrypt (password hashing)

### Frontend
- React 18 + Vite
- React Router v7
- Axios
- CSS Modules

### Testing & CI/CD
- Postman + Newman
- GitHub Actions
- newman-reporter-htmlextra

### Others
- VNPay sandbox
- pdfmake (PDF generation)
- nodemailer (email)

---

## Slide 6: Database Schema

### 📊 20+ bảng chính

**User tables:**
- tn_admins, tn_doctors, tn_patients

**Core tables:**
- tn_booking, tn_time_slots, tn_doctor_schedules

**Medical tables:**
- tn_consultation, tn_prescription, tn_drugs

**Billing tables:**
- tn_invoice, tn_invoice_items

**Reference tables:**
- tn_specialties, tn_services, tn_rooms

→ Full normalization, foreign keys, indexes

---

## Slide 7: Flow đặt lịch khám

```
1. Bệnh nhân chọn chuyên khoa
   ↓
2. Chọn dịch vụ (thuộc chuyên khoa)
   ↓
3. Chọn bác sĩ (thuộc chuyên khoa)
   ↓
4. Chọn ngày & giờ (từ time_slots còn trống)
   ↓
5. Điền thông tin, lý do khám
   ↓
6. Submit → Tạo booking (status: pending)
   ↓
7. Chuyển sang thanh toán VNPay
   ↓
8. Thanh toán thành công → Tạo invoice
   ↓
9. Bác sĩ xác nhận → confirmed
   ↓
10. Khám bệnh → Kê đơn → completed
```

---

## Slide 8: Tính năng nổi bật

### 🔐 Authentication & Authorization
- JWT token (7-day expiry)
- Role-based access control (3 roles)
- bcrypt password hashing

### 📄 PDF Generation
- Tự động tạo PDF đơn thuốc
- pdfmake với font tiếng Việt
- Layout chuyên nghiệp

### 💳 VNPay Integration
- Sandbox payment gateway
- HMAC-SHA512 signature
- Return URL handling

### 🔒 Security & Validation
- 5 lớp validation (backend + frontend)
- SQL injection prevention
- XSS protection (React auto-escape)
- Database transactions

---

## Slide 9: Testing & CI/CD

### 🧪 API Testing
- 50+ test cases với Postman/Newman
- Test coverage: 85%
- Auto-generate HTML report

### 🚀 GitHub Actions CI/CD
- Tự động chạy test khi push code
- Setup MySQL container
- Run 50+ tests
- Upload artifacts (30 days)

### 📊 Test Results
```
┌─────────────────────────┬────────┬────────┐
│                         │ Total  │ Failed │
├─────────────────────────┼────────┼────────┤
│ Requests                │     52 │      0 │
│ Assertions              │    156 │      0 │
└─────────────────────────┴────────┴────────┘
```

---

## Slide 10: Demo

### 🎬 LIVE DEMO

**Flow demo:**
1. Bệnh nhân đặt lịch + thanh toán VNPay
2. Bác sĩ khám bệnh + kê đơn PDF
3. Admin tạo lịch làm việc bác sĩ
4. Chạy API test với Newman
5. GitHub Actions CI/CD

---

## Slide 11: Challenges & Solutions

### 🚧 Thách thức gặp phải

**1. Quản lý Time Slots phức tạp**
- Giải pháp: Table `time_slots` với capacity tracking

**2. Validation từ nhiều nguồn**
- Giải pháp: 5 lớp validation (backend + frontend + URL params)

**3. Timezone mismatch**
- Giải pháp: Sequelize timezone config (+07:00)

**4. PDF font tiếng Việt**
- Giải pháp: Embed Roboto font vào pdfmake

**5. CI/CD với database**
- Giải pháp: MySQL service container trong GitHub Actions

---

## Slide 12: Kết quả đạt được

### 📊 Thống kê

**Code:**
- Backend: 50+ API endpoints
- Frontend: 40+ pages/components
- Database: 20+ tables
- Tests: 50+ test cases
- Documentation: 20+ MD files

**Performance:**
- API response: < 200ms
- Page load: < 2s
- Database queries optimized

**Self-assessment: 92/100** (Xuất sắc)

---

## Slide 13: Hướng phát triển

### 🚀 Ngắn hạn (1-2 tháng)
- Email/SMS notifications
- Export báo cáo Excel
- Dashboard charts nâng cao
- Upload ảnh xét nghiệm

### 🔮 Trung hạn (3-6 tháng)
- Mobile app (React Native)
- Video consultation (WebRTC)
- AI chatbot tư vấn
- Integration bảo hiểm y tế

### 🌟 Dài hạn (6-12 tháng)
- Multi-clinic support
- Blockchain medical records
- ML để dự đoán bệnh

---

## Slide 14: Bài học kinh nghiệm

### 💡 Nhóm đã học được

✅ Làm việc nhóm với Git (branching, PRs)  
✅ Design database chuẩn 3NF  
✅ RESTful API best practices  
✅ Frontend/Backend separation  
✅ Testing & CI/CD automation  
✅ Security (JWT, bcrypt, SQL injection)  
✅ Documentation kỹ lưỡng  
✅ Problem-solving trong dự án thực tế  

---

## Slide 15: Kết luận

### 🎯 Tổng kết

**Đã hoàn thành:**
- ✅ Hệ thống full-stack hoàn chỉnh
- ✅ 3 roles với quyền hạn rõ ràng
- ✅ Testing & CI/CD tự động
- ✅ Documentation chi tiết

**Ý nghĩa:**
- Áp dụng kiến thức thực tế
- Giải quyết vấn đề thực tế
- Chuẩn bị cho công việc sau này

**Lời cảm ơn:**
> Xin cảm ơn thầy/cô đã hướng dẫn và lắng nghe.  
> Nhóm em mong nhận được góp ý để hoàn thiện hơn.

---

## Slide 16: Q&A

### ❓ Câu hỏi & Thảo luận

**Liên hệ:**
- GitHub: github.com/Sy-Thien/tclinic_nhom3
- Email: [email nhóm]
- Documentation: Xem repo

**Xin cảm ơn! 🙏**

---

## HƯỚNG DẪN TẠO SLIDE

### Design Tips:
1. **Màu sắc:** Dùng màu xanh dương/trắng (y tế)
2. **Font:** Sans-serif (Arial, Roboto)
3. **Icons:** Dùng emoji hoặc Font Awesome
4. **Layout:** Đơn giản, tối đa 5 bullet points/slide
5. **Images:** Screenshot demo, diagram kiến trúc

### Slide quan trọng cần hình ảnh:
- Slide 4: Sơ đồ kiến trúc 3-tier
- Slide 6: ERD database diagram
- Slide 7: Flowchart đặt lịch
- Slide 10: Screenshots demo
- Slide 12: Biểu đồ thống kê

### Animation:
- Không dùng quá nhiều animation
- Bullet points: Fade in từng cái
- Slide transition: Simple fade

### Time allocation:
- Slide 1-3: 2 phút
- Slide 4-8: 3 phút
- Slide 9: 2 phút
- Slide 10 (Demo): 8 phút ⭐
- Slide 11-15: 3 phút
- Slide 16 (Q&A): 2 phút
- **Tổng: 20 phút**

---

**Good luck! 🍀**
