import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ QUAN TRỌNG: 
// - Dùng Android Emulator: 10.0.2.2:5000
// - Dùng điện thoại thật qua WiFi: Thay bằng IP máy tính (ipconfig → IPv4)
const API_BASE_URL = 'http://192.168.1.219:5000'; // IP máy tính của bạn trên cùng WiFi

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Tự động thêm token vào header
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Xử lý lỗi response
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await AsyncStorage.multiRemove(['token', 'user']);
        }
        return Promise.reject(error);
    }
);

export default api;
export { API_BASE_URL };
