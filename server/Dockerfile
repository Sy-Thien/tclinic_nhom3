# ============================================================
# Dockerfile cho Backend (Node.js + Express)
# ============================================================

# BƯỚC 1: Chọn image Node.js làm nền tảng
# - Dùng Node 18 phiên bản Alpine (nhẹ, chỉ ~50MB thay vì ~350MB)
FROM node:18-alpine

# BƯỚC 2: Đặt thư mục làm việc trong container
# - Mọi lệnh sau sẽ chạy trong /app
WORKDIR /app

# BƯỚC 3: Copy file package.json và package-lock.json trước
# - Trick: Copy riêng 2 file này trước để Docker cache layer npm install
# - Nếu code thay đổi nhưng dependencies không đổi → không cần install lại
COPY package.json package-lock.json ./

# BƯỚC 4: Cài đặt dependencies
# - --production: chỉ cài dependencies, bỏ devDependencies (nodemon, etc.)
# - Giảm kích thước image đáng kể
RUN npm ci --production

# BƯỚC 5: Copy toàn bộ source code backend vào container
COPY . .

# BƯỚC 6: Tạo thư mục uploads (để lưu file upload)
RUN mkdir -p /app/uploads

# BƯỚC 7: Mở port 5000 (port backend)
# - Chỉ là metadata, không thực sự mở port
EXPOSE 5000

# BƯỚC 8: Lệnh chạy server khi container khởi động
CMD ["node", "app.js"]
