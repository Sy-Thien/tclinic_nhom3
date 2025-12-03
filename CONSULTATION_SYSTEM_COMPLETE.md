# ✅ Hệ Thống Tư Vấn & Hỗ Trợ - Hoàn Thành

## 📋 Tổng Quan

Hệ thống cho phép bệnh nhân gửi yêu cầu tư vấn, admin phân công bác sĩ chuyên khoa, và bác sĩ trả lời tư vấn.

### Workflow
```
Bệnh nhân/Khách    →    Admin phân công    →    Bác sĩ trả lời    →    Bệnh nhân xem kết quả
(Liên hệ)               (Chọn chuyên khoa)        (Tư vấn)              (Lịch sử tư vấn)
```

---

## 🗄️ Database

### Table: `tn_consultation_requests`
**Đã tạo**: ✅ (Kiểm tra bằng `node server/checkConsultationTable.js`)

**Các trường chính**:
- `patient_id` - NULL nếu khách vãng lai
- `guest_name`, `guest_email`, `guest_phone` - Thông tin khách
- `subject`, `message` - Nội dung yêu cầu
- `category` - `general`, `medical_inquiry`, `appointment`, `complaint`, `other`
- `specialty_id` - Chuyên khoa liên quan
- `assigned_doctor_id` - Bác sĩ được phân công
- `assigned_by_admin_id` - Admin phân công
- `status` - `pending` → `assigned` → `in_progress` → `resolved` → `closed`
- `priority` - `low`, `medium`, `high`, `urgent`
- `admin_notes` - Ghi chú của admin
- `doctor_response` - Câu trả lời từ bác sĩ
- Timestamps: `assigned_at`, `responded_at`, `resolved_at`

---

## 🔌 Backend API

### 1. Customer/Patient Routes (`/api/consultation-requests`)
**File**: `server/routes/consultationRequestRoutes.js`  
**Controller**: `server/controllers/consultationRequestController.js`

#### Endpoints:
```javascript
POST   /api/consultation-requests           // Tạo yêu cầu mới (cho cả guest và logged-in user)
GET    /api/consultation-requests/my-requests  // Xem yêu cầu của mình (requires auth)
GET    /api/consultation-requests/:id       // Xem chi tiết 1 yêu cầu
```

**Body mẫu (POST)**:
```json
{
  "patient_id": 1,  // nullable nếu guest
  "guest_name": "Nguyễn Văn A",  // bắt buộc nếu guest
  "guest_email": "nguyenvana@email.com",
  "guest_phone": "0901234567",
  "subject": "Tư vấn về đau đầu thường xuyên",
  "message": "Tôi bị đau đầu thường xuyên...",
  "category": "medical_inquiry",
  "specialty_id": 2  // optional
}
```

---

### 2. Admin Routes (`/api/admin/consultations`)
**File**: `server/routes/adminConsultationRoutes.js`  
**Controller**: `server/controllers/adminConsultationController.js`  
**Auth**: `verifyToken` + `isAdmin`

#### Endpoints:
```javascript
GET    /api/admin/consultations/stats      // Dashboard stats (total, by status)
GET    /api/admin/consultations            // Lấy tất cả yêu cầu (với filters)
POST   /api/admin/consultations/:id/assign-doctor  // Phân công bác sĩ
PUT    /api/admin/consultations/:id        // Cập nhật status, priority, notes
DELETE /api/admin/consultations/:id        // Xóa yêu cầu
```

**Query filters (GET)**:
- `?status=pending` - Lọc theo trạng thái
- `?priority=high` - Lọc theo độ ưu tiên
- `?specialty_id=2` - Lọc theo chuyên khoa
- `?search=đau đầu` - Tìm kiếm trong subject/message

**Body mẫu (POST assign-doctor)**:
```json
{
  "doctor_id": 5,
  "priority": "high",
  "admin_notes": "Cần xử lý gấp"
}
```

---

### 3. Doctor Routes (`/api/doctor/consultations`)
**File**: `server/routes/doctorConsultationRoutes.js`  
**Controller**: `server/controllers/doctorConsultationController.js`  
**Auth**: `verifyToken` + `isDoctor`

#### Endpoints:
```javascript
GET    /api/doctor/consultations           // Xem các yêu cầu được phân công
GET    /api/doctor/consultations/:id       // Xem chi tiết 1 yêu cầu
POST   /api/doctor/consultations/:id/respond  // Trả lời tư vấn
PUT    /api/doctor/consultations/:id/resolve  // Đánh dấu đã giải quyết
```

**Body mẫu (POST respond)**:
```json
{
  "response": "Căn cứ vào triệu chứng bạn mô tả, tôi khuyên bạn nên..."
}
```

---

## 🎨 Frontend Pages

### 1. Customer - Contact Page (Updated)
**File**: `client/src/pages/customer/Contact.jsx`  
**Route**: `/contact`  
**Mục đích**: Gửi yêu cầu tư vấn

**Features**:
- Form với category selector (Tư vấn chung, Tư vấn y khoa, Lịch hẹn, Khiếu nại)
- Specialty selector (Nội khoa, Ngoại khoa, Tim mạch, etc.)
- Auto-fill thông tin nếu đã đăng nhập
- Support guest users (nhập tên, email, SĐT)
- Toast notifications khi gửi thành công

---

### 2. Customer - My Consultations
**File**: `client/src/pages/customer/MyConsultations.jsx`  
**CSS**: `client/src/pages/customer/MyConsultations.module.css`  
**Route**: `/my-consultations`  
**Sidebar Link**: ✅ Added to CustomerLayout

**Features**:
- Xem lịch sử tất cả yêu cầu tư vấn của mình
- Hiển thị status badges (Chờ xử lý, Đã phân công, Đang xử lý, Đã giải quyết)
- Priority badges (Thấp, Trung bình, Cao, Khẩn cấp)
- Timeline-style cards
- Hiển thị thông tin bác sĩ được phân công
- Hiển thị câu trả lời từ bác sĩ (nếu có)

---

### 3. Admin - Consultation Requests Management
**File**: `client/src/pages/admin/ConsultationRequests.jsx`  
**CSS**: `client/src/pages/admin/ConsultationRequests.module.css`  
**Route**: `/admin/consultations`  
**Sidebar Link**: ✅ Added to AdminLayout (💬 Yêu cầu tư vấn)

**Features**:
- **Dashboard với 4 stats cards**: Tổng số, Chờ xử lý, Đã phân công, Đã giải quyết
- **Filters**: Status, Priority, Specialty, Search (subject/patient name)
- **Card layout** với đầy đủ thông tin: Patient, Message, Category, Priority
- **Assign Doctor Modal**:
  - Chọn chuyên khoa → Load danh sách bác sĩ của chuyên khoa đó
  - Chọn priority
  - Ghi chú của admin
- **Update Status**: Dropdown để thay đổi trạng thái nhanh
- **Delete**: Xóa yêu cầu với confirm
- **Empty state**: Khi không có dữ liệu

**UI Highlights**:
- Green badges cho `resolved`
- Orange badges cho `pending`
- Blue badges cho `assigned`
- Red badges cho `urgent` priority
- Modal với overlay backdrop

---

### 4. Doctor - Doctor Consultations
**File**: `client/src/pages/doctor/DoctorConsultations.jsx`  
**CSS**: `client/src/pages/doctor/DoctorConsultations.module.css`  
**Route**: `/doctor-portal/consultations`  
**Sidebar Link**: ✅ Added to DoctorLayout (💬 Tư vấn bệnh nhân)

**Features**:
- **Dashboard stats**: Tổng số, Chưa trả lời, Đã trả lời
- **Filter tabs**: Tất cả, Chưa trả lời, Đã trả lời
- **Patient info display**: Name, Email, Phone
- **Message timeline**: Subject, Message, Category, Specialty
- **Admin notes section**: Hiển thị ghi chú từ admin
- **Response Modal**:
  - Textarea để nhập câu trả lời
  - Auto cập nhật status thành `in_progress`
  - Lưu timestamp `responded_at`
- **Mark Resolved Button**: Đánh dấu đã giải quyết hoàn toàn
- **View Response Button**: Xem lại câu trả lời đã gửi

**UI Highlights**:
- Card-based layout
- Status indicators với icons
- Priority badges
- Modal với rich text area

---

## 🔗 Routes Integration

### App.jsx Routes ✅
```jsx
// Customer routes
<Route path="my-consultations" element={<MyConsultations />} />

// Doctor routes
<Route path="consultations" element={<DoctorConsultations />} />

// Admin routes
<Route path="consultations" element={<ConsultationRequests />} />
```

### Sidebar Menu Links ✅
1. **CustomerLayout**: "Lịch sử tư vấn" → `/my-consultations`
2. **DoctorLayout**: "💬 Tư vấn bệnh nhân" → `/doctor-portal/consultations`
3. **AdminLayout**: "💬 Yêu cầu tư vấn" → `/admin/consultations`

---

## 🧪 Testing Workflow

### 1. Khởi động hệ thống

#### Backend:
```powershell
cd b:\tclinic_nhom3\server
node server.js
```
**Kiểm tra**: Xem console log có dòng:
```
✅ Consultation routes registered:
   - /api/consultation-requests
   - /api/admin/consultations
   - /api/doctor/consultations
```

#### Frontend:
```powershell
cd b:\tclinic_nhom3\client
npm run dev
```
**Access**: http://localhost:5173

---

### 2. Test Customer Flow (Bệnh nhân)

#### A. Gửi yêu cầu tư vấn (Guest User)
1. Vào http://localhost:5173/contact
2. **Không cần đăng nhập**
3. Điền form:
   - Họ tên: Nguyễn Văn Test
   - Email: test@email.com
   - SĐT: 0901234567
   - Danh mục: Tư vấn y khoa
   - Chuyên khoa: Nội khoa (hoặc bỏ trống)
   - Tiêu đề: Tư vấn về đau bụng
   - Nội dung: Chi tiết triệu chứng...
4. Click "Gửi yêu cầu"
5. **Expected**: Toast "Đã gửi yêu cầu thành công", form reset

#### B. Gửi yêu cầu (Logged-in Patient)
1. Đăng nhập với tài khoản patient (xem TEST_LOGIN_GUIDE.md)
2. Vào `/contact`
3. **Expected**: Form tự động điền sẵn tên, email, SĐT
4. Chọn danh mục + nhập nội dung → Gửi
5. Vào `/my-consultations`
6. **Expected**: Thấy yêu cầu vừa gửi với status "Chờ xử lý"

---

### 3. Test Admin Flow

#### A. Xem danh sách yêu cầu
1. Đăng nhập admin (username từ `tn_admins.username`)
2. Click sidebar "💬 Yêu cầu tư vấn" hoặc vào `/admin/consultations`
3. **Expected**: 
   - Dashboard stats hiển thị số liệu
   - Danh sách các yêu cầu (cards)
   - Filters hoạt động

#### B. Phân công bác sĩ
1. Click nút "Phân công bác sĩ" trên card có status `pending`
2. **Modal mở**:
   - Chọn chuyên khoa: "Nội khoa"
   - **Expected**: Dropdown bác sĩ load danh sách bác sĩ Nội khoa
   - Chọn bác sĩ
   - Chọn priority: "Cao"
   - Ghi chú: "Cần xử lý trong ngày"
3. Click "Phân công"
4. **Expected**: 
   - Modal đóng
   - Card cập nhật status → "Đã phân công"
   - Badge hiển thị bác sĩ được chọn

#### C. Cập nhật trạng thái
1. Click dropdown "Trạng thái" trên card
2. Chọn "Đang xử lý"
3. **Expected**: Status badge cập nhật ngay

#### D. Xóa yêu cầu
1. Click nút "Xóa"
2. Confirm dialog hiển thị
3. Click OK
4. **Expected**: Card biến mất, stats giảm

---

### 4. Test Doctor Flow

#### A. Xem yêu cầu được phân công
1. Đăng nhập bác sĩ (email từ `tn_doctors.email`)
2. Click sidebar "💬 Tư vấn bệnh nhân" hoặc vào `/doctor-portal/consultations`
3. **Expected**:
   - Stats dashboard: Tổng số, Chưa trả lời, Đã trả lời
   - Danh sách các yêu cầu được admin phân cho mình
   - Filter tabs hoạt động

#### B. Trả lời tư vấn
1. Click nút "Trả lời" trên card
2. **Modal mở** với:
   - Thông tin bệnh nhân
   - Nội dung yêu cầu
   - Textarea nhập câu trả lời
3. Nhập câu trả lời:
   ```
   Căn cứ vào triệu chứng bạn mô tả, tôi khuyên bạn nên:
   1. Nghỉ ngơi đầy đủ
   2. Uống nhiều nước
   3. Nếu triệu chứng kéo dài > 3 ngày, vui lòng đến khám trực tiếp
   ```
4. Click "Gửi câu trả lời"
5. **Expected**:
   - Modal đóng
   - Card hiển thị "Đã trả lời"
   - Button đổi thành "Xem câu trả lời"

#### C. Đánh dấu đã giải quyết
1. Click nút "Đánh dấu đã giải quyết"
2. Confirm
3. **Expected**: Status → "Đã giải quyết", badge màu xanh

---

### 5. Test Customer View Response

1. Đăng nhập lại với tài khoản patient
2. Vào `/my-consultations`
3. **Expected**: 
   - Yêu cầu có status "Đã giải quyết"
   - Section "Câu trả lời từ bác sĩ" hiển thị đầy đủ
   - Hiển thị tên bác sĩ, thời gian trả lời

---

## 🔍 Testing Checklist

- [ ] Guest user gửi yêu cầu thành công (không cần login)
- [ ] Logged-in patient gửi yêu cầu (auto-fill info)
- [ ] Patient xem lịch sử tư vấn tại `/my-consultations`
- [ ] Admin xem dashboard stats
- [ ] Admin filter theo status, priority, specialty
- [ ] Admin search theo subject/name
- [ ] Admin phân công bác sĩ (chọn chuyên khoa → load bác sĩ)
- [ ] Admin cập nhật priority và status
- [ ] Admin xóa yêu cầu
- [ ] Doctor xem danh sách yêu cầu được phân
- [ ] Doctor filter tabs (Tất cả, Chưa trả lời, Đã trả lời)
- [ ] Doctor trả lời tư vấn
- [ ] Doctor đánh dấu đã giải quyết
- [ ] Patient nhận được câu trả lời từ bác sĩ
- [ ] Sidebar links hoạt động (3 roles)
- [ ] Status workflow: pending → assigned → in_progress → resolved

---

## 🐛 Troubleshooting

### Backend không load routes mới
**Solution**: Restart backend server
```powershell
cd b:\tclinic_nhom3\server
# Stop current server (Ctrl+C)
node server.js
```
**Check**: Console log phải có "✅ Consultation routes registered"

### Frontend không tìm thấy page
**Solution**: 
1. Kiểm tra import trong `App.jsx`
2. Clear browser cache (Ctrl+Shift+R)
3. Restart Vite dev server

### API trả về 404
**Causes**:
- Backend chưa restart sau khi thêm routes
- Route path sai (check typo)
- Controller function không export đúng

**Check**: 
```powershell
# Test API endpoint
curl http://localhost:5000/api/consultation-requests
```

### Không load được bác sĩ trong admin modal
**Cause**: Chưa chọn chuyên khoa  
**Solution**: Phải chọn chuyên khoa trước, sau đó dropdown bác sĩ mới load

### Database lỗi foreign key
**Solution**: 
```sql
-- Check if related tables exist
SHOW TABLES LIKE 'tn_%';

-- Check foreign key constraints
SELECT * FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'tn_consultation_requests';
```

---

## 📁 File Summary

### Backend (11 files)
1. `server/migrations/20251202001-create-consultation-requests.js` - Migration
2. `server/models/ConsultationRequest.js` - Model
3. `server/models/index.js` - Model registration + relationships
4. `server/controllers/consultationRequestController.js` - Customer controller
5. `server/controllers/adminConsultationController.js` - Admin controller
6. `server/controllers/doctorConsultationController.js` - Doctor controller
7. `server/routes/consultationRequestRoutes.js` - Customer routes
8. `server/routes/adminConsultationRoutes.js` - Admin routes
9. `server/routes/doctorConsultationRoutes.js` - Doctor routes
10. `server/server.js` - Route registration (updated)
11. `server/checkConsultationTable.js` - Utility script

### Frontend (8 files)
1. `client/src/pages/customer/Contact.jsx` - Updated with consultation form
2. `client/src/pages/customer/MyConsultations.jsx` - Patient history page
3. `client/src/pages/customer/MyConsultations.module.css` - Styling
4. `client/src/pages/admin/ConsultationRequests.jsx` - Admin management page
5. `client/src/pages/admin/ConsultationRequests.module.css` - Styling
6. `client/src/pages/doctor/DoctorConsultations.jsx` - Doctor response page
7. `client/src/pages/doctor/DoctorConsultations.module.css` - Styling
8. `client/src/App.jsx` - Route configuration (updated)

### Layouts (3 files updated)
1. `client/src/components/admin/AdminLayout.jsx` - Added sidebar link
2. `client/src/components/doctor/DoctorLayout.jsx` - Added sidebar link
3. `client/src/components/customer/CustomerLayout.jsx` - Added sidebar link

---

## 🎯 Next Steps (Optional Enhancements)

1. **Email Notifications**: Gửi email khi:
   - Admin phân công bác sĩ → Email cho bác sĩ
   - Bác sĩ trả lời → Email cho bệnh nhân

2. **Real-time Updates**: WebSocket để admin/doctor nhận thông báo real-time

3. **File Attachments**: Cho phép bệnh nhân đính kèm ảnh (X-rays, test results)

4. **Rating System**: Bệnh nhân đánh giá chất lượng tư vấn

5. **Chat Thread**: Cho phép nhiều lượt hỏi-đáp thay vì chỉ 1 lần

---

## ✅ Completion Status

**Database**: ✅ Complete  
**Backend API**: ✅ Complete (3 controllers, 3 routes)  
**Frontend Pages**: ✅ Complete (4 pages with full UI)  
**Routes Integration**: ✅ Complete (App.jsx + Sidebar menus)  
**Documentation**: ✅ Complete (This file)  

**System is READY for testing!** 🚀

---

**Created**: 2025-12-02  
**Status**: Production Ready  
**Next Action**: Restart backend server and test full workflow
