# 📮 Postman API Testing cho TClinic

## 🎯 MỤC ĐÍCH - Làm để làm gì?

| Mục đích | Giải thích |
|----------|------------|
| **Đảm bảo API hoạt động đúng** | Kiểm tra response trả về đúng format, status code |
| **Phát hiện bug sớm** | Mỗi lần push code → test tự động chạy → phát hiện lỗi ngay |
| **Documentation sống** | Collection = tài liệu API, team member mới hiểu ngay cách dùng |
| **Regression testing** | Đảm bảo code mới không phá vỡ chức năng cũ |
| **Tiết kiệm thời gian** | Thay vì test tay từng API → chạy 1 lệnh test hết (30+ APIs trong vài giây) |

### 🚀 Làm được gì?

```
✅ Test tất cả endpoints tự động
✅ Validate response (status code, data structure, values)  
✅ Test authentication flow (login → lấy token → gọi protected API)
✅ Test error handling (wrong password, no token, invalid data)
✅ Chạy trên CI/CD → mỗi lần push code tự động test
✅ Xuất báo cáo HTML đẹp để nộp bài/báo cáo
```

---

## 📁 CẤU TRÚC FILES

```
postman/
├── TClinic_API_Collection.postman_collection.json  ← Tất cả API requests + tests
├── TClinic_Environment.postman_environment.json    ← Biến môi trường (URL, tokens)
└── README.md                                        ← File này

.github/workflows/
└── api-tests.yml                                   ← CI/CD chạy test tự động
```

---

## 🔧 CÁCH SỬ DỤNG

### Bước 1: Import vào Postman

1. Download Postman: https://www.postman.com/downloads/
2. Click **Import** → chọn 2 file JSON trong thư mục `postman/`
3. Chọn Environment: **"TClinic Local"** (góc phải màn hình)

### Bước 2: Chạy test thủ công

```
1. 🏥 Health Check     → Kiểm tra server sống
2. 🔐 Login Admin      → Lấy token (tự động lưu vào biến)
3. 👨‍⚕️ Test Admin APIs   → CRUD doctors, services, time-slots
4. 📋 Test Booking     → Đặt lịch hẹn
5. 🧪 Negative Tests   → Test các trường hợp lỗi
```

### Bước 3: Chạy Collection Runner (test tất cả)

1. Click chuột phải vào **"TClinic API Collection"**
2. Chọn **"Run collection"**
3. Click **"Run TClinic API Collection"**
4. Xem kết quả: ✅ Pass / ❌ Fail

---

## 🖥️ CHẠY BẰNG COMMAND LINE (Newman)

```powershell
# Cài Newman
npm install -g newman
npm install -g newman-reporter-htmlextra

# Chạy tests
newman run postman/TClinic_API_Collection.postman_collection.json `
  -e postman/TClinic_Environment.postman_environment.json `
  -r htmlextra `
  --reporter-htmlextra-export test-report.html

# Mở báo cáo
start test-report.html
```

**Kết quả**: File `test-report.html` với giao diện đẹp, thống kê chi tiết.

---

## 🔄 CI/CD - CHẠY TỰ ĐỘNG KHI PUSH CODE

### Cách hoạt động

```
Developer push code → GitHub Actions trigger → 
  1. Setup MySQL database
  2. Start server
  3. Run Newman tests  
  4. Upload báo cáo HTML
  5. Comment kết quả lên Pull Request
```

### File cấu hình: `.github/workflows/api-tests.yml`

Workflow sẽ tự động chạy khi:
- Push lên branch `main` hoặc `develop`
- Tạo Pull Request vào `main`

### Xem kết quả

1. Vào **GitHub repo** → tab **Actions**
2. Click vào workflow run mới nhất
3. Download **Artifacts** → `api-test-results`
4. Mở `report.html` để xem chi tiết

---

## 📝 GIẢI THÍCH TEST SCRIPTS

### Mỗi request có Test script (tab "Tests"):

```javascript
// 1. Kiểm tra status code
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// 2. Kiểm tra response có đúng structure
pm.test("Response has data", function () {
    const response = pm.response.json();
    pm.expect(response.services).to.be.an('array');
});

// 3. Kiểm tra response time
pm.test("Response time < 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// 4. Lưu biến để dùng cho request sau
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("admin_token", response.token);  // Lưu token
}
```

### Variables tự động lưu:

| Variable | Được lưu sau request |
|----------|---------------------|
| `admin_token` | Login Admin |
| `doctor_token` | Login Doctor |
| `test_doctor_id` | Get All Doctors |
| `booking_id` | Create Booking |

---

## 🧪 CÁC LOẠI TEST

### ✅ Positive Tests (Happy Path)
- Login đúng → 200 + token
- CRUD thành công → 200/201
- Response đúng format

### ❌ Negative Tests (Error Handling)  
- Sai password → 401
- Không có token → 401
- Sai role (patient vào admin) → 403
- Resource không tồn tại → 404
- Dữ liệu không hợp lệ → 400

---

## 📊 CẤU TRÚC COLLECTION

```
TClinic API Collection/
├── 🔐 Authentication (4 requests)
│   ├── Login Admin          ← Auto-save admin_token
│   ├── Login Doctor         ← Auto-save doctor_token  
│   ├── Login Patient        ← Auto-save patient_token
│   └── Register Patient
│
├── 👨‍⚕️ Admin - Doctor Management (5 requests)
│   ├── Get All Doctors      ← Auto-save test_doctor_id
│   ├── Get Doctor by ID
│   ├── Create Doctor
│   ├── Update Doctor
│   └── Delete Doctor
│
├── 💊 Admin - Services (6 requests)
├── 📅 Admin - Time Slots (4 requests)  
├── 📋 Booking (5 requests)
├── 🏥 Public APIs (3 requests)
├── 👨‍⚕️ Doctor Portal (3 requests)
└── 🧪 Negative Tests (5 requests)
```

**Tổng: ~35 requests với tests tự động**

---

## ❓ TROUBLESHOOTING

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| "Could not send request" | Server chưa chạy | `cd server && npm start` |
| "401 Unauthorized" | Chưa có token | Chạy Login Admin trước |
| "Token is not valid" | Token hết hạn | Login lại |
| "ECONNREFUSED" | Sai port | Kiểm tra `base_url` = `http://localhost:5000` |

---

## 📚 TÀI LIỆU THAM KHẢO

- [Postman Docs](https://learning.postman.com/docs/)
- [Newman CLI](https://github.com/postmanlabs/newman)
- [Chai Assertions](https://www.chaijs.com/api/bdd/)
- [GitHub Actions](https://docs.github.com/en/actions)
