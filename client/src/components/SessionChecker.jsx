import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

/**
 * Component kiểm tra session định kỳ
 * Nếu đăng nhập từ trình duyệt khác, session này sẽ bị invalid và tự động logout
 * 
 * TẠM TẮT: Set ENABLE_SESSION_CHECK = true để bật lại
 */
const ENABLE_SESSION_CHECK = false;

export default function SessionChecker() {
    const navigate = useNavigate();
    const location = useLocation();
    const intervalRef = useRef(null);
    const isCheckingRef = useRef(false);

    const handleLogout = useCallback((message) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Chỉ redirect nếu không phải đang ở trang login/register
        const publicPaths = ['/login', '/register'];
        if (!publicPaths.includes(location.pathname)) {
            alert(message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            navigate('/login');
        }
    }, [navigate, location.pathname]);

    const checkSession = useCallback(async () => {
        // ✅ Tắt tính năng nếu không enable
        if (!ENABLE_SESSION_CHECK) return;

        // Tránh check trùng lặp
        if (isCheckingRef.current) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        // Không check nếu đang ở trang public
        const publicPaths = ['/login', '/register'];
        if (publicPaths.includes(location.pathname)) return;

        isCheckingRef.current = true;

        try {
            const response = await api.get('/api/auth/verify-session');

            if (!response.data.valid) {
                console.log('⚠️ Session không hợp lệ:', response.data.reason);

                // Chỉ logout khi session thực sự bị expired (đăng nhập từ nơi khác)
                if (response.data.reason === 'session_expired') {
                    handleLogout('Tài khoản đã đăng nhập từ thiết bị khác. Bạn đã bị đăng xuất.');
                } else if (response.data.reason === 'user_not_found') {
                    handleLogout('Tài khoản không tồn tại.');
                }
                // Bỏ qua 'no_session_token' - token cũ vẫn valid
                // Bỏ qua 'error' - lỗi tạm thời
            }
        } catch (error) {
            // Nếu lỗi 401, interceptor đã xử lý
            if (error.response?.status !== 401) {
                console.error('Session check error:', error.message);
            }
        } finally {
            isCheckingRef.current = false;
        }
    }, [handleLogout, location.pathname]);

    useEffect(() => {
        // ✅ Tắt tính năng nếu không enable
        if (!ENABLE_SESSION_CHECK) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        // Check ngay khi có token
        checkSession();

        // Check định kỳ mỗi 30 giây
        intervalRef.current = setInterval(checkSession, 30000);

        // Check khi tab được focus lại (user quay lại tab)
        const handleFocus = () => {
            checkSession();
        };
        window.addEventListener('focus', handleFocus);

        // Check khi visibility change (tab active)
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                checkSession();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [checkSession]);

    // Component không render gì cả
    return null;
}
