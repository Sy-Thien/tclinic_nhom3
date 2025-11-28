# ✅ HƯỚNG DẪN TEST HỆ THỐNG ĐĂNG NHẬP

## 🎯 ĐÃ SỬA XONG

Hệ thống đăng nhập đã được sửa hoàn toàn:
- ✅ Auto redirect đúng role
- ✅ Không cho phép truy cập sai trang
- ✅ Phân quyền rõ ràng
- ✅ Password test đã được cập nhật

---

## 🔑 TÀI KHOẢN TEST

### 1️⃣ ADMIN
```
URL Login: http://localhost:5173/login

Username: admin
Password: 123456

→ Sau login tự động về: /admin
```

**Quyền hạn:**
- ✅ Xem Dashboard admin
- ✅ Quản lý bác sĩ, bệnh nhân
- ✅ Quản lý lịch hẹn, phòng, dịch vụ
- ✅ Quản lý thuốc, chuyên khoa
- ✅ Xem báo cáo

**Không thể:**
- ❌ Vào `/doctor` (sẽ redirect về `/admin`)
- ❌ Vào `/` (sẽ redirect về `/admin`)

---

### 2️⃣ DOCTOR (Bác Sĩ)
```
URL Login: http://localhost:5173/login

Email: doctor1@clinic.com
Password: 123456

→ Sau login tự động về: /doctor
```

**Thông tin:**
- Tên: BS. Nguyễn Văn An
- Chuyên khoa: ID 1
- Email: doctor1@clinic.com

**Quyền hạn:**
- ✅ Xem Dashboard bác sĩ
- ✅ Xem lịch khám (Appointments)
- ✅ Quản lý bệnh nhân của mình
- ✅ Xem lịch làm việc (Schedule View)
- ✅ Kê đơn thuốc
- ✅ Cập nhật thông tin cá nhân

**Không thể:**
- ❌ Vào `/admin` (sẽ redirect về `/doctor`)
- ❌ Vào `/` (sẽ redirect về `/doctor`)

---

### 3️⃣ PATIENT (Bệnh Nhân)
```
URL Login: http://localhost:5173/login

Email: patient1@gmail.com
Password: 123456

→ Sau login ở lại: / (trang chủ)
```

**Thông tin:**
- Tên: Nguyễn Văn A
- Phone: 0912345678
- Email: patient1@gmail.com

**Quyền hạn:**
- ✅ Xem trang chủ
- ✅ Đặt lịch khám
- ✅ Xem lịch hẹn của mình
- ✅ Xem danh sách bác sĩ
- ✅ Xem dịch vụ
- ✅ Cập nhật thông tin cá nhân

**Không thể:**
- ❌ Vào `/admin` (sẽ redirect về `/`)
- ❌ Vào `/doctor` (sẽ redirect về `/`)

---

## 🧪 TEST CASES

### Test Case 1: Admin Login
```
1. Mở: http://localhost:5173/login
2. Nhập:
   - Username: admin
   - Password: 123456
3. Click "Đăng nhập"
4. ✅ Kết quả mong đợi:
   - Redirect tự động về /admin
   - Hiển thị "Admin Dashboard"
   - Sidebar có menu quản trị
```

### Test Case 2: Admin không thể vào trang khác
```
1. Đăng nhập admin (test case 1)
2. Gõ URL: http://localhost:5173/doctor
3. ✅ Kết quả mong đợi:
   - Tự động redirect về /admin
   - KHÔNG thấy trang doctor

4. Gõ URL: http://localhost:5173/
5. ✅ Kết quả mong đợi:
   - Tự động redirect về /admin
   - KHÔNG thấy trang customer
```

### Test Case 3: Doctor Login
```
1. Logout admin (nếu đang login)
2. Mở: http://localhost:5173/login
3. Nhập:
   - Email: doctor1@clinic.com
   - Password: 123456
4. Click "Đăng nhập"
5. ✅ Kết quả mong đợi:
   - Redirect tự động về /doctor
   - Hiển thị "Bác Sĩ" dashboard
   - Sidebar có menu bác sĩ
```

### Test Case 4: Doctor không thể vào trang khác
```
1. Đăng nhập doctor (test case 3)
2. Gõ URL: http://localhost:5173/admin
3. ✅ Kết quả mong đợi:
   - Tự động redirect về /doctor
   - KHÔNG thấy trang admin

4. Gõ URL: http://localhost:5173/
5. ✅ Kết quả mong đợi:
   - Tự động redirect về /doctor
   - KHÔNG thấy trang customer
```

### Test Case 5: Patient Login
```
1. Logout doctor (nếu đang login)
2. Mở: http://localhost:5173/login
3. Nhập:
   - Email: patient1@gmail.com
   - Password: 123456
4. Click "Đăng nhập"
5. ✅ Kết quả mong đợi:
   - Redirect về / (trang chủ)
   - Header hiển thị tên "Nguyễn Văn A"
   - Có nút "Đặt lịch", "Lịch của tôi"
```

### Test Case 6: Patient không thể vào trang admin/doctor
```
1. Đăng nhập patient (test case 5)
2. Gõ URL: http://localhost:5173/admin
3. ✅ Kết quả mong đợi:
   - Tự động redirect về /
   - KHÔNG thấy trang admin

4. Gõ URL: http://localhost:5173/doctor
5. ✅ Kết quả mong đợi:
   - Tự động redirect về /
   - KHÔNG thấy trang doctor
```

### Test Case 7: Guest không thể vào admin/doctor
```
1. Logout tất cả
2. Gõ URL: http://localhost:5173/admin
3. ✅ Kết quả mong đợi:
   - Redirect về /login
   - Hiển thị form đăng nhập

4. Gõ URL: http://localhost:5173/doctor
5. ✅ Kết quả mong đợi:
   - Redirect về /login
   - Hiển thị form đăng nhập
```

### Test Case 8: Guest có thể xem trang customer
```
1. Logout tất cả
2. Mở: http://localhost:5173/
3. ✅ Kết quả mong đợi:
   - Hiển thị trang chủ
   - Có nút "Đăng nhập"
   - Có thể xem: Bác sĩ, Dịch vụ, Giới thiệu
```

### Test Case 9: F5 Refresh
```
1. Đăng nhập admin
2. Ấn F5 hoặc Ctrl+R
3. ✅ Kết quả mong đợi:
   - Vẫn ở trang /admin
   - Không bị logout
   - Token vẫn hợp lệ
```

### Test Case 10: Copy URL
```
1. Đăng nhập doctor
2. Copy URL: http://localhost:5173/admin
3. Mở tab mới, paste URL
4. ✅ Kết quả mong đợi:
   - Redirect về /doctor
   - KHÔNG thấy trang admin
```

---

## 🚨 XỬ LÝ LỖI

### Lỗi: "Tài khoản không tồn tại"
```
Nguyên nhân:
- Username/Email sai
- Account không có trong database

Giải pháp:
1. Check lại username/email (phân biệt hoa thường)
2. Chạy: node server/checkAccounts.js
3. Xem danh sách tài khoản có sẵn
```

### Lỗi: "Mật khẩu không đúng"
```
Nguyên nhân:
- Password sai
- Password chưa được cập nhật

Giải pháp:
1. Thử password: 123456
2. Nếu không được, chạy: node server/updateTestPasswords.js
3. Tất cả password sẽ được reset về "123456"
```

### Lỗi: Đăng nhập xong vẫn ở trang customer
```
Nguyên nhân:
- ProtectedRoute chưa được áp dụng
- Cache cũ trong browser

Giải pháp:
1. Clear cache: Ctrl+Shift+R
2. Clear localStorage: F12 → Console → localStorage.clear()
3. Refresh lại trang
```

### Lỗi: Token hết hạn
```
Nguyên nhân:
- Token > 7 ngày
- Token không hợp lệ

Giải pháp:
1. Logout và login lại
2. Token mới sẽ có hiệu lực 7 ngày
```

---

## 📊 KIỂM TRA CONSOLE

### Console logs khi login thành công:
```javascript
// Client (Browser Console - F12)
✅ Login success: { token: "...", user: {...} }
🔐 ProtectedRoute: { path: "/admin", userRole: "admin", requiredRole: "admin" }
✅ Access granted

// Server (Terminal)
✅ User found: admin@clinic.com Type: admin
✅ Login successful
```

### Console logs khi sai role:
```javascript
// Client (Browser Console - F12)
🔐 ProtectedRoute: { path: "/admin", userRole: "doctor", requiredRole: "admin" }
❌ Wrong role: doctor !== admin
↪️ Redirect to /doctor
```

---

## 🎯 CHECKLIST HOÀN CHỈNH

Sau khi test, tick vào các mục đã kiểm tra:

- [ ] Admin login → /admin ✅
- [ ] Admin không vào được /doctor ✅
- [ ] Admin không vào được / ✅
- [ ] Doctor login → /doctor ✅
- [ ] Doctor không vào được /admin ✅
- [ ] Doctor không vào được / ✅
- [ ] Patient login → / ✅
- [ ] Patient không vào được /admin ✅
- [ ] Patient không vào được /doctor ✅
- [ ] Guest xem được / ✅
- [ ] Guest không vào được /admin ✅
- [ ] Guest không vào được /doctor ✅
- [ ] F5 refresh vẫn giữ nguyên role ✅
- [ ] Copy URL vẫn bị redirect đúng ✅
- [ ] Logout xóa token và redirect /login ✅

---

## 🔧 TOOLS HỖ TRỢ

### Kiểm tra tài khoản:
```bash
node server/checkAccounts.js
```

### Reset password test:
```bash
node server/updateTestPasswords.js
```

### Kiểm tra token:
```javascript
// Browser Console (F12)
console.log(localStorage.getItem('token'));
console.log(JSON.parse(localStorage.getItem('user')));
```

### Clear localStorage:
```javascript
// Browser Console (F12)
localStorage.clear();
location.reload();
```

---

## 📞 LIÊN HỆ

Nếu vẫn gặp lỗi:
1. Check console: F12 → Console
2. Check network: F12 → Network → /api/auth/login
3. Check server logs: Terminal chạy server
4. Đọc AUTHENTICATION_GUIDE.md để hiểu rõ hơn

---

**HỆ THỐNG ĐÃ HOÀN CHỈNH! BẮT ĐẦU TEST NGAY! 🚀**
