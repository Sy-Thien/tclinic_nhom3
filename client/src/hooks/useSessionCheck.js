import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

/**
 * Hook kiểm tra session định kỳ
 * Nếu đăng nhập từ trình duyệt khác, session này sẽ bị invalid và tự động logout
 */
export function useSessionCheck() {
    const navigate = useNavigate();
    const location = useLocation();
    const intervalRef = useRef(null);
    const isCheckingRef = useRef(false);

    const handleLogout = useCallback((message) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Chỉ redirect nếu không phải đang ở trang login
        if (location.pathname !== '/login') {
            alert(message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            navigate('/login');
        }
    }, [navigate, location.pathname]);

    const checkSession = useCallback(async () => {
        // Tránh check trùng lặp
        if (isCheckingRef.current) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        isCheckingRef.current = true;

        try {
            const response = await api.get('/api/auth/verify-session');

            if (!response.data.valid) {
                console.log('⚠️ Session không hợp lệ:', response.data.reason);

                if (response.data.reason === 'session_expired') {
                    handleLogout('Tài khoản đã đăng nhập từ thiết bị khác. Bạn đã bị đăng xuất.');
                } else {
                    handleLogout('Phiên đăng nhập không hợp lệ.');
                }
            }
        } catch (error) {
            // Nếu lỗi 401, interceptor đã xử lý
            if (error.response?.status !== 401) {
                console.error('Session check error:', error.message);
            }
        } finally {
            isCheckingRef.current = false;
        }
    }, [handleLogout]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Check ngay khi mount
        checkSession();

        // Check định kỳ mỗi 30 giây
        intervalRef.current = setInterval(checkSession, 30000);

        // Check khi tab được focus lại (user quay lại tab)
        const handleFocus = () => {
            checkSession();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            window.removeEventListener('focus', handleFocus);
        };
    }, [checkSession]);

    return { checkSession };
}

export default useSessionCheck;
