import axios from 'axios';

// Preserve empty string from VITE_API_URL (Docker uses "" to force relative URLs).
const resolvedBaseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const api = axios.create({
    baseURL: resolvedBaseURL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server trả về lỗi
            const { status, data } = error.response;

            switch (status) {
                case 401:
                    // Unauthorized - Token hết hạn hoặc không hợp lệ
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                    break;

                case 403:
                    // Forbidden - Không có quyền truy cập
                    alert('Bạn không có quyền truy cập chức năng này!');
                    break;

                case 404:
                    // Not Found
                    console.error('Resource not found:', error.config.url);
                    break;

                case 500:
                    // Server Error
                    alert('Lỗi máy chủ! Vui lòng thử lại sau.');
                    break;

                default:
                    console.error('API Error:', data.message || error.message);
            }
        } else if (error.request) {
            // Request được gửi nhưng không nhận được phản hồi
            console.error('Network Error:', error.message);
            alert('Không thể kết nối đến máy chủ! Vui lòng kiểm tra kết nối.');
        } else {
            // Lỗi khác
            console.error('Error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;