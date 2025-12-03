# 📋 Tính Năng Lịch Sử Khám Bệnh & Tải Đơn Thuốc

## 🎯 Chức Năng Mới

Bệnh nhân có thể:
1. ✅ **Xem lịch sử khám bệnh** đầy đủ chi tiết
2. 📄 **Xem đơn thuốc** với hướng dẫn sử dụng chi tiết
3. 💊 **Tải đơn thuốc PDF** để lưu trữ hoặc in ra

---

## 📱 Cách Sử Dụng

### 1. Truy cập trang "Lịch sử khám"
- Đăng nhập với tài khoản bệnh nhân
- Click vào menu **"Lịch sử khám"** trên thanh điều hướng
- URL: `http://localhost:5173/medical-history`

### 2. Xem danh sách lịch khám
Trang hiển thị các thẻ (cards) cho mỗi lần khám đã hoàn thành:
- **Ngày giờ khám**
- **Bác sĩ khám**
- **Chuyên khoa**
- **Triệu chứng**
- **Chẩn đoán** (nếu có)
- Badge "Đã khám" màu xanh

### 3. Xem chi tiết lần khám
Click nút **"Xem chi tiết"** để mở modal với thông tin đầy đủ:

#### 📊 Thông tin khám:
- Ngày giờ khám
- Bác sĩ điều trị
- Chuyên khoa
- Triệu chứng ban đầu

#### 🔬 Chẩn đoán:
- Kết quả chẩn đoán từ bác sĩ
- Thông tin bệnh lý

#### 📝 Kết luận:
- Kết luận của bác sĩ
- Hướng dẫn điều trị

#### 💊 Đơn thuốc (nếu có):
Bảng chi tiết thuốc bao gồm:
- **STT**: Số thứ tự
- **Tên thuốc**: Tên thương mại
- **Hoạt chất**: Thành phần chính
- **Số lượng**: Số viên/liều
- **Cách dùng**: 
  - Liều lượng mỗi lần
  - Số lần trong ngày
  - Thời điểm uống (trước/sau ăn)
- **Thời gian**: Số ngày sử dụng
- **Ghi chú riêng** cho từng loại thuốc (nếu có)

#### ⚠️ Lưu ý quan trọng:
Modal tự động hiển thị các lưu ý khi dùng thuốc:
- Uống đúng giờ, đúng liều
- Không tự ý ngưng thuốc
- Uống với nước lọc
- Cách bảo quản thuốc
- Khi nào cần liên hệ bác sĩ

### 4. Tải đơn thuốc PDF
Có 2 cách tải PDF:

#### Cách 1: Từ danh sách
- Click nút **"📄 Tải đơn thuốc"** ngay tại thẻ lịch khám

#### Cách 2: Từ chi tiết
- Mở modal "Xem chi tiết"
- Click nút **"📄 Tải đơn thuốc PDF"** ở cuối modal

#### 📥 File PDF bao gồm:
- **Header**: Logo phòng khám
- **Mã đơn thuốc**: Duy nhất cho mỗi đơn
- **Thông tin bệnh nhân**: Họ tên, tuổi, giới tính, SĐT, địa chỉ
- **Thông tin khám**: Ngày khám, bác sĩ, chuyên khoa
- **Triệu chứng**: Lý do đến khám
- **Chẩn đoán**: Kết quả chẩn đoán
- **Bảng đơn thuốc**: 7 cột chi tiết
  - STT
  - Tên thuốc
  - Hoạt chất
  - Số lượng
  - Liều lượng
  - Thời gian dùng
  - Ghi chú
- **Hướng dẫn sử dụng**: 5 điểm quan trọng
- **Ghi chú từ bác sĩ** (nếu có)
- **Kết luận**: Tổng kết và lời khuyên
- **Chữ ký bác sĩ**: Họ tên và ngày cấp
- **Footer**: Thông tin phòng khám

---

## 🎨 Giao Diện

### Màu sắc
- **Badge trạng thái**: Gradient xanh lá (#27ae60 → #2ecc71)
- **Header đơn thuốc**: Gradient tím (#667eea → #764ba2)
- **Lưu ý quan trọng**: Nền đỏ nhạt (#ffebee) với viền đỏ (#e74c3c)
- **Ghi chú bác sĩ**: Nền vàng nhạt (#fff9e6) với viền vàng (#f39c12)

### Responsive
- Desktop: Grid 3 cột
- Tablet: Grid 2 cột
- Mobile: 1 cột, full width

### Hiệu ứng
- Hover card: Nâng lên 4px, shadow tăng
- Button: Transform khi hover
- Modal: Fade in/out mượt mà

---

## 🔧 Kỹ Thuật

### Frontend
```javascript
// Import
import api from '../../utils/api';
import { generatePrescriptionPDF } from '../../utils/generatePrescriptionPDF';

// Fetch data
const response = await api.get('/api/medical-records/my-history');

// Generate PDF
generatePrescriptionPDF(prescriptionData, appointmentData, doctorData);
```

### Backend API

#### GET `/api/medical-records/my-history`
Lấy danh sách lịch sử khám (chỉ status='completed')

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "appointment_date": "2025-11-30",
      "appointment_time": "10:00:00",
      "symptoms": "Đau đầu, chóng mặt",
      "diagnosis": "Thiếu máu não",
      "conclusion": "Nghỉ ngơi, dùng thuốc theo đơn",
      "doctor": {
        "full_name": "BS. Nguyễn Văn A",
        "specialty": { "name": "Nội khoa" }
      },
      "prescription": {
        "prescription_code": "RX12345678",
        "note": "Uống sau ăn 30 phút",
        "details": [
          {
            "drug": {
              "name": "Paracetamol 500mg",
              "ingredient": "Acetaminophen"
            },
            "quantity": 20,
            "unit": "viên",
            "dosage": "1 viên x 3 lần/ngày",
            "duration": "7 ngày",
            "note": "Uống khi sốt trên 38.5°C"
          }
        ]
      }
    }
  ]
}
```

#### GET `/api/medical-records/my-history/:id`
Lấy chi tiết 1 lần khám

**Response:** Tương tự trên nhưng chỉ 1 object

---

## 📦 Dependencies

### Frontend (client/package.json)
```json
{
  "pdfmake": "^0.2.7"
}
```

### Đã cài sẵn:
- ✅ `pdfmake` - Tạo PDF client-side
- ✅ `pdfmake/build/vfs_fonts` - Font Roboto cho PDF

---

## 🧪 Test

### Test Case 1: Xem lịch sử
1. Đăng nhập bằng tài khoản bệnh nhân có lịch khám đã hoàn thành
2. Vào `/medical-history`
3. Kiểm tra hiển thị đầy đủ thông tin

### Test Case 2: Xem chi tiết
1. Click "Xem chi tiết" trên bất kỳ card nào
2. Modal hiển thị đầy đủ:
   - Thông tin khám ✓
   - Chẩn đoán ✓
   - Kết luận ✓
   - Đơn thuốc (nếu có) ✓
   - Lưu ý quan trọng ✓

### Test Case 3: Tải PDF
1. Click "Tải đơn thuốc PDF"
2. File tự động download với tên `ToaThuoc_RXxxxxxx_timestamp.pdf`
3. Mở file kiểm tra:
   - Header/Footer ✓
   - Thông tin bệnh nhân ✓
   - Bảng thuốc đầy đủ ✓
   - Hướng dẫn sử dụng ✓
   - Chữ ký bác sĩ ✓

### Test Case 4: Không có đơn thuốc
1. Xem lần khám không có prescription
2. Nút "Tải đơn thuốc" không hiển thị ✓
3. Section đơn thuốc trong modal không hiển thị ✓

### Test Case 5: Responsive
1. Test trên mobile (< 768px)
2. Grid chuyển thành 1 cột ✓
3. Modal full width ✓
4. Button stack vertical ✓

---

## 🐛 Troubleshooting

### PDF không tải được
- **Nguyên nhân**: Thiếu dữ liệu prescription
- **Giải pháp**: Kiểm tra booking đã có prescription chưa

### Font bị lỗi trong PDF
- **Nguyên nhân**: vfs_fonts chưa load
- **Giải pháp**: 
  ```javascript
  import pdfFonts from 'pdfmake/build/vfs_fonts';
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
  ```

### Modal không đóng được
- **Nguyên nhân**: Event propagation
- **Giải pháp**: Đã thêm `e.stopPropagation()` trong modalContent

### API trả về lỗi 401
- **Nguyên nhân**: Token hết hạn
- **Giải pháp**: Đăng nhập lại

---

## 📝 Notes

### Bảo mật
- ✅ API kiểm tra `patient_id` từ token
- ✅ Chỉ load lịch khám của chính mình
- ✅ Không thể xem lịch của người khác

### Performance
- Modal chỉ fetch detail khi click "Xem chi tiết"
- PDF generate client-side (không tốn server)
- Image/logo có thể cache

### UX
- Loading state khi fetch API
- Empty state khi chưa có lịch khám
- Hover effects mượt mà
- Icon sinh động (📋, 💊, 📄, ⚠️)

---

## 🚀 Future Improvements

1. **Email đơn thuốc**: Gửi PDF qua email
2. **In trực tiếp**: Thêm nút "In đơn thuốc"
3. **Lịch sử tải**: Track các lần tải PDF
4. **QR Code**: Thêm QR để verify đơn thuốc
5. **Multi-language**: Hỗ trợ tiếng Anh
6. **Dark mode**: Theme tối cho modal

---

**Phát triển bởi:** TClinic Team  
**Ngày cập nhật:** 02/12/2025  
**Version:** 2.0
