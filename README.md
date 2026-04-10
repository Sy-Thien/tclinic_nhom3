# TClinic - Hệ thống quản lý phòng khám

README này do tôi xây dựng và tổng hợp để mô tả đầy đủ dự án TClinic trước khi đưa lên GitHub.

## 1) Giới thiệu dự án
TClinic là ứng dụng web quản lý phòng khám đa khoa, gồm 3 vai trò chính:
- Admin
- Doctor
- Patient

Mục tiêu của dự án là số hóa quy trình đặt lịch, khám bệnh, kê đơn thuốc, quản lý bệnh nhân và vận hành phòng khám.

## 2) Công nghệ sử dụng
- Frontend: React 
- Backend: Node.js, Express
- Database: MySQL
- Xác thực: JWT + phân quyền theo role
- Vận hành: Docker Compose

## 3) Chức năng chính
- Quản lý lịch hẹn khám bệnh theo trạng thái
- Quản lý tài khoản và quyền truy cập theo từng role
- Hỗ trợ bác sĩ khám bệnh, cập nhật bệnh án, kê toa
- Hỗ trợ admin quản lý doctor/patient/chuyên khoa/dịch vụ/phòng khám/thuốc
- Thống kê cơ bản

## 4) Các service trong Docker
- client: giao diện người dùng (React + Nginx)
- server: API backend (Express)
- db: MySQL
- phpmyadmin: giao diện quản trị database

## 5) Cách chạy local (deploy local)
Dự án hiện tại được deploy và chạy trên local máy cá nhân bằng Docker.

### Bước 1: chạy hệ thống
```bash
docker compose up -d --build
```

### Bước 2: truy cập
- Frontend: http://localhost
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health
- phpMyAdmin: http://localhost:8081
- MySQL host port: 3307

## 6) Backup/Restore dữ liệu
Để tránh mất dữ liệu, dự án đã có script:

- Backup:
```bash
npm run db:backup
```

- Restore:
```bash
npm run db:restore
```

## 7) Vai trò của tôi trong dự án
Tôi là người tham gia phát triển và hoàn thiện dự án với vai trò Full-stack:
- Xây dựng và tích hợp frontend + backend
- Cấu hình Docker để chạy đồng bộ các service
- Tạo dữ liệu mẫu để test nghiệp vụ
- Bổ sung script backup/restore để đảm bảo an toàn dữ liệu
- Hoàn thiện tài liệu README và hướng dẫn deploy local
## 8) Note
Project này mình làm để học là chính nên vẫn còn thiếu nhiều thứ, chưa tối ưu và có thể còn bug.  
Qua project này mình hiểu rõ hơn cách build backend và cách các thành phần trong hệ thống hoạt động.
## 8) Ghi chú
- Dự án hiện ưu tiên môi trường local/development.
- Khi deploy production, cần đổi các giá trị secret và thông tin kết nối trong file env.

---
Nếu bạn clone repo này về máy, chỉ cần chạy `docker compose up -d --build` là có thể sử dụng ngay.
