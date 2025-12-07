# 🚀 HƯỚNG DẪN CHẠY CI/CD GITHUB ACTIONS

## 📋 CÁC CÁCH CHẠY WORKFLOW

### Cách 1: Trigger thủ công (Khuyến nghị cho demo)

1. **Mở GitHub repository**
   - URL: `https://github.com/Sy-Thien/tclinic_nhom3`

2. **Vào tab Actions**
   - Click tab "Actions" ở menu trên

3. **Chọn workflow**
   - Bên trái, click workflow "🧪 API Tests"

4. **Run workflow**
   - Click nút "Run workflow" (bên phải)
   - Chọn branch: `main`
   - Click nút xanh "Run workflow"

5. **Xem quá trình chạy**
   - Workflow sẽ xuất hiện trong danh sách
   - Click vào tên workflow để xem chi tiết
   - Xem từng step: Setup, Install, Test, Upload...

6. **Xem kết quả**
   - ✅ Tất cả steps màu xanh = PASSED
   - ❌ Step màu đỏ = FAILED (click để xem log)
   - Cuối workflow, vào "Artifacts" để download `api-test-results`

### Cách 2: Tự động chạy khi push code

```powershell
# Làm 1 thay đổi nhỏ
cd B:\tclinic_nhom3
echo "# Test CI" >> README.md

# Commit và push
git add .
git commit -m "test: trigger CI workflow"
git push origin main
```

→ Workflow sẽ tự động chạy sau vài giây

### Cách 3: Tự động chạy khi tạo Pull Request

1. Tạo branch mới
2. Push code lên branch đó
3. Tạo Pull Request từ branch → main
4. Workflow sẽ tự động chạy để verify code

---

## 🧪 CHẠY TEST API LOCAL (Trước khi push)

### Kiểm tra nhanh

```powershell
# Đảm bảo server đang chạy
cd B:\tclinic_nhom3\server
node server.js
# (giữ terminal này chạy)

# Terminal mới - Chạy test
cd B:\tclinic_nhom3

newman run postman/TClinic_API_Collection.postman_collection.json `
  -e postman/TClinic_Environment.postman_environment.json `
  -r cli,htmlextra `
  --reporter-htmlextra-export test-report.html

# Mở báo cáo
start test-report.html
```

### Test với nhiều options

```powershell
newman run postman/TClinic_API_Collection.postman_collection.json `
  -e postman/TClinic_Environment.postman_environment.json `
  -r cli,htmlextra,json `
  --reporter-htmlextra-export ./test-results/report-$(Get-Date -Format 'yyyyMMdd-HHmmss').html `
  --reporter-json-export ./test-results/results.json `
  --delay-request 100 `
  --timeout-request 10000 `
  --color on
```

**Giải thích parameters:**
- `-r cli,htmlextra,json`: Tạo 3 loại báo cáo (console, HTML, JSON)
- `--delay-request 100`: Delay 100ms giữa các requests (tránh overload)
- `--timeout-request 10000`: Timeout 10s cho mỗi request
- `--color on`: Hiển thị màu sắc trong console

---

## 📊 ĐỌC KẾT QUẢ WORKFLOW

### Các steps trong workflow

```
📥 Checkout repository          → Clone code từ GitHub
📦 Setup Node.js                → Cài Node.js 18
📦 Install server dependencies  → npm install
⏳ Wait for MySQL               → Đợi MySQL container ready
🗄️ Setup database              → Sync database schema
🌱 Seed test data               → Tạo admin, doctor, patient test
🚀 Start server                 → Chạy server port 5000
❤️ Health check                 → Ping /health endpoint
📦 Install Newman               → Cài Newman CLI
📁 Create results directory     → Tạo thư mục lưu kết quả
🧪 Run API Tests                → Chạy Postman collection
📊 Upload test results          → Upload artifacts
📋 Test Summary                 → Hiển thị tổng kết
```

### Đọc test summary

**Format kết quả:**
```json
{
  "stats": {
    "iterations": { "total": 1, "pending": 0, "failed": 0 },
    "requests": { "total": 52, "pending": 0, "failed": 0 },
    "testScripts": { "total": 52, "pending": 0, "failed": 0 },
    "assertions": { "total": 156, "pending": 0, "failed": 0 }
  }
}
```

**Ý nghĩa:**
- `iterations`: Số lần chạy collection (thường = 1)
- `requests`: Tổng số API calls
- `testScripts`: Số test scripts
- `assertions`: Tổng số assertions (kiểm tra)
- `failed`: **Phải = 0** để pass!

### Download artifacts

1. Scroll xuống cuối workflow run page
2. Tìm section "Artifacts"
3. Click "api-test-results" để download ZIP
4. Giải nén → Xem `report.html` trong browser

---

## 🔧 SỬA WORKFLOW (Nếu cần)

File: `.github/workflows/api-tests.yml`

### Thay đổi khi nào workflow chạy

```yaml
on:
  push:
    branches: [main, develop, feature/*]  # Thêm branch patterns
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'  # Chạy tự động lúc 2h sáng mỗi ngày
  workflow_dispatch:  # Cho phép chạy thủ công
```

### Thay đổi Node version

```yaml
- name: 📦 Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Thay đổi từ 18 → 20
```

### Thay đổi MySQL version

```yaml
services:
  mysql:
    image: mysql:8.0  # Có thể đổi: 5.7, 8.0, 8.1
```

### Thêm notification (Slack, Email)

```yaml
# Thêm step cuối workflow
- name: 📧 Notify on Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🐛 TROUBLESHOOTING

### Workflow failed ở step "Setup database"

**Nguyên nhân**: Migration lỗi hoặc model không sync được

**Giải pháp**:
1. Check model definitions trong `server/models/`
2. Đảm bảo tất cả relationships đúng
3. Local test: `node sync-db.js` (tạo script test)

### Workflow failed ở step "Run API Tests"

**Nguyên nhân**: API tests failed, có thể do:
- Endpoint trả về sai status code
- Response body không match expected
- Timeout

**Giải pháp**:
1. Download artifacts, xem `results.json`
2. Tìm failed assertion:
   ```json
   {
     "name": "Status code is 200",
     "error": "expected 500 to equal 200"
   }
   ```
3. Fix code backend cho endpoint đó
4. Test local trước khi push lại

### MySQL container không start

**Nguyên nhân**: Resource limit hoặc port conflict

**Giải pháp**: Thêm health check timeout
```yaml
options: >-
  --health-cmd="mysqladmin ping"
  --health-interval=10s
  --health-timeout=10s  # Tăng từ 5s → 10s
  --health-retries=5    # Tăng từ 3 → 5
```

### Server health check failed

**Nguyên nhân**: Server chưa start kịp trong 30s

**Giải pháp**: Tăng thời gian wait
```yaml
- name: 🚀 Start server
  run: |
    node server.js &
    sleep 20  # Tăng từ 15 → 20 giây
```

---

## 📈 DEMO CI/CD CHO THẦY

### Script demo chuẩn (5 phút)

**1. Giới thiệu (30s)**
> "Thưa thầy, em xin demo hệ thống CI/CD với GitHub Actions. Mỗi khi push code, hệ thống tự động chạy test để đảm bảo code mới không phá vỡ chức năng cũ."

**2. Mở GitHub Actions (30s)**
- Mở browser → GitHub repo
- Click tab "Actions"
- "Đây là danh sách các workflow runs. Mỗi lần push sẽ có 1 run mới."

**3. Trigger workflow (1 phút)**
- Click workflow "🧪 API Tests"
- Click "Run workflow"
- Chọn branch `main`
- Click "Run workflow"
- "Workflow bắt đầu chạy..."

**4. Giải thích workflow (2 phút)**
> "Workflow bao gồm các bước:
> 
> 1. **Checkout code**: Clone code từ GitHub
> 2. **Setup Node.js**: Cài đặt Node.js 18
> 3. **Setup MySQL**: Khởi động MySQL container (Docker)
> 4. **Install dependencies**: npm install
> 5. **Database sync**: Tạo tables từ models
> 6. **Seed data**: Tạo admin, doctor test
> 7. **Start server**: Chạy server port 5000
> 8. **Health check**: Ping /health để verify server sống
> 9. **Run tests**: Chạy 50+ test cases với Newman
> 10. **Upload results**: Lưu báo cáo HTML/JSON
> 
> Toàn bộ quá trình tự động 100%, không cần can thiệp."

**5. Xem kết quả (1 phút)**
- Click vào workflow run (nếu đã chạy xong)
- "Tất cả steps đều passed ✅"
- Scroll xuống → Download artifacts
- Giải nén → Mở `report.html`
- "Báo cáo chi tiết: 52 requests, 156 assertions, all passed"

**Kết luận:**
> "Với CI/CD, nhóm em đảm bảo mọi code mới đều được test kỹ trước khi merge. Trong tương lai có thể mở rộng để tự động deploy lên server production."

---

## 📝 CHECKLIST DEMO CI/CD

Trước khi demo:
- [ ] Push code mới nhất lên GitHub
- [ ] Trigger 1 lần workflow để đảm bảo pass
- [ ] Download artifacts báo cáo HTML
- [ ] Mở sẵn GitHub Actions tab trên browser
- [ ] Chuẩn bị script giải thích (CHEAT_SHEET_DEMO.md)

Trong lúc demo:
- [ ] Giải thích tại sao cần CI/CD (auto test, catch bugs)
- [ ] Highlight các bước quan trọng (MySQL container, Newman test)
- [ ] Mở báo cáo HTML để show chi tiết
- [ ] Nhấn mạnh: "Tự động 100%, không cần can thiệp"

Nếu thầy hỏi:
- [ ] "Có deploy tự động không?" → "Chưa, có thể mở rộng với Docker + VPS"
- [ ] "Test coverage bao nhiêu?" → "85% integration tests, 50+ test cases"
- [ ] "Lợi ích gì?" → "Catch bugs sớm, đảm bảo code quality, team collaboration"

---

## 🔗 LINKS THAM KHẢO

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Newman CLI Docs**: https://learning.postman.com/docs/collections/using-newman-cli/
- **MySQL Docker**: https://hub.docker.com/_/mysql
- **Newman HTML Reporter**: https://github.com/DannyDainton/newman-reporter-htmlextra

---

**Chúc bạn demo thành công! 🎉**
