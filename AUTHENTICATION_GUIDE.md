# 🔐 HƯỚNG DẪN HỆ THỐNG ĐĂNG NHẬP & PHÂN QUYỀN

## ✅ ĐÃ SỬA LỖI

### Vấn đề trước đây:
- ❌ Đăng nhập xong hiện đúng role nhưng ở sai trang
- ❌ Admin vào được trang customer, bấm "Quản trị" mới vào admin
- ❌ Doctor có thể vào trang admin/customer
- ❌ Không có bảo vệ route đúng cách

### Đã sửa:
- ✅ Thêm `ProtectedRoute` component bảo vệ tất cả routes
- ✅ Auto redirect đúng role ngay sau login
- ✅ Không thể truy cập sai trang của role khác
- ✅ Xóa nút "Quản trị" không cần thiết
- ✅ Logic phân quyền rõ ràng

---

## 🎯 3 ROLE NGƯỜI DÙNG

### 1️⃣ ADMIN (Quản trị viên)
**Quyền hạn:**
- ✅ Quản lý toàn bộ hệ thống
- ✅ Quản lý bác sĩ, bệnh nhân
- ✅ Quản lý lịch hẹn, phòng khám, dịch vụ
- ✅ Xem báo cáo, thống kê
- ✅ Quản lý kho thuốc, chuyên khoa

**Đăng nhập:**
- URL: `/login`
- Tài khoản: Admin trong database `tn_admins`
- Sau login → Tự động redirect về `/admin`

**Không thể:**
- ❌ Vào trang customer (`/`)
- ❌ Vào trang doctor (`/doctor`)
- ❌ Đặt lịch khám như bệnh nhân

---

### 2️⃣ DOCTOR (Bác sĩ)
**Quyền hạn:**
- ✅ Xem lịch làm việc (schedule)
- ✅ Xem danh sách lịch hẹn (appointments)
- ✅ Quản lý bệnh nhân của mình
- ✅ Kê đơn thuốc, ghi chú khám bệnh
- ✅ Cập nhật thông tin cá nhân

**Đăng nhập:**
- URL: `/login`
- Tài khoản: Doctor trong database `tn_doctors`
- Sau login → Tự động redirect về `/doctor`

**Không thể:**
- ❌ Vào trang admin (`/admin`)
- ❌ Vào trang customer (`/`) - trừ khi logout
- ❌ Quản lý bác sĩ khác, xem toàn bộ hệ thống

---

### 3️⃣ PATIENT (Bệnh nhân / Khách hàng)
**Quyền hạn:**
- ✅ Xem trang chủ, dịch vụ
- ✅ Xem danh sách bác sĩ
- ✅ Đặt lịch khám
- ✅ Xem lịch hẹn của mình
- ✅ Cập nhật thông tin cá nhân
- ✅ Liên hệ, xem giới thiệu

**Đăng nhập:**
- URL: `/login`
- Tài khoản: Patient trong database `tn_patients`
- Sau login → Ở lại trang `/` (customer)

**Có thể đăng ký:**
- URL: `/register`
- Chỉ patient mới có thể tự đăng ký
- Admin/Doctor phải được cấp tài khoản bởi Admin

**Không thể:**
- ❌ Vào trang admin (`/admin`)
- ❌ Vào trang doctor (`/doctor`)
- ❌ Xem lịch của bệnh nhân khác

---

## 🔄 LUỒNG ĐĂNG NHẬP

### Bước 1: Nhập thông tin
```
URL: http://localhost:5173/login

Form:
- Email / Username
- Password
```

### Bước 2: Server xác thực
```javascript
// Server kiểm tra theo thứ tự:
1. Tìm trong tn_admins (username hoặc email)
2. Tìm trong tn_doctors (email)
3. Tìm trong tn_patients (email)

// Nếu tìm thấy → verify password → tạo token
```

### Bước 3: Client nhận response
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "email": "admin@tclinic.com",
    "role": "admin"  // ← QUAN TRỌNG
  }
}
```

### Bước 4: Lưu vào localStorage
```javascript
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));
```

### Bước 5: Auto redirect theo role
```javascript
if (role === 'admin')   → navigate('/admin')
if (role === 'doctor')  → navigate('/doctor')
if (role === 'patient') → navigate('/')
```

---

## 🛡️ BẢO VỆ ROUTE (ProtectedRoute)

### Cách hoạt động:

```jsx
<Route path="/admin" element={
    <ProtectedRoute requiredRole="admin">
        <AdminLayout />
    </ProtectedRoute>
}>
```

### Logic kiểm tra:

1. **Không có token?**
   - → Redirect to `/login`

2. **Có token nhưng role không khớp?**
   - Admin vào `/doctor` → Redirect `/admin`
   - Doctor vào `/admin` → Redirect `/doctor`
   - Patient vào `/admin` → Redirect `/`

3. **Role khớp?**
   - ✅ Cho phép truy cập

### Ví dụ:

| User Role | Truy cập URL | Kết quả |
|-----------|--------------|---------|
| Admin | `/admin` | ✅ Được phép |
| Admin | `/doctor` | ❌ Redirect `/admin` |
| Admin | `/` | ❌ Redirect `/admin` |
| Doctor | `/doctor` | ✅ Được phép |
| Doctor | `/admin` | ❌ Redirect `/doctor` |
| Patient | `/` | ✅ Được phép |
| Patient | `/admin` | ❌ Redirect `/` |
| Guest | `/` | ✅ Được phép |
| Guest | `/admin` | ❌ Redirect `/login` |

---

## 🔑 TOKEN VÀ JWT

### Cấu trúc Token:
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "doctor",
  "doctor_id": 1,
  "iat": 1700000000,
  "exp": 1700604800
}
```

### Thời gian hết hạn:
- **7 ngày** (604800 giây)
- Sau 7 ngày phải đăng nhập lại

### Gửi token trong API:
```javascript
headers: {
    'Authorization': `Bearer ${token}`
}
```

---

## 🧪 TEST HỆ THỐNG

### Test 1: Admin login
```
1. Login với admin account
2. Kiểm tra redirect về /admin
3. Thử vào /doctor → Nên redirect về /admin
4. Thử vào / → Nên redirect về /admin
```

### Test 2: Doctor login
```
1. Login với doctor account
2. Kiểm tra redirect về /doctor
3. Thử vào /admin → Nên redirect về /doctor
4. Thử vào / → Nên redirect về /doctor
```

### Test 3: Patient login
```
1. Login với patient account
2. Kiểm tra ở lại trang /
3. Thử vào /admin → Nên redirect về /
4. Thử vào /doctor → Nên redirect về /
```

### Test 4: Guest (chưa login)
```
1. Không login
2. Có thể vào / (customer pages)
3. Thử vào /admin → Redirect /login
4. Thử vào /doctor → Redirect /login
```

---

## 📊 DATABASE ROLES

### Bảng tn_admins:
```sql
SELECT id, username, email, role FROM tn_admins;
-- role = 'admin'
```

### Bảng tn_doctors:
```sql
SELECT id, email, full_name FROM tn_doctors;
-- role = 'doctor' (không lưu trong DB, backend tự set)
```

### Bảng tn_patients:
```sql
SELECT id, email, full_name FROM tn_patients;
-- role = 'patient' (không lưu trong DB, backend tự set)
```

---

## ⚙️ CẤU HÌNH

### Backend - authRoutes.js:
```javascript
// ✅ Đã cấu hình:
- POST /api/auth/login  → Xử lý login 3 role
- POST /api/auth/register → Chỉ cho patient
- GET /api/auth/verify → Verify token
```

### Frontend - App.jsx:
```jsx
// ✅ Đã cấu hình:
- Customer routes: requiredRole="any"
- Doctor routes: requiredRole="doctor"
- Admin routes: requiredRole="admin"
```

### Middleware - authMiddleware.js:
```javascript
// ✅ Đã có:
- verifyToken()
- isAdmin()
- isDoctor()
- isPatient()
```

---

## 🚨 LƯU Ý QUAN TRỌNG

### ✅ ĐÃ SỬA:
1. Auto redirect đúng role sau login
2. Không cho phép truy cập sai trang
3. Layout không hiện nút không cần thiết
4. Logic phân quyền trong ProtectedRoute

### ⚠️ CẦN BIẾT:
1. **Logout:** Xóa token + user trong localStorage
2. **Token hết hạn:** API trả 401 → Tự động logout
3. **F5 refresh:** ProtectedRoute kiểm tra lại role
4. **Copy URL:** Vẫn bị redirect nếu sai role

### 🔐 BẢO MẬT:
- ✅ Token được hash bằng JWT
- ✅ Password được hash bằng bcrypt
- ✅ Middleware kiểm tra token mỗi request
- ✅ Role được verify cả frontend và backend

---

## 📞 HỖ TRỢ

Nếu vẫn gặp lỗi:
1. Clear localStorage: `localStorage.clear()`
2. Clear cache: Ctrl+Shift+R
3. Check console: F12 → Console
4. Check network: F12 → Network → /api/auth/login

---

**Hệ thống đã hoàn thiện! Đăng nhập bây giờ sẽ tự động về đúng trang theo role.** 🎉
