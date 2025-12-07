# Hướng Dẫn Hiển Thị Hóa Đơn VNPay

## Tổng quan
Tính năng hiển thị hóa đơn chi tiết sau khi thanh toán VNPay thành công, bao gồm:
- Thông tin bệnh nhân và bác sĩ
- Danh sách dịch vụ và thuốc chi tiết
- Phân tích chi phí (phí khám, tiền thuốc, giảm giá)
- Thông tin giao dịch VNPay
- Tính năng in hóa đơn

## Quy trình thanh toán VNPay

### 1. Tạo hóa đơn và thanh toán
**Endpoint**: `POST /api/vnpay/create-payment`

**Request body**:
```json
{
  "invoice_id": 123,
  "amount": 500000,
  "order_info": "Thanh toan hoa don INV-20251207-0001",
  "bank_code": "NCB" // Optional
}
```

**Response**:
```json
{
  "success": true,
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "orderId": "123145623"
}
```

**Quy trình**:
1. Bác sĩ tạo hóa đơn từ `PaymentModal` với `booking_id` và `prescription_id`
2. Chọn phương thức thanh toán "VNPay"
3. Hệ thống tạo URL thanh toán và chuyển hướng người dùng
4. Người dùng thanh toán trên cổng VNPay
5. VNPay callback về `/payment/vnpay-return` với kết quả

### 2. Xử lý callback VNPay
**Endpoint**: `GET /api/vnpay/return`

**Query params** (từ VNPay):
- `vnp_ResponseCode`: Mã kết quả (00 = thành công)
- `vnp_TxnRef`: Mã đơn hàng (invoice_id + timestamp)
- `vnp_TransactionNo`: Mã giao dịch VNPay
- `vnp_Amount`: Số tiền (VND * 100)
- `vnp_BankCode`: Mã ngân hàng
- `vnp_SecureHash`: Chữ ký bảo mật

**Response khi thành công**:
```json
{
  "success": true,
  "code": "00",
  "message": "Thanh toán thành công",
  "data": {
    "invoice_id": 123,
    "invoice_code": "INV-20251207-0001",
    "amount": 500000,
    "transaction_no": "14567890",
    "bank_code": "NCB",
    "invoice": {
      "id": 123,
      "invoice_code": "INV-20251207-0001",
      "patient_name": "Nguyễn Văn A",
      "patient_phone": "0901234567",
      "doctor_name": "BS. Trần Thị B",
      "service_fee": 200000,
      "drug_fee": 300000,
      "discount": 0,
      "total_amount": 500000,
      "payment_status": "paid",
      "payment_method": "vnpay",
      "items": [
        {
          "id": 1,
          "item_type": "service",
          "item_name": "Phí khám tổng quát",
          "quantity": 1,
          "unit": "lần",
          "unit_price": 200000,
          "total_price": 200000,
          "note": "Phí dịch vụ"
        },
        {
          "id": 2,
          "item_type": "drug",
          "item_name": "Paracetamol 500mg",
          "quantity": 20,
          "unit": "viên",
          "unit_price": 5000,
          "total_price": 100000,
          "note": "Uống 2 viên/lần, ngày 3 lần"
        },
        {
          "id": 3,
          "item_type": "drug",
          "item_name": "Amoxicillin 500mg",
          "quantity": 20,
          "unit": "viên",
          "unit_price": 10000,
          "total_price": 200000,
          "note": "Uống 1 viên/lần, ngày 2 lần"
        }
      ]
    }
  }
}
```

## Backend Implementation

### Controller: `vnpayController.js`

**Thay đổi chính**:
1. Import thêm `InvoiceItem` model
2. Lấy invoice với items khi thanh toán thành công
3. Trả về full invoice data trong response

```javascript
// Import
const { Invoice, InvoiceItem } = require('../models');

// Trong vnpayReturn - khi thanh toán thành công
const invoiceWithItems = await Invoice.findByPk(invoice.id, {
    include: [{
        model: InvoiceItem,
        as: 'items'
    }]
});

res.json({
    success: true,
    code: responseCode,
    message: 'Thanh toán thành công',
    data: {
        invoice_id: invoiceWithItems.id,
        invoice_code: invoiceWithItems.invoice_code,
        amount: amount,
        transaction_no: transactionNo,
        bank_code: bankCode,
        invoice: invoiceWithItems.toJSON() // ✅ Full invoice data
    }
});
```

## Frontend Implementation

### Component: `VNPayReturn.jsx`

**Cấu trúc hiển thị**:

```jsx
<div className={styles.invoiceSection}>
  {/* 1. Thông tin hóa đơn cơ bản */}
  <h2>📋 Hóa đơn</h2>
  <div className={styles.invoiceHeader}>
    - Mã hóa đơn
    - Bệnh nhân
    - Điện thoại
    - Bác sĩ
  </div>

  {/* 2. Chi tiết items */}
  <div className={styles.itemsSection}>
    <h3>Chi tiết dịch vụ và thuốc</h3>
    {invoice.items.map(item => (
      - Icon (🏥 service / 💊 drug)
      - Tên item
      - Ghi chú (dosage)
      - Số lượng + đơn vị
      - Thành tiền
    ))}
  </div>

  {/* 3. Phân tích chi phí */}
  <div className={styles.feeBreakdown}>
    - Phí khám: {service_fee}
    - Tiền thuốc: {drug_fee}
    - Giảm giá: -{discount} (nếu có)
    - TỔNG CỘNG: {total_amount}
  </div>
</div>

{/* 4. Thông tin thanh toán */}
<div className={styles.paymentInfo}>
  <h3>💳 Thông tin thanh toán</h3>
  - Mã giao dịch
  - Ngân hàng
  - Phương thức: VNPay
</div>
```

**Tính năng in hóa đơn**:
```jsx
<button 
    className={styles.printBtn}
    onClick={() => window.print()}
>
    🖨️ In hóa đơn
</button>
```

### Styles: `VNPayReturn.module.css`

**Responsive design**:
- Desktop: max-width 700px, 3 columns layout cho items
- Mobile: Stack layout, items full width

**Print styles**:
```css
@media print {
    .container { background: white; }
    .card { box-shadow: none; }
    .actions { display: none; } /* Ẩn nút */
    .icon { display: none; } /* Ẩn emoji */
}
```

**Key classes**:
- `.invoiceSection` - Container chính
- `.invoiceHeader` - Thông tin header
- `.itemsSection` - Danh sách items
- `.itemRow` - Mỗi item (flex layout)
- `.feeBreakdown` - Bảng tổng tiền
- `.paymentInfo` - Thông tin giao dịch

## Database Schema

### Table: `tn_invoices`
```sql
id, invoice_code, booking_id, patient_id, patient_name, patient_phone,
doctor_id, doctor_name, service_fee, drug_fee, other_fee, discount,
total_amount, payment_method, payment_status, transaction_id, paid_at,
note, created_at, updated_at
```

### Table: `tn_invoice_items`
```sql
id, invoice_id, item_type ('service'|'drug'), item_id, item_name,
quantity, unit, unit_price, total_price, note, created_at, updated_at
```

**Relationships**:
```javascript
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id', as: 'items' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
```

## Testing

### Test Case 1: Thanh toán thành công
1. Đăng nhập bác sĩ → Khám bệnh → Tạo đơn thuốc
2. Chọn thanh toán VNPay
3. Thanh toán trên sandbox VNPay (dùng test card)
4. Kiểm tra trang kết quả hiển thị đầy đủ:
   - ✅ Mã hóa đơn, bệnh nhân, bác sĩ
   - ✅ Danh sách items (dịch vụ + thuốc)
   - ✅ Phân tích chi phí chính xác
   - ✅ Thông tin giao dịch VNPay
   - ✅ Nút "In hóa đơn" hoạt động

### Test Case 2: Thanh toán thất bại
1. Hủy thanh toán trên VNPay
2. Kiểm tra hiển thị lỗi với mã lỗi
3. Có nút "Thử lại"

### Test Case 3: In hóa đơn
1. Thanh toán thành công
2. Click "In hóa đơn"
3. Kiểm tra print preview:
   - Ẩn nút action
   - Ẩn emoji/icon
   - Layout rõ ràng

## Security

**Kiểm tra chữ ký VNPay**:
```javascript
const hmac = crypto.createHmac("sha512", secretKey);
const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

if (secureHash !== signed) {
    return res.json({ success: false, code: '97', message: 'Chữ ký không hợp lệ' });
}
```

**Kiểm tra số tiền**:
- VNPay trả về amount * 100
- So sánh với `invoice.total_amount` (làm tròn)

## Error Handling

**Các mã lỗi VNPay**:
- `00` - Thành công
- `07` - Trừ tiền thành công nhưng giao dịch nghi ngờ
- `09` - Thẻ/Tài khoản chưa đăng ký dịch vụ
- `24` - Giao dịch bị hủy
- `97` - Chữ ký không hợp lệ

**Xử lý lỗi**:
```javascript
function getVNPayErrorMessage(responseCode) {
    const errors = {
        '07': 'Giao dịch nghi ngờ (trừ tiền thành công nhưng cần xác nhận)',
        '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ',
        '24': 'Giao dịch bị hủy',
        // ... more codes
    };
    return errors[responseCode] || 'Giao dịch thất bại';
}
```

## Environment Variables

```env
# VNPay Configuration
VNP_TMN_CODE=YOUR_TMN_CODE
VNP_HASH_SECRET=YOUR_HASH_SECRET
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:5173/payment/vnpay-return
```

## Future Improvements

1. **Email hóa đơn**: Gửi hóa đơn PDF qua email sau khi thanh toán
2. **Lịch sử thanh toán**: Xem lại hóa đơn từ dashboard
3. **QR Code**: Thêm QR code cho hóa đơn
4. **Export PDF**: Tải hóa đơn dưới dạng PDF (sử dụng `pdfmake`)
5. **Notification**: Thông báo realtime khi thanh toán thành công

## Related Files

### Backend
- `server/controllers/vnpayController.js` - VNPay payment handler
- `server/controllers/invoiceController.js` - Invoice CRUD
- `server/config/vnpay.js` - VNPay configuration
- `server/models/Invoice.js` - Invoice model
- `server/models/InvoiceItem.js` - Invoice items model

### Frontend
- `client/src/pages/payment/VNPayReturn.jsx` - Payment result page
- `client/src/pages/payment/VNPayReturn.module.css` - Styles
- `client/src/pages/doctor/PaymentModal.jsx` - Payment initiation
- `client/src/utils/api.js` - API client

### Documentation
- `API_TEST_GUIDE.md` - API testing guide
- `BOOKING_LOGIC_EXPLANATION.md` - Booking system overview
