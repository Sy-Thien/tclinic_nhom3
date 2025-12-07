# 🕐 HƯỚNG DẪN SỬA LỖI TIMEZONE (created_at / updated_at)

## 🔍 Nguyên nhân

Vấn đề `created_at` và `updated_at` bị sai giờ thường do:

1. **MySQL server timezone** khác với timezone hệ thống (mặc định là UTC)
2. **Sequelize** không cấu hình timezone
3. **XAMPP MySQL** mặc định dùng SYSTEM timezone (có thể là UTC)

## ✅ Đã sửa gì?

### 1. Cấu hình Sequelize (`server/config/database.js`)

```javascript
const sequelize = new Sequelize('tn_clinic', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    timezone: '+07:00', // ✅ Timezone Việt Nam (UTC+7)
    dialectOptions: {
        timezone: '+07:00', // ✅ Timezone cho MySQL connection
        dateStrings: true,
        typeCast: true
    },
    define: {
        timestamps: true, // ✅ Enable timestamps mặc định
        underscored: true, // ✅ created_at, updated_at (snake_case)
    }
});
```

### 2. Cấu hình migrations (`server/config/config.json`)

```json
{
    "development": {
        "timezone": "+07:00",
        "dialectOptions": {
            "timezone": "+07:00"
        }
    }
}
```

### 3. Set timezone khi khởi động server (`server/server.js`)

Thêm vào đầu file server.js (sau khi connect DB):

```javascript
// Set timezone cho MySQL session
sequelize.query("SET time_zone = '+07:00'").then(() => {
    console.log('✅ MySQL timezone set to +07:00 (Vietnam)');
});
```

## 🧪 Cách kiểm tra

### Bước 1: Chạy script kiểm tra
```bash
cd b:\tclinic_nhom3\server
node fixTimezone.js
```

**Kết quả mong đợi**:
```
📊 Timezone hiện tại:
   - Global timezone: SYSTEM (hoặc UTC)
   - Session timezone: +07:00
   - Current MySQL time: 2025-12-07 14:30:00
   - Current Node.js time: 7/12/2025, 14:30:00
```

### Bước 2: Test tạo booking mới
```bash
# Khởi động server
cd server
npm start

# Tạo 1 booking mới qua API
# Kiểm tra created_at và updated_at trong database
```

### Bước 3: Kiểm tra trực tiếp trong MySQL
```sql
-- Kiểm tra timezone
SELECT @@global.time_zone, @@session.time_zone, NOW();

-- Xem dữ liệu mới nhất
SELECT id, booking_code, created_at, updated_at 
FROM tn_booking 
ORDER BY id DESC 
LIMIT 5;
```

## 🔧 Sửa vĩnh viễn timezone MySQL (XAMPP)

### Cách 1: Sửa file my.ini (Khuyến nghị)

**File**: `C:\xampp\mysql\bin\my.ini`

Thêm dòng sau vào section `[mysqld]`:
```ini
[mysqld]
default-time-zone = '+07:00'
```

Sau đó restart MySQL trong XAMPP Control Panel.

### Cách 2: Set trong code (Mỗi lần khởi động server)

**File**: `server/server.js`

Thêm sau khi connect DB:
```javascript
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');
        
        // ✅ Set timezone cho MySQL session
        await sequelize.query("SET time_zone = '+07:00'");
        console.log('✅ MySQL timezone set to +07:00');
        
        // ... rest of code
    }
};
```

## 📊 So sánh Trước/Sau

### Trước khi sửa:
```
Giờ hệ thống: 14:30 (7/12/2025)
MySQL NOW():  07:30 (7/12/2025)  ← Sai 7 tiếng
created_at:   2025-12-07 07:30:00  ← SAI!
```

### Sau khi sửa:
```
Giờ hệ thống: 14:30 (7/12/2025)
MySQL NOW():  14:30 (7/12/2025)  ← Đúng!
created_at:   2025-12-07 14:30:00  ← ĐÚNG!
```

## 🚨 Lưu ý quan trọng

### 1. Dữ liệu cũ không tự động cập nhật
Các records đã tồn tại VẪN GIỮ NGUYÊN giờ cũ. Nếu muốn sửa:

```sql
-- Cộng thêm 7 tiếng cho dữ liệu cũ (nếu cần)
UPDATE tn_booking 
SET created_at = DATE_ADD(created_at, INTERVAL 7 HOUR),
    updated_at = DATE_ADD(updated_at, INTERVAL 7 HOUR)
WHERE created_at < '2025-12-07 00:00:00';
```

⚠️ **CHÚ Ý**: Chỉ chạy nếu CHẮC CHẮN dữ liệu cũ bị sai! Backup trước!

### 2. Models với `timestamps: false`
Một số models có `timestamps: false` → KHÔNG tự động tạo `created_at`/`updated_at`:
- Admin
- Booking
- Doctor
- Patient
- Drug
- Invoice
- etc.

**Giải pháp**: Xóa `timestamps: false` hoặc set `timestamps: true` nếu muốn tự động.

### 3. Sequelize hooks (Không cần sửa)
Nếu models đã có:
```javascript
{
    hooks: {
        beforeCreate: (record) => {
            record.created_at = new Date();
        }
    }
}
```
→ Đã tự động dùng giờ server Node.js (đúng timezone).

## 📝 Checklist

- [x] Thêm `timezone: '+07:00'` vào `database.js`
- [x] Thêm `timezone: '+07:00'` vào `config.json`
- [x] Tạo script `fixTimezone.js` để test
- [ ] Thêm `SET time_zone` vào `server.js` (khuyến nghị)
- [ ] Sửa `my.ini` để set vĩnh viễn (tùy chọn)
- [ ] Test tạo booking mới và kiểm tra `created_at`
- [ ] Backup và fix dữ liệu cũ nếu cần

## 🎯 Kết quả mong đợi

Sau khi sửa xong:
- ✅ Mọi record mới có `created_at`/`updated_at` đúng giờ Việt Nam
- ✅ `NOW()` trong MySQL trả về giờ Việt Nam
- ✅ Không còn lệch 7 tiếng nữa

---

**Tác giả**: GitHub Copilot AI  
**Ngày**: 7/12/2025
