# 📋 GIẢI THÍCH LOGIC ĐẶT LỊCH - BOOKING SYSTEM

## 🎯 TỔNG QUAN LUỒNG ĐẶT LỊCH

```
User điền form
     ↓
Frontend validate dữ liệu
     ↓
POST /api/bookings/create
     ↓
Backend tạo booking
     ↓
Lưu vào DB (status = 'pending')
     ↓
Admin xác nhận + gán bác sĩ (nếu cần)
```

---

## 📝 FORM BOOKING - FRONTEND (Booking.jsx)

### **Cấu trúc formData:**

```javascript
{
  patient_name: '',           // ✅ Bắt buộc - Tên bệnh nhân
  patient_email: '',          // Email (tuỳ chọn)
  patient_phone: '',          // ✅ Bắt buộc - Số điện thoại
  patient_dob: '',            // Ngày sinh (tuỳ chọn)
  patient_gender: 'male',     // Nam/Nữ/Khác
  patient_address: '',        // Địa chỉ (tuỳ chọn)
  
  specialty_id: '',           // ✅ Bắt buộc - Chuyên khoa
  appointment_date: '',       // ✅ Bắt buộc - Ngày khám (tương lai)
  appointment_time: '',       // Tuỳ chọn - Giờ khám (admin sắp xếp nếu trống)
  doctor_id: null,            // Tuỳ chọn - Bác sĩ cụ thể (null = admin gán)
  
  symptoms: '',               // ✅ Bắt buộc - Triệu chứng/Lý do khám
  note: ''                    // Ghi chú thêm (tuỳ chọn)
}
```

---

## 🔄 QUY TRÌNH LUỒNG FORM

### **1️⃣ BƯỚC 1: Chọn CHUYÊN KHOA**

```javascript
handleChange() → formData.specialty_id = '1'

useEffect() gọi: fetchDoctorsBySpecialty(1)
  ↓
Lấy danh sách bác sĩ trong chuyên khoa đó
  ↓
Hiển thị: [BS. Nguyễn Văn An], [BS. Trần Thị Bình], ...
```

**API:** `GET /api/bookings/doctors-by-specialty?specialtyId=1`

### **2️⃣ BƯỚC 2: Chọn NGÀY KHÁM**

```javascript
handleChange() → formData.appointment_date = '2025-11-25'

useEffect() kiểm tra:
  
  Nếu chọn bác sĩ cụ thể:
    → gọi fetchAvailableSlotsForDoctor(doctor_id, date)
    → Lấy giờ rảnh của bác sĩ đó
  
  Nếu KHÔNG chọn bác sĩ:
    → gọi fetchDefaultSlots(date)
    → Hiển thị TẤT CẢ giờ làm việc: 8h-17h (trừ 12h-13h)
```

**API (nếu chọn bác sĩ):** `GET /api/bookings/available-slots?doctorId=1&date=2025-11-25`

**Kết quả:** 
```
Giờ rảnh: [08:00, 08:30, 09:00, 09:30, 10:00, ...]
Giờ bận: [11:00, 11:30] (nếu có booking khác)
```

### **3️⃣ BƯỚC 3: Chọn BÁC SĨ (TUỲ CHỌN)**

```javascript
handleSelectDoctor(doctor_id):
  
  Nếu BỎ CHỌN (selectedDoctor = null):
    → Quay lại giờ mặc định của phòng khám
    → Hiển thị tất cả slot: 8h-17h
  
  Nếu CHỌN bác sĩ (selectedDoctor = 1):
    → Lấy giờ rảnh riêng của bác sĩ đó
    → Hiển thị chỉ giờ rảnh của bác sĩ
```

**Logic:**
```
Người dùng chọn BS. Nguyễn Văn An (ID=1)
  ↓
formData.doctor_id = 1
  ↓
useEffect → fetchAvailableSlotsForDoctor(1, '2025-11-25')
  ↓
SELECT * FROM tn_booking 
  WHERE doctor_id=1 
  AND appointment_date='2025-11-25'
  AND status != 'cancelled'
  ↓
Tìm những slot KHÔNG trùng
  ↓
Hiển thị: [08:00, 08:30, 09:00, ...]
```

### **4️⃣ BƯỚC 4: Chọn GIỜ KHÁM (TUỲ CHỌN)**

```javascript
onClick slot → formData.appointment_time = '10:00'

Nếu không chọn giờ:
  → appointment_time = '' (trống)
  → Admin sẽ sắp xếp giờ phù hợp
```

### **5️⃣ BƯỚC 5: Nhập TRIỆU CHỨNG (BẮT BUỘC)**

```javascript
textarea → formData.symptoms = 'Sốt cao, đau đầu'
```

### **6️⃣ BƯỚC 6: SUBMIT FORM**

```javascript
onClick "Xác nhận đặt lịch"
  ↓
validateForm() - Kiểm tra bắt buộc:
  ✅ patient_name (tên)
  ✅ patient_phone (SĐT, 10 chữ số)
  ✅ specialty_id (chuyên khoa)
  ✅ appointment_date (ngày hôm nay trở về sau)
  ✅ symptoms (triệu chứng)
  
  Nếu lỗi → Hiển thị pesan lỗi
  Nếu hợp lệ → Gửi POST
```

---

## 📤 BACKEND XỬ LÝ - bookingController.js

### **POST /api/bookings/create**

```javascript
exports.createBooking = async (req, res) => {
  // Bước 1: Validate bắt buộc
  if (!patient_name || !patient_phone || !specialty_id || !appointment_date || !symptoms) {
    return res.status(400).json({ message: 'Thiếu thông tin' });
  }

  // Bước 2: Tạo mã booking
  const bookingCode = 'BK' + Date.now().toString().slice(-8);
  // VD: BK12345678

  // Bước 3: Lấy patient_id nếu user đã login
  const patient_id = req.user ? req.user.id : null;
  // Nếu guest → patient_id = null

  // Bước 4: Tạo booking mới
  const booking = await Booking.create({
    patient_id,           // null nếu guest
    booking_code,         // 'BK12345678'
    patient_name,
    patient_email,
    patient_phone,
    patient_gender,
    patient_dob,
    patient_address,
    specialty_id,         // ID chuyên khoa
    service_id: 1,        // Mặc định dịch vụ
    doctor_id,            // null nếu admin gán sau
    appointment_date,     // '2025-11-25'
    appointment_time,     // '10:00' hoặc ''
    position: null,
    symptoms,
    note,
    status: 'pending',    // ← STATUS BAN ĐẦU
    price: 0
  });

  // Bước 5: Return mã booking
  return res.status(201).json({
    booking: {
      booking_code: 'BK12345678',
      appointment_date: '2025-11-25',
      appointment_time: '10:00',
      status: 'pending'
    }
  });
}
```

---

## 💾 DỮ LIỆU LƯU VÀO DATABASE

### **Bảng tn_booking:**

```sql
INSERT INTO tn_booking (
  patient_id,           -- NULL hoặc patient ID
  booking_code,         -- 'BK12345678'
  patient_name,         -- 'Nguyễn Văn A'
  patient_email,        -- 'a@gmail.com' hoặc NULL
  patient_phone,        -- '0901234567'
  patient_gender,       -- 'male'
  patient_dob,          -- '1990-01-15' hoặc NULL
  patient_address,      -- 'Quận 1, TP.HCM' hoặc NULL
  specialty_id,         -- 1 (Khoa Ngoại)
  service_id,           -- 1 (Mặc định)
  doctor_id,            -- NULL (admin gán sau)
  appointment_date,     -- '2025-11-25'
  appointment_time,     -- '10:00' hoặc ''
  symptoms,             -- 'Sốt cao, đau đầu'
  note,                 -- 'Có dị ứng penicillin'
  status,               -- 'pending' (chờ admin xác nhận)
  price,                -- 0 (cập nhật sau)
  created_at,           -- 2025-11-23 10:30:45
  updated_at            -- 2025-11-23 10:30:45
)
```

---

## 🎯 TRẠNG THÁI BOOKING

### **Status Flow:**

```
pending (Chờ xác nhận)
    ↓ Admin xác nhận
confirmed (Đã xác nhận)
    ↓
completed (Hoàn thành khám)
hoặc
cancelled (Bị hủy)
```

**Khi tạo booking:** `status = 'pending'`

---

## 👨‍💼 ADMIN XỬ LÝ BOOKING

### **Admin có thể:**

1. **Xác nhận (Confirm):**
   - Kiểm tra appointment_date, appointment_time
   - Gán doctor_id nếu khách chưa chọn
   - Cập nhật status → 'confirmed'

2. **Sửa:**
   - Thay đổi ngày/giờ
   - Thay đổi bác sĩ
   - Thay đổi giá

3. **Hủy (Cancel):**
   - status → 'cancelled'

---

## 🔗 API ENDPOINTS

### **Booking API:**

```bash
# Tạo booking (Guest hoặc Patient)
POST /api/bookings/create
Body: {
  patient_name, patient_phone, specialty_id, 
  appointment_date, symptoms, doctor_id?, appointment_time?
}

# Lấy booking của patient hiện tại
GET /api/bookings/my-bookings
Headers: Authorization: Bearer {token}

# Lấy danh sách bác sĩ theo chuyên khoa
GET /api/bookings/doctors-by-specialty?specialtyId=1

# Lấy giờ rảnh của bác sĩ
GET /api/bookings/available-slots?doctorId=1&date=2025-11-25

# Hủy booking
PUT /api/bookings/{id}/cancel
```

---

## 📊 LUỒNG ĐẦY ĐỦ VÍ DỤ

### **Scenario: Guest đặt lịch không chọn bác sĩ**

```
1. Guest truy cập /booking
   
2. Chọn Chuyên khoa: "Khoa Ngoại" (ID=1)
   → Hiển thị: BS. An, BS. Bình, BS. Cường
   
3. Chọn Ngày: 2025-11-25
   → Không chọn bác sĩ
   → Hiển thị giờ mặc định: 8h-17h (trừ 12h)
   
4. Chọn Giờ: 10:00 (hoặc không chọn)
   
5. Nhập:
   - Tên: Nguyễn Văn A
   - SĐT: 0901234567
   - Triệu chứng: Sốt cao
   
6. Click "Xác nhận đặt lịch"
   
7. Backend:
   - Tạo mã: BK12345678
   - patient_id = NULL (guest)
   - doctor_id = NULL (chưa gán)
   - status = 'pending'
   
8. Database:
   INSERT INTO tn_booking (...) VALUES (
     NULL, 'BK12345678', 'Nguyễn Văn A', 
     '0901234567', NULL, 1, 1, NULL, 
     '2025-11-25', '10:00', 'Sốt cao', 'pending', 0
   )
   
9. Response: ✅ "Đặt lịch thành công! Mã: BK12345678"
   
10. Admin Dashboard:
    → Thấy booking pending
    → Click "Xác nhận"
    → Chọn BS. Nguyễn Văn An (doctor_id = 1)
    → Cập nhật status → 'confirmed'
    
11. SMS sent to 0901234567:
    "Xác nhận lịch khám - Chuyên khoa Ngoại - 
     2025-11-25 10:00 - BS. Nguyễn Văn An"
```

---

## ✨ FEATURES ĐẶC BIỆT

### **1. Guest có thể đặt lịch:**
- Không cần đăng nhập
- patient_id = NULL
- Nhập SĐT để nhận SMS xác nhận

### **2. Patient đã login:**
- Tự động ghi patient_id
- Có thể xem lịch của mình ở "Lịch của tôi"

### **3. Flexible booking:**
- Không bắt buộc chọn bác sĩ
- Không bắt buộc chọn giờ
- Admin sẽ sắp xếp phù hợp

### **4. Real-time giờ rảnh:**
- Khi chọn bác sĩ + ngày
- Tự động lọc giờ bận
- Chỉ hiển thị slot còn trống

---

## 🐛 KIỂM TRA LOGIC

### **Test Case 1: Guest đặt lịch**
```
✅ Chọn chuyên khoa
✅ Chọn ngày
✅ Không chọn bác sĩ
✅ Không chọn giờ
✅ Nhập triệu chứng
✅ Submit → Thành công
→ Status: pending
→ doctor_id: NULL
```

### **Test Case 2: Patient chọn bác sĩ**
```
✅ Chọn chuyên khoa
✅ Chọn bác sĩ
✅ Chọn ngày
✅ Chọn giờ rảnh của bác sĩ
✅ Nhập triệu chứng
✅ Submit → Thành công
→ Status: pending
→ doctor_id: 1 (BS. Nguyễn Văn An)
```

### **Test Case 3: Admin xác nhận**
```
Admin Dashboard → Lịch hẹn
→ Thấy booking pending
→ Click "Xác nhận"
→ Nếu doctor_id NULL → Chọn bác sĩ
→ Status: pending → confirmed
→ Gửi SMS xác nhận
```

---

**HỆ THỐNG BOOKING HOẠT ĐỘNG HOÀN CHỈNH!** ✨
