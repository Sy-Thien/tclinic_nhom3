# ============================================================
# Dockerfile cho Frontend (React + Vite) — Multi-stage Build
# ============================================================
# Multi-stage build: Chia thành 2 giai đoạn
#   1. Build: Dùng Node.js để build ra file tĩnh (HTML/CSS/JS)
#   2. Serve: Dùng Nginx (web server nhẹ) để phục vụ file tĩnh


# ===================== GIAI ĐOẠN 1: BUILD =====================
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files trước (tận dụng Docker cache)
COPY package.json package-lock.json ./

# Cài đặt TẤT CẢ dependencies (cần devDependencies để build)
RUN npm ci

# Copy toàn bộ source code
COPY . .

# Truyền biến môi trường VITE_API_URL lúc build
# Giá trị mặc định là rỗng (sẽ dùng relative URL qua nginx proxy)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build ứng dụng React → tạo ra thư mục /app/dist
RUN npm run build


# ===================== GIAI ĐOẠN 2: SERVE =====================
# Dùng Nginx Alpine (chỉ ~5MB) để phục vụ file tĩnh
FROM nginx:alpine

# Copy file cấu hình Nginx tùy chỉnh
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy file build từ giai đoạn 1 vào thư mục web root của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Mở port 80 (port mặc định của Nginx)
EXPOSE 80

# Chạy Nginx ở foreground (không chạy daemon)
CMD ["nginx", "-g", "daemon off;"]
