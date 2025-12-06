# 📱 TClinic Mobile App - Hướng dẫn Setup

## 🎯 Tổng quan
App mobile cho TClinic sử dụng **React Native + Expo**, code trên VS Code và chạy trên Android Studio Emulator.

## 📋 Yêu cầu
- Node.js 18+
- Android Studio (đã cài)
- VS Code
- Expo CLI

## 🚀 Cách chạy App

### Bước 1: Cài dependencies
```powershell
cd b:\tclinic_nhom3\mobile
npm install
```

### Bước 2: Mở Android Studio và tạo Emulator
1. Mở Android Studio
2. Vào **Tools > Device Manager**
3. Tạo mới emulator (nếu chưa có):
   - Click **Create Device**
   - Chọn **Pixel 4** hoặc thiết bị khác
   - Chọn **API 33** (Android 13) hoặc mới hơn
   - Finish
4. **Start** emulator (bấm nút Play ▶️)

### Bước 3: Chạy Backend Server
```powershell
cd b:\tclinic_nhom3\server
npm start
```
Server chạy ở http://localhost:5000

### Bước 4: Chạy App trên Emulator
```powershell
cd b:\tclinic_nhom3\mobile
npx expo start --android
```

Hoặc:
```powershell
npx expo start
# Sau đó nhấn 'a' để mở Android emulator
```

## 🔧 Cấu hình API

### Khi chạy trên Android Emulator:
File `src/config/api.js`:
```javascript
const API_BASE_URL = 'http://10.0.2.2:5000';
// 10.0.2.2 = localhost của máy tính khi chạy Android Emulator
```

### Khi chạy trên điện thoại thật:
1. Mở CMD, gõ `ipconfig` để lấy IP máy tính (ví dụ: 192.168.1.100)
2. Sửa file `src/config/api.js`:
```javascript
const API_BASE_URL = 'http://192.168.1.100:5000';
```
3. Đảm bảo điện thoại và máy tính cùng mạng WiFi

## 📁 Cấu trúc thư mục

```
mobile/
├── App.js                 # Entry point
├── src/
│   ├── config/
│   │   └── api.js         # Axios config, API URL
│   ├── constants/
│   │   └── theme.js       # Màu sắc, fonts, sizes
│   ├── context/
│   │   └── AuthContext.js # Quản lý đăng nhập
│   ├── navigation/
│   │   └── AppNavigator.js # Điều hướng màn hình
│   └── screens/
│       ├── auth/
│       │   └── LoginScreen.js
│       ├── patient/
│       │   └── PatientHomeScreen.js
│       └── doctor/
│           └── DoctorHomeScreen.js
```

## 🔐 API Endpoints đã sử dụng

### Auth
- `POST /api/auth/login` - Đăng nhập (patient, doctor)

### Patient
- `GET /api/patient/appointments` - Lấy lịch hẹn của bệnh nhân

### Doctor  
- `GET /api/doctor/appointments` - Lấy lịch khám của bác sĩ

## 📱 Tính năng đã có

### Bệnh nhân (Patient)
- ✅ Đăng nhập
- ✅ Xem dashboard với thống kê
- ✅ Xem danh sách lịch hẹn
- 🔲 Đặt lịch khám (cần thêm)
- 🔲 Xem lịch sử khám (cần thêm)

### Bác sĩ (Doctor)
- ✅ Đăng nhập
- ✅ Xem dashboard với lịch khám hôm nay
- ✅ Xem danh sách bệnh nhân
- 🔲 Khám bệnh (cần thêm)
- 🔲 Kê đơn thuốc (cần thêm)

## ⚠️ Lưu ý

1. **Emulator phải chạy trước** khi gõ `npx expo start --android`
2. **Backend phải chạy** ở port 5000
3. Nếu gặp lỗi kết nối, kiểm tra:
   - Server đang chạy?
   - IP đúng chưa?
   - Firewall có chặn không?

## 🛠️ Troubleshooting

### Lỗi "Network Error"
```javascript
// Kiểm tra IP trong src/config/api.js
// Emulator: 10.0.2.2:5000
// Điện thoại thật: [IP máy tính]:5000
```

### Lỗi "Cannot find module"
```powershell
cd mobile
rm -rf node_modules
npm install
```

### Emulator không khởi động
- Mở Android Studio > Device Manager > Wipe Data > Restart
