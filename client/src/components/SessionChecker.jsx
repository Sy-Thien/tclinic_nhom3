import React, { Component } from 'react';
import api from '../utils/api';
import withRouter from '../utils/withRouter';

/**
 * Component kiểm tra session định kỳ
 * Nếu đăng nhập từ trình duyệt khác, session này sẽ bị invalid và tự động logout
 * 
 * TẠM TẮT: Set ENABLE_SESSION_CHECK = true để bật lại
 */
const ENABLE_SESSION_CHECK = false;

class SessionChecker extends Component {
    constructor(props) {
        super(props);
        this.intervalRef = null;
        this.isCheckingRef = false;
    }

    handleLogout = (message) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Chỉ redirect nếu không phải đang ở trang login/register
        const publicPaths = ['/login', '/register'];
        if (!publicPaths.includes(this.props.location.pathname)) {
            alert(message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            this.props.navigate('/login');
        }
    };

    checkSession = async () => {
        // ✅ Tắt tính năng nếu không enable
        if (!ENABLE_SESSION_CHECK) return;

        // Tránh check trùng lặp
        if (this.isCheckingRef) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        // Không check nếu đang ở trang public
        const publicPaths = ['/login', '/register'];
        if (publicPaths.includes(this.props.location.pathname)) return;

        this.isCheckingRef = true;

        try {
            const response = await api.get('/api/auth/verify-session');

            if (!response.data.valid) {
                console.log('⚠️ Session không hợp lệ:', response.data.reason);

                // Chỉ logout khi session thực sự bị expired (đăng nhập từ nơi khác)
                if (response.data.reason === 'session_expired') {
                    this.handleLogout('Tài khoản đã đăng nhập từ thiết bị khác. Bạn đã bị đăng xuất.');
                } else if (response.data.reason === 'user_not_found') {
                    this.handleLogout('Tài khoản không tồn tại.');
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
            this.isCheckingRef = false;
        }
    };

    componentDidMount() {
        // ✅ Tắt tính năng nếu không enable
        if (!ENABLE_SESSION_CHECK) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        // Check ngay khi có token
        this.checkSession();

        // Check định kỳ mỗi 30 giây
        this.intervalRef = setInterval(this.checkSession, 30000);

        // Check khi tab được focus lại (user quay lại tab)
        this.handleFocus = () => {
            this.checkSession();
        };
        window.addEventListener('focus', this.handleFocus);

        // Check khi visibility change (tab active)
        this.handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                this.checkSession();
            }
        };
        document.addEventListener('visibilitychange', this.handleVisibility);
    }

    componentWillUnmount() {
        if (this.intervalRef) {
            clearInterval(this.intervalRef);
        }
        if (this.handleFocus) {
            window.removeEventListener('focus', this.handleFocus);
        }
        if (this.handleVisibility) {
            document.removeEventListener('visibilitychange', this.handleVisibility);
        }
    }

    // Component không render gì cả
    render() {
        return null;
    }
}

export default withRouter(SessionChecker);
