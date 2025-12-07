# 🔴 BÁO CÁO LỖ HỔNG RÀNG BUỘC - ĐẶT LỊCH

**Ngày phát hiện**: 7/12/2025  
**Mức độ nghiêm trọng**: 🔴 CAO  
**Trạng thái**: Cần sửa ngay

---

## 🚨 CÁC LỖ HỔNG PHÁT HIỆN

### 1. ❌ TRANG DỊCH VỤ (ServiceDetail.jsx) - THIẾU VALIDATION HOÀN TOÀN

**File**: `client/src/pages/public/ServiceDetail.jsx`

#### Vấn đề 1.1: Navigate trực tiếp không kiểm tra
```jsx
// Line 250-256: ❌ CHỈ REDIRECT, KHÔNG VALIDATION!
<button onClick={() => {
    const params = new URLSearchParams();
    params.set('doctor', doctor.id);
    params.set('specialty', service.specialty_id);
    params.set('service', service.id);
    params.set('doctor_name', doctor.full_name);
    navigate(`/booking?${params.toString()}`);
}}>
    📅 Đặt lịch với bác sĩ này
</button>
```

**Hậu quả**:
- ❌ KHÔNG kiểm tra ngày (có thể là ngày quá khứ nếu có trong URL)
- ❌ KHÔNG kiểm tra giờ (có thể là giờ đã qua)
- ❌ KHÔNG kiểm tra doctor có lịch làm việc không
- ❌ KHÔNG kiểm tra service có active không
- ❌ User có thể thêm params độc hại vào URL

#### Vấn đề 1.2: Modal booking trong ServiceDetail
```jsx
// Line 95-130: Modal booking CÓ validation nhưng KHÔNG SỬ DỤNG!
const handleBooking = async (e) => {
    e.preventDefault();
    
    // ✅ CÓ kiểm tra slot
    if (!selectedSlot) {
        alert('Vui lòng chọn khung giờ');
        return;
    }
    
    // ❌ NHƯNG không kiểm tra:
    // - Ngày quá khứ
    // - Giờ đã qua
    // - Slot đã hết chỗ
    // - Conflict với booking khác
}
```

**Vấn đề**: Modal này có validation tốt hơn nhưng hiện không được dùng vì đã chuyển sang navigate direct!

---

### 2. ❌ TRANG BÁC SĨ (DoctorDetail.jsx) - THIẾU VALIDATION

**File**: `client/src/pages/public/DoctorDetail.jsx`

#### Vấn đề 2.1: Navigate với date/time params không validate
```jsx
// Line 86-97: ❌ TRUYỀN NGÀY GIỜ TRỰC TIẾP KHÔNG KIỂM TRA!
const handleBooking = (slot = null) => {
    const params = new URLSearchParams();
    params.set('doctor', doctor.id);
    params.set('doctor_name', doctor.full_name);
    
    // ❌ NGUY HIỂM: Truyền date/time từ slot KHÔNG KIỂM TRA!
    if (slot && selectedDate) {
        params.set('date', selectedDate);  // ← Có thể là ngày quá khứ!
        params.set('time', slot.start_time?.substring(0, 5)); // ← Có thể là giờ đã qua!
    }
    
    navigate(`/booking?${params.toString()}`);
};
```

**Hậu quả**:
- ❌ User chọn ngày trong quá khứ → Navigate vẫn OK
- ❌ User chọn giờ đã qua (hôm nay) → Navigate vẫn OK
- ❌ Slot đã hết chỗ → Vẫn cho navigate
- ❌ Backend sẽ reject nhưng UX rất tệ (user đã điền form rồi mới báo lỗi)

**File**: `client/src/pages/customer/DoctorDetail.jsx`

#### Vấn đề 2.2: Trang customer cũng có lỗi tương tự
```jsx
// Line 37-44: ❌ KHÔNG KIỂM TRA GÌ CẢ!
const handleBooking = () => {
    // ❌ Chỉ kiểm tra login, không kiểm tra doctor availability
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để đặt lịch');
        navigate('/login');
        return;
    }
    
    // ❌ Không kiểm tra:
    // - Doctor có active không?
    // - Doctor có lịch làm việc không?
    // - Specialty có tồn tại không?
    
    navigate(`/booking?${params.toString()}`);
};
```

---

### 3. ⚠️ TRANG BOOKING (Booking.jsx) - CÓ VALIDATION NHƯNG CHƯA ĐỦ

**File**: `client/src/pages/customer/Booking.jsx`

#### Vấn đề 3.1: Input date chưa có min attribute
```jsx
// Line 804: ✅ CÓ min={today} - TỐT!
<input
    type="date"
    name="appointment_date"
    value={formData.appointment_date}
    onChange={handleChange}
    min={today}  // ✅ Ngăn chọn quá khứ trong UI
    className={errors.appointment_date ? styles.inputError : ''}
/>
```

**NHƯNG**:
```jsx
// ❌ Nếu params từ URL có date quá khứ?
// URL: /booking?date=2025-12-01 (quá khứ)
// → formData.appointment_date = '2025-12-01'
// → Input hiển thị ngày quá khứ vì đọc từ URL!
```

#### Vấn đề 3.2: Không validate params từ URL
```jsx
// Line 13-28: ❌ LẤY PARAMS TRỰC TIẾP, KHÔNG VALIDATE!
const [formData, setFormData] = useState({
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    patient_dob: '',
    patient_gender: 'male',
    patient_address: '',
    specialty_id: searchParams.get('specialty') || '',  // ❌ Không kiểm tra specialty tồn tại
    appointment_date: searchParams.get('date') || '',   // ❌ Có thể là ngày quá khứ!
    appointment_time: searchParams.get('time') || '',   // ❌ Có thể là giờ đã qua!
    doctor_id: doctorIdFromUrl ? Number(doctorIdFromUrl) : null,  // ❌ Không kiểm tra doctor tồn tại
    service_id: serviceIdFromUrl ? Number(serviceIdFromUrl) : null,  // ❌ Không kiểm tra service tồn tại
    symptoms: searchParams.get('symptoms') || '',
    note: ''
});
```

#### Vấn đề 3.3: Validation chỉ chạy khi submit
```jsx
// Line 458-510: Validation rất tốt NHƯNG chỉ chạy khi submit!
const validateForm = () => {
    // ... kiểm tra ngày quá khứ
    if (selectedDate < today) {
        newErrors.appointment_date = 'Không thể chọn ngày trong quá khứ';
    }
    // ...
};

// ❌ VẤN ĐỀ: User đã điền hết form rồi mới biết lỗi!
// Nên validate ngay khi load params từ URL
```

---

### 4. ❌ BACKEND - THIẾU VALIDATION CHO MỘT SỐ TRƯỜNG HỢP

**File**: `server/controllers/bookingController.js`

#### Vấn đề 4.1: Kiểm tra ngày quá khứ TỐT nhưng thiếu kiểm tra khác
```javascript
// Line 30-34: ✅ CÓ kiểm tra ngày quá khứ - TỐT!
const today = new Date();
today.setHours(0, 0, 0, 0);
const selectedDate = new Date(appointment_date + 'T00:00:00');
if (selectedDate < today) {
    return res.status(400).json({ message: 'Không thể đặt lịch cho ngày trong quá khứ' });
}
```

#### Vấn đề 4.2: THIẾU kiểm tra giờ đã qua
```javascript
// ❌ KHÔNG CÓ: Kiểm tra giờ đã qua nếu là hôm nay!

// Cần thêm:
if (appointment_time && selectedDate.toDateString() === today.toDateString()) {
    const [hours, minutes] = appointment_time.split(':').map(Number);
    const appointmentTimeInMinutes = hours * 60 + minutes;
    const currentTimeInMinutes = new Date().getHours() * 60 + new Date().getMinutes() + 30;
    
    if (appointmentTimeInMinutes < currentTimeInMinutes) {
        return res.status(400).json({ 
            message: 'Không thể đặt lịch cho giờ đã qua. Vui lòng chọn giờ khác.' 
        });
    }
}
```

#### Vấn đề 4.3: THIẾU kiểm tra doctor/service/specialty tồn tại
```javascript
// ❌ KHÔNG KIỂM TRA:
// - specialty_id có tồn tại trong DB không?
// - service_id có tồn tại và active không?
// - doctor_id có tồn tại và active không?
// - doctor có thuộc specialty đó không?

// Cần thêm:
if (specialty_id) {
    const specialty = await Specialty.findByPk(specialty_id);
    if (!specialty) {
        return res.status(404).json({ message: 'Chuyên khoa không tồn tại' });
    }
}

if (service_id) {
    const service = await Service.findByPk(service_id);
    if (!service) {
        return res.status(404).json({ message: 'Dịch vụ không tồn tại' });
    }
    if (service.specialty_id !== specialty_id) {
        return res.status(400).json({ message: 'Dịch vụ không thuộc chuyên khoa này' });
    }
}

if (doctor_id) {
    const doctor = await Doctor.findByPk(doctor_id);
    if (!doctor) {
        return res.status(404).json({ message: 'Bác sĩ không tồn tại' });
    }
    if (!doctor.is_active) {
        return res.status(400).json({ message: 'Bác sĩ hiện không khả dụng' });
    }
    if (doctor.specialty_id !== specialty_id) {
        return res.status(400).json({ message: 'Bác sĩ không thuộc chuyên khoa này' });
    }
}
```

---

## 🎯 TÓM TẮT CÁC LỖ HỔNG

### Frontend
| Trang | Vấn đề | Mức độ |
|-------|--------|--------|
| ServiceDetail.jsx | Navigate không validate date/time | 🔴 Cao |
| DoctorDetail.jsx (public) | Truyền params không kiểm tra | 🔴 Cao |
| DoctorDetail.jsx (customer) | Không kiểm tra doctor availability | 🟡 Trung bình |
| Booking.jsx | Không validate params từ URL | 🟠 Cao |
| Booking.jsx | Validation chỉ chạy khi submit | 🟡 Trung bình |

### Backend
| Controller | Vấn đề | Mức độ |
|------------|--------|--------|
| bookingController.js | Thiếu kiểm tra giờ đã qua | 🔴 Cao |
| bookingController.js | Thiếu validate specialty/service/doctor tồn tại | 🟠 Cao |
| bookingController.js | Thiếu kiểm tra doctor thuộc specialty | 🟡 Trung bình |
| bookingController.js | Thiếu kiểm tra service thuộc specialty | 🟡 Trung bình |

---

## 🧪 TEST CASES PHÁT HIỆN LỖI

### Test 1: Đặt từ ServiceDetail với ngày quá khứ
```
Bước:
1. Vào /services/123
2. Chọn bác sĩ
3. Sửa URL: /booking?date=2025-12-01&doctor=5 (ngày quá khứ)
4. Form hiển thị ngày quá khứ
5. Submit → ✅ Backend reject NHƯNG UX tệ (đã điền form)

Kỳ vọng:
- Phải cảnh báo ngay khi load page
- Hoặc không cho chọn ngày quá khứ từ đầu
```

### Test 2: Đặt từ DoctorDetail với giờ đã qua
```
Bước:
1. Hôm nay 14:30
2. Vào /doctors/5
3. Chọn slot 14:00 (đã qua)
4. Navigate /booking?date=2025-12-07&time=14:00
5. Form hiển thị giờ 14:00
6. Submit → ❌ Backend CHƯA REJECT (thiếu validation!)

Kỳ vọng:
- Backend phải reject với message rõ ràng
- Frontend nên disable slot đã qua
```

### Test 3: Doctor không thuộc specialty
```
Bước:
1. Sửa URL: /booking?doctor=5&specialty=99 (specialty sai)
2. Submit
3. Backend không kiểm tra → ❌ TẠO BOOKING LỖI!

Kỳ vọng:
- Backend reject: "Bác sĩ không thuộc chuyên khoa này"
```

### Test 4: Service không tồn tại
```
Bước:
1. Sửa URL: /booking?service=9999 (không tồn tại)
2. Submit
3. Backend không kiểm tra → ❌ LỖI hoặc TẠO BOOKING VỚI SERVICE NULL

Kỳ vọng:
- Backend reject: "Dịch vụ không tồn tại"
```

---

## 📋 CHECKLIST CẦN SỬA

### 🔴 Ưu tiên 1 (Critical)
- [ ] **Backend**: Thêm kiểm tra giờ đã qua (hôm nay)
- [ ] **Backend**: Validate specialty/service/doctor tồn tại
- [ ] **Frontend Booking.jsx**: Validate params từ URL ngay khi load
- [ ] **Frontend ServiceDetail**: Kiểm tra ngày/giờ trước khi navigate
- [ ] **Frontend DoctorDetail**: Kiểm tra ngày/giờ trước khi navigate

### 🟠 Ưu tiên 2 (High)
- [ ] **Backend**: Kiểm tra doctor thuộc specialty
- [ ] **Backend**: Kiểm tra service thuộc specialty
- [ ] **Backend**: Kiểm tra doctor.is_active
- [ ] **Frontend**: Hiển thị warning ngay nếu params không hợp lệ
- [ ] **Frontend**: Disable submit nếu có lỗi validation

### 🟡 Ưu tiên 3 (Medium)
- [ ] **Frontend**: Real-time validation khi user nhập
- [ ] **Frontend**: Debounce validation (300ms)
- [ ] **Backend**: Log các attempt booking với params lỗi
- [ ] **Backend**: Rate limiting cho API booking

---

## 💡 ĐỀ XUẤT GIẢI PHÁP

### Giải pháp 1: Validate params ngay khi load (Frontend)
```javascript
// Booking.jsx - Thêm useEffect validate params
useEffect(() => {
    const validateURLParams = () => {
        const errors = {};
        
        // Validate date từ URL
        const dateParam = searchParams.get('date');
        if (dateParam) {
            const selectedDate = new Date(dateParam + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                errors.date = 'Ngày trong URL đã qua. Đã reset về hôm nay.';
                searchParams.delete('date');
                navigate({ search: searchParams.toString() }, { replace: true });
            }
        }
        
        // Validate time từ URL
        const timeParam = searchParams.get('time');
        if (timeParam && dateParam) {
            const selectedDate = new Date(dateParam + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate.toDateString() === today.toDateString()) {
                const [hours, minutes] = timeParam.split(':').map(Number);
                const slotTimeInMinutes = hours * 60 + minutes;
                const currentTimeInMinutes = new Date().getHours() * 60 + new Date().getMinutes() + 30;
                
                if (slotTimeInMinutes < currentTimeInMinutes) {
                    errors.time = 'Giờ trong URL đã qua. Vui lòng chọn lại.';
                    searchParams.delete('time');
                    navigate({ search: searchParams.toString() }, { replace: true });
                }
            }
        }
        
        if (Object.keys(errors).length > 0) {
            toast.warning('Một số thông tin từ URL không hợp lệ và đã được reset.');
        }
    };
    
    validateURLParams();
}, [searchParams]);
```

### Giải pháp 2: Backend validation đầy đủ
```javascript
// bookingController.js - Enhanced validation
exports.createBooking = async (req, res) => {
    try {
        const {
            patient_name, patient_phone, specialty_id, service_id, doctor_id,
            appointment_date, appointment_time, symptoms
        } = req.body;

        // 1. Validate required fields
        if (!patient_name || !patient_phone || !specialty_id || !appointment_date || !symptoms) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
        }

        // 2. Validate specialty tồn tại
        const specialty = await Specialty.findByPk(specialty_id);
        if (!specialty) {
            return res.status(404).json({ message: 'Chuyên khoa không tồn tại' });
        }

        // 3. Validate service nếu có
        if (service_id) {
            const service = await Service.findByPk(service_id);
            if (!service) {
                return res.status(404).json({ message: 'Dịch vụ không tồn tại' });
            }
            if (service.specialty_id !== specialty_id) {
                return res.status(400).json({ message: 'Dịch vụ không thuộc chuyên khoa được chọn' });
            }
        }

        // 4. Validate doctor nếu có
        if (doctor_id) {
            const doctor = await Doctor.findByPk(doctor_id);
            if (!doctor) {
                return res.status(404).json({ message: 'Bác sĩ không tồn tại' });
            }
            if (!doctor.is_active) {
                return res.status(400).json({ message: 'Bác sĩ hiện không khả dụng' });
            }
            if (doctor.specialty_id !== specialty_id) {
                return res.status(400).json({ message: 'Bác sĩ không thuộc chuyên khoa được chọn' });
            }
        }

        // 5. Validate ngày không quá khứ
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(appointment_date + 'T00:00:00');
        if (selectedDate < today) {
            return res.status(400).json({ message: 'Không thể đặt lịch cho ngày trong quá khứ' });
        }

        // 6. ✅ MỚI: Validate giờ không quá khứ (nếu là hôm nay)
        if (appointment_time && selectedDate.toDateString() === today.toDateString()) {
            const [hours, minutes] = appointment_time.split(':').map(Number);
            const appointmentMinutes = hours * 60 + minutes;
            const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes() + 30; // +30 buffer
            
            if (appointmentMinutes < currentMinutes) {
                return res.status(400).json({ 
                    message: `Không thể đặt lịch cho giờ ${appointment_time} (đã qua). Vui lòng chọn giờ khác.` 
                });
            }
        }

        // 7. Validate conflict (existing code)
        if (doctor_id && appointment_time) {
            const existingBooking = await Booking.findOne({
                where: {
                    doctor_id,
                    appointment_date,
                    appointment_time,
                    status: { [Op.notIn]: ['cancelled', 'doctor_rejected'] }
                }
            });

            if (existingBooking) {
                return res.status(400).json({
                    message: `Khung giờ ${appointment_time} ngày ${appointment_date} đã có người đặt`
                });
            }
        }

        // ... rest of booking creation
    } catch (error) {
        console.error('❌ Booking error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
```

### Giải pháp 3: ServiceDetail/DoctorDetail validate trước khi navigate
```javascript
// ServiceDetail.jsx - Validate before navigate
const handleSelectDoctor = (doctor) => {
    // ✅ VALIDATE trước khi navigate
    if (!doctor || !service) {
        toast.error('Thông tin không đầy đủ');
        return;
    }
    
    if (!doctor.is_active) {
        toast.error('Bác sĩ hiện không khả dụng');
        return;
    }
    
    // Navigate với params đã validate
    const params = new URLSearchParams();
    params.set('doctor', doctor.id);
    params.set('specialty', service.specialty_id);
    params.set('service', service.id);
    params.set('doctor_name', doctor.full_name);
    // KHÔNG truyền date/time từ đây - để user chọn trong Booking page
    
    navigate(`/booking?${params.toString()}`);
};
```

---

## 📊 KẾT LUẬN

**Tình trạng hiện tại**: 
- Frontend: 6/10 (có validation nhưng chưa đủ)
- Backend: 7/10 (thiếu một số validation quan trọng)
- **Tổng thể**: 6.5/10 - **CẦN CẢI THIỆN NGAY**

**Sau khi sửa**:
- Frontend: 9/10 (validate đầy đủ)
- Backend: 9.5/10 (validate chặt chẽ)
- **Tổng thể**: 9.2/10 - **XUẤT SẮC**

**Thời gian ước tính**: 3-4 giờ để sửa tất cả
**Ưu tiên**: 🔴 CAO - Sửa ngay hôm nay!
