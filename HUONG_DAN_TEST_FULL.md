# 🎯 HƯỚNG DẪN TEST TOÀN BỘ ĐỒ ÁN TCLINIC

## 📋 MỤC LỤC
1. [Chuẩn Bị Môi Trường](#1-chuẩn-bị-môi-trường)
2. [Khởi Động Hệ Thống](#2-khởi-động-hệ-thống)
3. [Test Tài Khoản & Đăng Nhập](#3-test-tài-khoản--đăng-nhập)
4. [Test Chức Năng Admin](#4-test-chức-năng-admin)
5. [Test Chức Năng Bác Sĩ](#5-test-chức-năng-bác-sĩ)
6. [Test Chức Năng Bệnh Nhân](#6-test-chức-năng-bệnh-nhân)
7. [Test Quy Trình Đặt Lịch - Khám Bệnh](#7-test-quy-trình-đặt-lịch---khám-bệnh)
8. [Test Tính Năng Nâng Cao](#8-test-tính-năng-nâng-cao)
9. [Xử Lý Lỗi Thường Gặp](#9-xử-lý-lỗi-thường-gặp)

---

## 1. CHUẨN BỊ MÔI TRƯỜNG

### ✅ Kiểm tra cài đặt
```powershell
# Kiểm tra Node.js (cần >= 16)
node --version

# Kiểm tra MySQL (XAMPP hoặc MySQL Workbench)
# Đảm bảo MySQL đang chạy trên port 3306
```

### ✅ Cài đặt dependencies
```powershell
# Backend
cd B:\tclinic_nhom3\server
npm install

# Frontend
cd B:\tclinic_nhom3\client
npm install
```

### ✅ Kiểm tra Database
```powershell
# 1. Mở XAMPP Control Panel
# 2. Start Apache và MySQL
# 3. Vào phpMyAdmin: http://localhost/phpmyadmin
# 4. Kiểm tra database "tn_clinic" đã tồn tại
```

### ✅ Kiểm tra tài khoản test
```powershell
cd B:\tclinic_nhom3\server
node checkAccounts.js
```

**Kết quả mong đợi:**
```
📌 ADMIN ACCOUNTS:
✅ ID: 1
   Username: admin
   Email: admin@clinic.com
   Password: 123456

📌 DOCTOR ACCOUNTS:
✅ ID: 1
   Email: doctor1@clinic.com
   Password: 123456

📌 PATIENT ACCOUNTS:
✅ ID: 1
   Email: patient1@gmail.com
   Password: 123456
```

### 🔧 Nếu không có tài khoản, tạo mới:
```powershell
# Reset password về 123456
node server/updateTestPasswords.js

# Hoặc tạo dữ liệu mẫu
node server/seedDoctorsWithSchedules.js
```

---

## 2. KHỞI ĐỘNG HỆ THỐNG

### Terminal 1: Backend (Server)
```powershell
cd B:\tclinic_nhom3\server
npm start
```

**Kiểm tra:**
- ✅ `Server running on port 5000`
- ✅ `Database connected successfully`
- ✅ `Reminder scheduler started`

### Terminal 2: Frontend (Client)
```powershell
cd B:\tclinic_nhom3\client
npm run dev
```

**Kiểm tra:**
- ✅ `VITE v5.x.x ready in xxx ms`
- ✅ `Local: http://localhost:5173/`
- ✅ `Network: use --host to expose`

### ✅ Mở trình duyệt
```
http://localhost:5173
```

---

## 3. TEST TÀI KHOẢN & ĐĂNG NHẬP

### 🔐 Test Case 1: Admin Login
**Bước thực hiện:**
1. Mở: http://localhost:5173/login
2. Nhập:
   - Username: `admin`
   - Password: `123456`
3. Click "Đăng nhập"

**✅ Kết quả mong đợi:**
- URL tự động chuyển: http://localhost:5173/admin
- Hiển thị "Tổng Quan" (Admin Dashboard)
- Sidebar bên trái có menu: Dashboard, Quản lý bệnh nhân, Quản lý bác sĩ...
- Header hiển thị: "Admin"

**❌ Nếu lỗi:**
- "Tài khoản không tồn tại" → chạy `node server/checkAccounts.js`
- "Mật khẩu không đúng" → chạy `node server/updateTestPasswords.js`
- Không redirect → xóa cache (Ctrl+Shift+R)

---

### 🔐 Test Case 2: Doctor Login
**Bước thực hiện:**
1. Logout (nếu đang đăng nhập)
2. Mở: http://localhost:5173/login
3. Nhập:
   - Email: `doctor1@clinic.com`
   - Password: `123456`
4. Click "Đăng nhập"

**✅ Kết quả mong đợi:**
- URL tự động chuyển: http://localhost:5173/doctor-portal
- Hiển thị "Tổng Quan" (Doctor Dashboard)
- Thống kê: Lịch hẹn hôm nay, Chờ xác nhận, Đã xác nhận, Hoàn thành, Đánh giá ⭐
- Sidebar: Tổng quan, Lịch hẹn, Lịch làm việc, Hồ sơ

**📊 Dashboard hiển thị:**
- 5 stat cards (hôm nay + rating)
- Tuần này / Tháng này (tổng ca, hoàn thành, tỷ lệ %)
- Lịch hẹn sắp tới (5 cuộc hẹn gần nhất)
- Bệnh nhân đã khám gần đây
- **MỚI:** Phản hồi từ bệnh nhân (với rating ⭐)

---

### 🔐 Test Case 3: Patient Login
**Bước thực hiện:**
1. Logout (nếu đang đăng nhập)
2. Mở: http://localhost:5173/login
3. Nhập:
   - Email: `patient1@gmail.com`
   - Password: `123456`
4. Click "Đăng nhập"

**✅ Kết quả mong đợi:**
- URL: http://localhost:5173/ (trang chủ)
- Header hiển thị: "Xin chào, [Tên bệnh nhân]"
- Menu: Trang chủ, Đặt lịch khám, Lịch của tôi, Bác sĩ, Dịch vụ

---

### 🔐 Test Case 4: Phân quyền (Role-Based Access)
**Test Admin không vào được Doctor:**
1. Login admin
2. Gõ URL: http://localhost:5173/doctor-portal
3. ✅ Tự động redirect về: http://localhost:5173/admin

**Test Doctor không vào được Admin:**
1. Login doctor
2. Gõ URL: http://localhost:5173/admin
3. ✅ Tự động redirect về: http://localhost:5173/doctor-portal

**Test Patient không vào được Admin/Doctor:**
1. Login patient
2. Gõ URL: http://localhost:5173/admin hoặc /doctor-portal
3. ✅ Tự động redirect về: http://localhost:5173/

**Test Guest (chưa login):**
1. Logout
2. Gõ URL: http://localhost:5173/admin hoặc /doctor-portal
3. ✅ Redirect về: http://localhost:5173/login

---

## 4. TEST CHỨC NĂNG ADMIN

### 📊 Test Dashboard
1. Login admin
2. Vào: http://localhost:5173/admin

**Kiểm tra hiển thị:**
- [ ] Tổng số bệnh nhân
- [ ] Tổng số bác sĩ
- [ ] Tổng lịch hẹn hôm nay
- [ ] Doanh thu tháng này
- [ ] Biểu đồ (nếu có)
- [ ] Danh sách lịch hẹn gần đây

---

### 👨‍⚕️ Test Quản Lý Bác Sĩ
1. Sidebar → Click "Quản lý bác sĩ"
2. URL: http://localhost:5173/admin/doctors

**Test 1: Xem danh sách**
- [ ] Hiển thị bảng danh sách bác sĩ
- [ ] Có cột: ID, Tên, Email, Chuyên khoa, Trạng thái
- [ ] Có nút: Thêm mới, Sửa, Xóa

**Test 2: Thêm bác sĩ mới**
1. Click "Thêm bác sĩ"
2. Nhập thông tin:
   - Tên: `BS. Nguyễn Văn Test`
   - Email: `doctortest@clinic.com`
   - Password: `123456`
   - Chuyên khoa: Chọn từ dropdown
   - Số điện thoại: `0987654321`
3. Click "Lưu"

**✅ Kết quả:**
- Alert: "Thêm bác sĩ thành công"
- Bác sĩ mới xuất hiện trong danh sách

**Test 3: Sửa thông tin bác sĩ**
1. Click nút "Sửa" ở 1 bác sĩ
2. Thay đổi số điện thoại
3. Click "Cập nhật"

**✅ Kết quả:**
- Alert: "Cập nhật thành công"
- Thông tin mới hiển thị trong danh sách

**Test 4: Tạo lịch làm việc cho bác sĩ**
1. Click "Lịch làm việc" ở 1 bác sĩ
2. Chọn ngày: Thứ 2
3. Chọn giờ: 08:00 - 17:00
4. Chọn phòng: Phòng 101
5. Click "Tạo lịch"

**✅ Kết quả:**
- Time slots được tạo (mỗi 30 phút = 1 slot)
- Hiển thị trong lịch làm việc

---

### 🏥 Test Quản Lý Bệnh Nhân
1. Sidebar → Click "Quản lý bệnh nhân"
2. URL: http://localhost:5173/admin/patients

**Test 1: Xem danh sách**
- [ ] Hiển thị bảng bệnh nhân
- [ ] Có cột: ID, Tên, Email, Số điện thoại, Ngày sinh, Giới tính

**Test 2: Xem chi tiết bệnh nhân**
1. Click "Chi tiết" ở 1 bệnh nhân
2. Kiểm tra hiển thị:
   - [ ] Thông tin cá nhân
   - [ ] Lịch sử khám bệnh
   - [ ] Đơn thuốc đã kê

---

### 📅 Test Quản Lý Lịch Hẹn
1. Sidebar → Click "Quản lý lịch hẹn"
2. URL: http://localhost:5173/admin/bookings

**Test 1: Xem danh sách**
- [ ] Hiển thị bảng lịch hẹn
- [ ] Lọc theo trạng thái: Pending, Confirmed, Completed
- [ ] Tìm kiếm theo tên/số điện thoại

**Test 2: Xác nhận lịch hẹn (nếu là Pending)**
1. Tìm lịch hẹn có status "Pending"
2. Click "Xác nhận"
3. Chọn bác sĩ (nếu chưa có)
4. Click "Lưu"

**✅ Kết quả:**
- Status chuyển sang "Confirmed"
- Email gửi đến bệnh nhân (nếu có)

**Test 3: Hủy lịch hẹn**
1. Click "Hủy" ở 1 lịch hẹn
2. Nhập lý do hủy
3. Click "Xác nhận hủy"

**✅ Kết quả:**
- Status chuyển sang "Cancelled"
- Email gửi đến bệnh nhân

---

### 💊 Test Quản Lý Thuốc
1. Sidebar → Click "Quản lý thuốc"
2. URL: http://localhost:5173/admin/drugs

**Test 1: Xem kho thuốc**
- [ ] Danh sách thuốc với số lượng tồn
- [ ] Cảnh báo thuốc sắp hết (màu đỏ)

**Test 2: Thêm thuốc mới**
1. Click "Thêm thuốc"
2. Nhập:
   - Tên: `Paracetamol`
   - Thành phần: `Acetaminophen 500mg`
   - Số lượng: `1000`
   - Đơn vị: `viên`
   - Giá: `500`
3. Click "Lưu"

**✅ Kết quả:**
- Thuốc mới xuất hiện trong danh sách
- Có thể dùng để kê đơn

**Test 3: Cập nhật số lượng**
1. Click "Sửa" ở 1 thuốc
2. Thay đổi số lượng
3. Click "Cập nhật"

---

### 📊 Test Báo Cáo
1. Sidebar → Click "Báo cáo"
2. Chọn khoảng thời gian
3. Xem:
   - [ ] Báo cáo doanh thu
   - [ ] Báo cáo lịch khám
   - [ ] Báo cáo bác sĩ
   - [ ] Xuất Excel/PDF (nếu có)

---

## 5. TEST CHỨC NĂNG BÁC SĨ

### 📊 Test Dashboard Bác Sĩ
1. Login doctor
2. URL: http://localhost:5173/doctor-portal

**Kiểm tra stat cards (5 cards):**
- [ ] Lịch hẹn hôm nay: Số lượng
- [ ] Chờ xác nhận: Số lượng
- [ ] Đã xác nhận: Số lượng
- [ ] Đã hoàn thành: Số lượng
- [ ] **⭐ Đánh giá: X.X sao + tổng reviews** ← **TÍNH NĂNG MỚI**

**Kiểm tra thống kê:**
- [ ] Tuần này: Tổng lịch hẹn, Đã hoàn thành, Tỷ lệ %
- [ ] Tháng này: Tổng lịch hẹn, Đã hoàn thành, Tỷ lệ %

**Kiểm tra sections:**
- [ ] Lịch hẹn sắp tới: 5 cuộc hẹn gần nhất
- [ ] Bệnh nhân đã khám gần đây: 5 người
- [ ] **Phản hồi từ bệnh nhân: 5 reviews gần nhất với rating ⭐** ← **TÍNH NĂNG MỚI**

---

### 📅 Test Quản Lý Lịch Hẹn (Bác Sĩ)
1. Sidebar → Click "Lịch hẹn"
2. URL: http://localhost:5173/doctor-portal/appointments

**Test 1: Xem danh sách (3 chế độ)**

**Chế độ 1: Danh sách (List) - MẶC ĐỊNH**
- [ ] Hiển thị bảng với 7 cột:
  - Mã booking
  - Ngày giờ
  - Bệnh nhân
  - Liên hệ
  - Triệu chứng
  - Trạng thái
  - Thao tác
- [ ] Ô tìm kiếm: Tìm theo tên/SĐT/mã booking
- [ ] Nút "Hôm nay": Quay về ngày hiện tại
- [ ] Lọc theo trạng thái: Tất cả, Chờ xác nhận, Đã xác nhận, Hoàn thành

**Chế độ 2: Ngày (Day)**
1. Click nút "Ngày"
2. Chọn ngày từ date picker
3. ✅ Hiển thị lịch hẹn của ngày đó theo timeline

**Chế độ 3: Tuần (Week)**
1. Click nút "Tuần"
2. ✅ Hiển thị lưới 7 ngày (Thứ 2 - Chủ nhật)
3. Mỗi ô hiển thị lịch hẹn của ngày đó

**Test 2: Tìm kiếm**
1. Nhập vào ô tìm kiếm: `Nguyễn`
2. ✅ Chỉ hiển thị bệnh nhân có tên chứa "Nguyễn"
3. Click nút X để xóa tìm kiếm

**Test 3: Xác nhận lịch hẹn**
1. Tìm lịch hẹn có trạng thái "Chờ xác nhận"
2. Click nút ✓ (checkmark)
3. ✅ Status chuyển sang "Đã xác nhận"
4. Alert: "Xác nhận thành công"

**Test 4: Từ chối lịch hẹn**
1. Click nút X (reject)
2. Nhập lý do từ chối
3. Click "Xác nhận"
4. ✅ Status chuyển sang "Đã từ chối"

**Test 5: Bắt đầu khám bệnh**
1. Tìm lịch hẹn "Đã xác nhận"
2. Click nút 🩺 (stethoscope) "Khám bệnh"
3. ✅ Chuyển đến trang khám bệnh

---

### 🩺 Test Khám Bệnh & Kê Đơn
**Quy trình quan trọng nhất!**

#### Bước 1: Vào trang khám bệnh
1. Từ danh sách lịch hẹn → Click "Khám bệnh"
2. URL: http://localhost:5173/doctor-portal/examination

**Kiểm tra hiển thị:**
- [ ] Thông tin bệnh nhân: Tên, SĐT, Email, Ngày sinh, Giới tính, Địa chỉ
- [ ] Thông tin lịch hẹn: Mã booking, Ngày giờ
- [ ] Triệu chứng (đã điền khi đặt lịch)
- [ ] Form: Chẩn đoán (bắt buộc), Kết luận, Ghi chú

#### Bước 2: Nhập chẩn đoán
1. Nhập vào ô "Chẩn đoán":
```
Viêm họng cấp, sốt nhẹ
```

2. Nhập vào ô "Kết luận":
```
Nghỉ ngơi, uống đủ nước, dùng thuốc theo đơn
```

3. Nhập "Ghi chú" (optional)

4. Click "Lưu" (chỉ lưu chẩn đoán, chưa hoàn thành)

**✅ Kết quả:**
- Alert: "Đã lưu kết quả khám"
- Thông tin được lưu vào database

#### Bước 3: Kê đơn thuốc
1. Click nút "Kê đơn thuốc"
2. Modal hiển thị

**Trong modal:**
- [ ] Dropdown chọn thuốc: Hiển thị tên + số lượng còn (VD: "Paracetamol (viên) - Còn: 1000")
- [ ] Ô nhập số lượng
- [ ] Ô nhập liều dùng (VD: "1 viên x 3 lần/ngày")
- [ ] Ô nhập hướng dẫn (VD: "Uống sau ăn")

**Test kê 1 loại thuốc:**
1. Chọn thuốc: `Paracetamol`
2. Số lượng: `30`
3. Liều dùng: `1 viên x 3 lần/ngày`
4. Hướng dẫn: `Uống sau ăn, khi sốt hoặc đau`

**Test kê nhiều loại thuốc:**
5. Click "+ Thêm thuốc"
6. Chọn thuốc: `Amoxicillin`
7. Số lượng: `21`
8. Liều dùng: `1 viên x 3 lần/ngày`
9. Hướng dẫn: `Uống trước ăn 30 phút`

**Lưu đơn thuốc:**
10. Click "Lưu đơn thuốc"

**✅ Kết quả:**
- Alert: "Kê đơn thuốc thành công"
- Modal đóng lại
- **Số lượng thuốc trong kho TỰ ĐỘNG TRỪ:**
  - Paracetamol: 1000 → 970 (-30)
  - Amoxicillin: 500 → 479 (-21)

**❌ Test trường hợp thiếu thuốc:**
1. Thử kê thuốc với số lượng > tồn kho
2. VD: Paracetamol còn 10, kê 50
3. ✅ Hiển thị lỗi: "Thuốc Paracetamol không đủ tồn kho. Có: 10, cần: 50"

#### Bước 4: Hoàn thành khám
1. Sau khi kê đơn xong
2. Click nút "Hoàn thành"
3. Xác nhận

**✅ Kết quả:**
- Status chuyển sang "Completed"
- **Tự động lưu vào lịch sử bệnh án** (tn_medical_history):
  - Chẩn đoán
  - Kết luận
  - Ghi chú
  - Liên kết đơn thuốc
  - Ngày khám
- Redirect về danh sách lịch hẹn

#### Bước 5: Kiểm tra lưu lịch sử
1. Vào trang quản lý bệnh nhân (nếu có)
2. Hoặc check database:
```sql
SELECT * FROM tn_medical_history 
WHERE patient_id = 1 
ORDER BY created_at DESC 
LIMIT 1;
```

**✅ Kết quả:**
- Record mới với thông tin vừa nhập
- prescription_id không null (nếu có kê đơn)

---

### 📅 Test Xem Lịch Làm Việc
1. Sidebar → Click "Lịch làm việc"
2. URL: http://localhost:5173/doctor-portal/schedule

**Kiểm tra:**
- [ ] Hiển thị lịch theo tuần/tháng
- [ ] Các slot đã được admin tạo
- [ ] Slot có bệnh nhân hiển thị khác màu
- [ ] Click vào slot xem chi tiết

---

### 👤 Test Cập Nhật Hồ Sơ
1. Sidebar → Click "Hồ sơ"
2. Sửa thông tin:
   - Số điện thoại
   - Địa chỉ
3. Click "Cập nhật"

**✅ Kết quả:**
- Alert: "Cập nhật thành công"
- Thông tin mới hiển thị

---

## 6. TEST CHỨC NĂNG BỆNH NHÂN

### 📅 Test Đặt Lịch Khám
**Quan trọng: Test cả Guest và Patient đã login**

#### Test 1: Guest đặt lịch (chưa login)
1. Logout (nếu đang login)
2. Vào trang chủ: http://localhost:5173
3. Click "Đặt lịch khám"
4. URL: http://localhost:5173/booking

**Form đặt lịch:**
1. Nhập thông tin:
   - Họ tên: `Nguyễn Văn Test`
   - Số điện thoại: `0987654321`
   - Email: `test@gmail.com` (optional)
   - Ngày sinh: `01/01/1990`
   - Giới tính: Chọn Nam/Nữ
   - Địa chỉ: `123 ABC, Quận 1, TP.HCM`

2. Chọn chuyên khoa: `Nội khoa`

3. Chọn bác sĩ: `BS. Nguyễn Văn An` (optional, có thể để trống)

4. Chọn dịch vụ: `Khám tổng quát`

5. Chọn ngày khám: Chọn ngày trong tương lai

6. Chọn giờ khám: Chọn từ các slot còn trống

7. Triệu chứng:
```
Đau họng, sốt nhẹ 2 ngày, ho có đờm
```

8. Click "Đặt lịch"

**✅ Kết quả:**
- Alert: "Đặt lịch thành công! Mã booking: BK..."
- Booking được tạo với status "pending"
- patient_id = NULL (vì guest)
- Email xác nhận gửi đến (nếu có email)

#### Test 2: Patient đã login đặt lịch
1. Login patient
2. Click "Đặt lịch khám"

**Kiểm tra auto-fill:**
- [ ] Họ tên tự động điền
- [ ] Số điện thoại tự động điền
- [ ] Email tự động điền
- [ ] Các thông tin cá nhân tự động điền

3. Chỉ cần chọn: Chuyên khoa, Bác sĩ, Dịch vụ, Ngày, Giờ, Triệu chứng
4. Click "Đặt lịch"

**✅ Kết quả:**
- Booking được tạo với patient_id = [ID của patient]
- Status: "pending" hoặc "waiting_doctor_confirmation"

---

### 📋 Test Xem Lịch Của Tôi
1. Login patient
2. Click "Lịch của tôi"
3. URL: http://localhost:5173/my-appointments

**Kiểm tra hiển thị:**
- [ ] Danh sách lịch hẹn của mình
- [ ] Thông tin: Ngày, Giờ, Bác sĩ, Chuyên khoa, Trạng thái
- [ ] Nút "Chi tiết" để xem thông tin đầy đủ

**Test chi tiết:**
1. Click "Chi tiết" ở 1 lịch hẹn
2. Kiểm tra:
   - [ ] Thông tin đầy đủ
   - [ ] Nút "Hủy lịch" (nếu status cho phép)
   - [ ] Nút "Đổi lịch" (nếu có)

**Test hủy lịch:**
1. Click "Hủy lịch"
2. Nhập lý do
3. Xác nhận

**✅ Kết quả:**
- Status chuyển sang "cancelled"
- Email thông báo hủy lịch

---

### 👨‍⚕️ Test Xem Danh Sách Bác Sĩ
1. Header → Click "Bác sĩ"
2. URL: http://localhost:5173/doctors

**Kiểm tra:**
- [ ] Danh sách bác sĩ với ảnh, tên, chuyên khoa
- [ ] Lọc theo chuyên khoa
- [ ] Click "Đặt lịch" → auto-fill bác sĩ đó

---

### 🏥 Test Xem Dịch Vụ
1. Header → Click "Dịch vụ"
2. URL: http://localhost:5173/services

**Kiểm tra:**
- [ ] Danh sách dịch vụ
- [ ] Giá tiền
- [ ] Mô tả

---

### 👤 Test Cập Nhật Thông Tin Cá Nhân
1. Click avatar/tên → "Hồ sơ của tôi"
2. Sửa thông tin:
   - Số điện thoại
   - Địa chỉ
3. Click "Cập nhật"

**✅ Kết quả:**
- Thông tin được lưu
- Lần đặt lịch sau tự động điền thông tin mới

---

## 7. TEST QUY TRÌNH ĐẶT LỊCH - KHÁM BỆNH (END-TO-END)

### 🎯 Quy trình hoàn chỉnh

#### Giai đoạn 1: Bệnh nhân đặt lịch
1. **Guest/Patient** đặt lịch khám
2. Chọn: Chuyên khoa, Bác sĩ (optional), Dịch vụ, Ngày, Giờ
3. Nhập triệu chứng
4. Submit → Booking được tạo (status: `pending`)

#### Giai đoạn 2: Admin xử lý
5. **Admin** login → vào "Quản lý lịch hẹn"
6. Thấy booking mới (status: `pending`)
7. Click "Xác nhận"
8. Chọn bác sĩ (nếu chưa có)
9. Xác nhận → Status: `confirmed`
10. Email gửi đến bệnh nhân

#### Giai đoạn 3: Bác sĩ xác nhận
11. **Doctor** login → vào "Lịch hẹn"
12. Thấy booking mới (status: `waiting_doctor_confirmation`)
13. Click ✓ "Xác nhận" → Status: `confirmed`

#### Giai đoạn 4: Khám bệnh
14. Đến ngày khám, **Doctor** click "Khám bệnh"
15. Nhập chẩn đoán: "Viêm họng cấp"
16. Nhập kết luận: "Nghỉ ngơi, uống thuốc"
17. Click "Lưu"

#### Giai đoạn 5: Kê đơn thuốc
18. Click "Kê đơn thuốc"
19. Chọn thuốc 1: Paracetamol - 30 viên
20. Chọn thuốc 2: Amoxicillin - 21 viên
21. Nhập liều dùng, hướng dẫn
22. Click "Lưu đơn thuốc"
23. **Hệ thống tự động trừ kho:**
    - Paracetamol: -30
    - Amoxicillin: -21

#### Giai đoạn 6: Hoàn thành
24. Click "Hoàn thành"
25. Status: `completed`
26. **Tự động lưu vào lịch sử bệnh án:**
    - Chẩn đoán
    - Kết luận
    - Đơn thuốc
    - Ngày khám

#### Giai đoạn 7: Kiểm tra kết quả
27. **Patient** login → "Lịch của tôi"
28. Thấy lịch hẹn đã hoàn thành
29. Xem chi tiết → có chẩn đoán, đơn thuốc

30. **Admin** kiểm tra:
    - Kho thuốc đã giảm
    - Lịch sử bệnh án đã có record mới

---

## 8. TEST TÍNH NĂNG NÂNG CAO

### ⭐ Test Đánh Giá Bác Sĩ (MỚI)
1. **Patient** hoàn thành khám
2. Vào "Lịch của tôi" → Click "Đánh giá"
3. Chọn số sao: 1-5 ⭐
4. Nhập nhận xét: "Bác sĩ tận tâm, khám kỹ"
5. Submit

**✅ Kết quả:**
- Review được lưu vào database
- **Doctor Dashboard** tự động cập nhật:
  - Stat card "X.X ⭐ + Y đánh giá"
  - Section "Phản hồi từ bệnh nhân" hiển thị review mới

---

### 📧 Test Email Tự Động
**Cần cấu hình .env trước:**
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**Test 1: Email đặt lịch**
1. Guest đặt lịch với email
2. Check inbox → có email xác nhận

**Test 2: Email nhắc lịch**
1. Đặt lịch cho ngày mai
2. Chờ hệ thống tự động gửi (chạy mỗi giờ)
3. Hoặc chạy thủ công:
```powershell
cd B:\tclinic_nhom3\server
node testEmailReminder.js
```

---

### 📊 Test Thống Kê Dashboard
**Admin Dashboard:**
- [ ] Tổng số liệu cập nhật real-time
- [ ] Biểu đồ (nếu có)

**Doctor Dashboard:**
- [ ] Số ca khám hôm nay/tuần/tháng
- [ ] Tỷ lệ hoàn thành
- [ ] **Rating trung bình ⭐** ← MỚI
- [ ] **Tổng số reviews** ← MỚI

---

### 🔍 Test Tìm Kiếm & Lọc
**Trong danh sách lịch hẹn (Doctor):**
1. Test tìm kiếm:
   - Nhập tên bệnh nhân
   - Nhập số điện thoại
   - Nhập mã booking
2. Test lọc:
   - Chọn status: Chờ xác nhận
   - Chọn status: Đã xác nhận
   - Chọn status: Hoàn thành
3. Test "Hôm nay":
   - Click nút → chỉ hiển thị lịch hôm nay

---

### 📱 Test Responsive (Mobile)
1. Mở DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Chọn thiết bị: iPhone SE / Samsung Galaxy

**Test trên mobile:**
- [ ] Bảng lịch hẹn chuyển thành cards
- [ ] Menu hamburger hoạt động
- [ ] Form đặt lịch dễ điền
- [ ] Buttons đủ lớn để tap

---

## 9. XỬ LÝ LỖI THƯỜNG GẶP

### ❌ Lỗi: "Cannot GET /api/..."
**Nguyên nhân:** Backend không chạy

**Giải pháp:**
```powershell
cd B:\tclinic_nhom3\server
npm start
```

---

### ❌ Lỗi: "Network Error" / "ERR_CONNECTION_REFUSED"
**Nguyên nhân:** Backend chưa chạy hoặc port 5000 bị chiếm

**Giải pháp:**
```powershell
# Kill process trên port 5000
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force

# Chạy lại backend
cd B:\tclinic_nhom3\server
npm start
```

---

### ❌ Lỗi: "Tài khoản không tồn tại"
**Giải pháp:**
```powershell
cd B:\tclinic_nhom3\server
node checkAccounts.js
```

Nếu không có tài khoản, chạy:
```powershell
node updateTestPasswords.js
```

---

### ❌ Lỗi: "Mật khẩu không đúng"
**Giải pháp:**
```powershell
cd B:\tclinic_nhom3\server
node updateTestPasswords.js
```
Tất cả password sẽ được reset về `123456`

---

### ❌ Lỗi: "Token hết hạn"
**Giải pháp:**
1. Logout
2. Clear localStorage:
```javascript
// Browser Console (F12)
localStorage.clear();
location.reload();
```
3. Login lại

---

### ❌ Lỗi: Không redirect sau login
**Giải pháp:**
1. Clear cache: Ctrl+Shift+R
2. Clear localStorage (F12 → Console):
```javascript
localStorage.clear();
```
3. Refresh: F5

---

### ❌ Lỗi: Kho thuốc không tự động trừ
**Kiểm tra:**
1. Check console (F12) xem có lỗi không
2. Check database:
```sql
SELECT * FROM tn_drugs WHERE name LIKE '%Paracetamol%';
```
3. Xem `quantity` có giảm sau khi kê đơn không

**Nguyên nhân có thể:**
- Controller không gọi `drugData.update()`
- Transaction bị rollback do lỗi
- Validation fail (số lượng > tồn kho)

---

### ❌ Lỗi: Lịch sử bệnh án không lưu
**Kiểm tra:**
```sql
SELECT * FROM tn_medical_history 
WHERE patient_id = [ID] 
ORDER BY created_at DESC;
```

**Nguyên nhân:**
- Chưa click "Hoàn thành" (chỉ lưu khi complete)
- Lỗi trong `doctorAppointmentController.completeAppointment()`

---

### ❌ Lỗi: Frontend không hiển thị dữ liệu
**Giải pháp:**
1. Check Network tab (F12 → Network)
2. Xem API call có response không
3. Check status code: 200 = OK, 401 = Unauthorized, 500 = Server Error
4. Xem response data có đúng format không

---

### ❌ Lỗi: CORS Policy
**Giải pháp:**
1. Check server.js có `cors()` middleware
2. Nếu chưa có:
```javascript
const cors = require('cors');
app.use(cors());
```
3. Restart server

---

## 📋 CHECKLIST HOÀN CHỈNH

### ✅ Chuẩn bị
- [ ] MySQL đang chạy (port 3306)
- [ ] Database `tn_clinic` đã tồn tại
- [ ] Có tài khoản test (admin, doctor, patient)
- [ ] Backend chạy (port 5000)
- [ ] Frontend chạy (port 5173)

### ✅ Test Đăng nhập
- [ ] Admin login → /admin
- [ ] Doctor login → /doctor-portal
- [ ] Patient login → /
- [ ] Admin không vào được /doctor-portal
- [ ] Doctor không vào được /admin
- [ ] Patient không vào được /admin hoặc /doctor-portal
- [ ] Guest không vào được /admin hoặc /doctor-portal

### ✅ Test Admin
- [ ] Xem dashboard
- [ ] Quản lý bác sĩ (thêm, sửa, xóa)
- [ ] Tạo lịch làm việc cho bác sĩ
- [ ] Quản lý bệnh nhân
- [ ] Xác nhận lịch hẹn
- [ ] Hủy lịch hẹn
- [ ] Quản lý thuốc (thêm, sửa, xem tồn kho)
- [ ] Xem báo cáo

### ✅ Test Doctor
- [ ] Xem dashboard (5 stat cards + reviews)
- [ ] Xem lịch hẹn (3 chế độ: List, Day, Week)
- [ ] Tìm kiếm bệnh nhân
- [ ] Xác nhận lịch hẹn
- [ ] Từ chối lịch hẹn
- [ ] Khám bệnh (nhập chẩn đoán, kết luận)
- [ ] Kê đơn thuốc (tự động trừ kho)
- [ ] Hoàn thành khám (tự động lưu lịch sử)
- [ ] Xem lịch làm việc
- [ ] Cập nhật hồ sơ

### ✅ Test Patient
- [ ] Đặt lịch khám (guest và logged in)
- [ ] Xem "Lịch của tôi"
- [ ] Xem chi tiết lịch hẹn
- [ ] Hủy lịch hẹn
- [ ] Đánh giá bác sĩ (sau khi khám xong)
- [ ] Xem danh sách bác sĩ
- [ ] Xem dịch vụ
- [ ] Cập nhật thông tin cá nhân

### ✅ Test Quy trình End-to-End
- [ ] Đặt lịch → Admin xác nhận → Doctor khám → Kê đơn → Hoàn thành → Lưu lịch sử → Tự động trừ kho

### ✅ Test Tính năng mới
- [ ] Rating/Review hiển thị trong Doctor Dashboard
- [ ] Số lượng thuốc tự động trừ khi kê đơn
- [ ] Lịch sử bệnh án tự động lưu khi hoàn thành

### ✅ Test Responsive
- [ ] Desktop (1920x1080)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

---

## 🎓 LƯU Ý QUAN TRỌNG

1. **Luôn test quy trình đầy đủ:** Đặt lịch → Xác nhận → Khám → Kê đơn → Hoàn thành
2. **Kiểm tra database sau mỗi thao tác quan trọng**
3. **Test cả trường hợp lỗi:** Thiếu thuốc, sai thông tin, token hết hạn
4. **Clear cache/localStorage khi gặp lỗi lạ**
5. **Check console (F12) và server logs để debug**

---

## 📞 HỖ TRỢ

**Các file hướng dẫn chi tiết:**
- `TEST_LOGIN_GUIDE.md` - Hướng dẫn test đăng nhập
- `AUTHENTICATION_GUIDE.md` - Chi tiết về phân quyền
- `BOOKING_LOGIC_EXPLANATION.md` - Logic đặt lịch
- `DOCTOR_SCHEDULE_COMPLETE.md` - Lịch làm việc bác sĩ
- `API_TEST_GUIDE.md` - Test API endpoints

**Tools debug:**
```powershell
# Kiểm tra tài khoản
node server/checkAccounts.js

# Reset password
node server/updateTestPasswords.js

# Tạo dữ liệu mẫu
node server/seedDoctorsWithSchedules.js
```

---

**CHÚC BẠN TEST THÀNH CÔNG! 🚀**

*Nếu gặp lỗi không có trong hướng dẫn, hãy check console và server logs để tìm thông tin chi tiết.*
