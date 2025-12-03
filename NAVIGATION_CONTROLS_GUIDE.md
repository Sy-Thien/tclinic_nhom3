# 🧭 Navigation Controls - Hướng dẫn sử dụng

## Component: NavigationControls

Component điều hướng floating với 3 nút: **Quay lại**, **Tiếp theo**, **Trang chủ**

### 📍 Vị trí
- **Desktop:** Bottom-right, vertical stack
- **Mobile:** Bottom-right, vertical stack (nhỏ hơn)

### 🎨 Features
- ✅ Nút "← Quay lại" - Navigate back (-1)
- ✅ Nút "→ Tiếp theo" - Navigate forward (+1)
- ✅ Nút "🏠 Trang chủ" - Restart/Home
- ✅ Fixed position (floating buttons)
- ✅ Gradient purple design
- ✅ Hover effects
- ✅ Responsive

### 📦 Cài đặt

#### 1. Component đã tạo:
```
client/src/components/
├── NavigationControls.jsx
└── NavigationControls.module.css
```

#### 2. Đã thêm vào các trang:
- ✅ `News.jsx` - Danh sách tin tức
- ✅ `NewsDetail.jsx` - Chi tiết bài viết
- ✅ `Reviews.jsx` - Đánh giá
- ✅ `MedicalHistory.jsx` - Lịch sử khám

### 🔧 Cách sử dụng

#### Import component:
```jsx
import NavigationControls from '../../components/NavigationControls';
```

#### Thêm vào JSX (cuối component):
```jsx
return (
    <div className={styles.container}>
        {/* Your content */}
        
        <NavigationControls showRestart={true} restartPath="/" />
    </div>
);
```

### ⚙️ Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showRestart` | boolean | `true` | Hiển thị nút "Trang chủ" |
| `restartPath` | string | `'/'` | Đường dẫn khi click "Trang chủ" |

#### Ví dụ custom:
```jsx
// Ẩn nút Trang chủ
<NavigationControls showRestart={false} />

// Restart về dashboard
<NavigationControls restartPath="/dashboard" />

// Restart về tin tức
<NavigationControls restartPath="/news" />
```

### 🎯 Use Cases

#### 1. Reading articles (News/NewsDetail)
```jsx
<NavigationControls showRestart={true} restartPath="/news" />
```
- User có thể quay lại danh sách bài viết
- Tiếp tục đọc bài tiếp theo
- Restart về trang News

#### 2. Medical records
```jsx
<NavigationControls showRestart={true} restartPath="/" />
```
- Quay lại trang trước
- Restart về trang chủ

#### 3. Reviews
```jsx
<NavigationControls showRestart={true} restartPath="/" />
```
- Navigate trong các trang đánh giá
- Restart về home

### 🎨 Customization

#### Thay đổi vị trí:
Sửa trong `NavigationControls.module.css`:
```css
.navControls {
    position: fixed;
    bottom: 30px;    /* Thay đổi khoảng cách từ bottom */
    right: 30px;     /* Thay đổi khoảng cách từ right */
    /* Hoặc left: 30px; để đặt bên trái */
}
```

#### Horizontal layout:
```jsx
<NavigationControls className="horizontal" />
```

#### Thay đổi màu sắc:
```css
/* Purple gradient (mặc định) */
.navButton {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Orange gradient (Restart button) */
.restartButton {
    background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
}
```

### 📱 Responsive Behavior

**Desktop (> 768px):**
- Button size: 120px x 44px
- Font: 0.95rem
- Gap: 10px

**Mobile (≤ 768px):**
- Button size: 100px x 36px
- Font: 0.85rem
- Gap: 8px

### 🚀 Browser Navigation API

Component sử dụng React Router's `navigate()`:
- `navigate(-1)` - Quay lại trang trước (Back)
- `navigate(1)` - Tiến tới trang sau (Forward)
- `navigate('/')` - Đi đến đường dẫn cụ thể (Restart)

### ⚠️ Lưu ý

1. **Browser History Required:** 
   - Nút "Quay lại" chỉ hoạt động nếu có history
   - Nút "Tiếp theo" chỉ hoạt động nếu đã back trước đó

2. **Z-index:** 
   - Component có `z-index: 1000`
   - Đảm bảo không bị che bởi elements khác

3. **Fixed Position:**
   - Buttons luôn visible khi scroll
   - Không ảnh hưởng layout

### 🎁 Future Enhancements

Có thể thêm:
- [ ] Keyboard shortcuts (Alt+← / Alt+→)
- [ ] Scroll to top button
- [ ] Page history dropdown
- [ ] Favorite pages
- [ ] Share button
- [ ] Print button
- [ ] Dark mode toggle

### 📊 Testing

Test các tình huống:
1. ✅ Click "Quay lại" → Navigate back
2. ✅ Click "Tiếp theo" → Navigate forward
3. ✅ Click "Trang chủ" → Go to home
4. ✅ Mobile responsive → Buttons resize
5. ✅ Hover effects → Color change
6. ✅ Multiple clicks → No errors

---

**Status:** ✅ READY TO USE

**Version:** 1.0.0

**Created:** December 2, 2025
