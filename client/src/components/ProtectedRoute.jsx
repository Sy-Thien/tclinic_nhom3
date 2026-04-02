import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
import withRouter from '../utils/withRouter';

// ✅ Helper: Check if JWT token is expired
const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        return Date.now() >= exp;
    } catch {
        return true;
    }
};

/**
 * ProtectedRoute Component
 * Bảo vệ routes theo role người dùng
 * 
 * @param {string} requiredRole - Role yêu cầu: 'admin' | 'doctor' | 'patient' | 'public' | 'patient-or-guest'
 * @param {JSX.Element} children - Component cần bảo vệ
 */
class ProtectedRoute extends Component {
    render() {
        const { children, requiredRole = 'public', location } = this.props;

        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        // ✅ Check token expiry locally
        const tokenExpired = isTokenExpired(token);
        if (tokenExpired && token) {
            console.log('⚠️ Token expired, clearing...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }

        // Parse user data
        let user = null;
        if (userData && !tokenExpired) {
            try {
                user = JSON.parse(userData);
            } catch (error) {
                console.error('❌ Parse user error:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }

        const userRole = user?.role;

        console.log('🔐 ProtectedRoute:', {
            path: location.pathname,
            hasToken: !!token,
            userRole,
            requiredRole
        });

        // ✅ Case 1: Trang public - ai cũng vào được, nhưng admin/doctor redirect về dashboard
        if (requiredRole === 'public') {
            if (token && user) {
                if (userRole === 'admin') {
                    return <Navigate to="/admin" replace />;
                }
                if (userRole === 'doctor') {
                    return <Navigate to="/doctor-portal" replace />;
                }
            }
            return children;
        }

        // ✅ Case 2: Trang chỉ dành cho patient hoặc guest (chưa đăng nhập)
        if (requiredRole === 'patient-or-guest') {
            if (token && user) {
                if (userRole === 'admin') {
                    return <Navigate to="/admin" replace />;
                }
                if (userRole === 'doctor') {
                    return <Navigate to="/doctor-portal" replace />;
                }
                // Patient → cho phép
            }
            return children;
        }

        // ✅ Case 3: Route yêu cầu đăng nhập với role cụ thể
        if (!token || !user) {
            console.log('❌ Not logged in - Redirect to /login');
            return <Navigate to="/login" state={{ from: location }} replace />;
        }

        // ✅ Case 4: Kiểm tra role phù hợp
        if (requiredRole !== userRole) {
            console.log('❌ Wrong role:', userRole, '!==', requiredRole);

            // Redirect về trang phù hợp với role
            if (userRole === 'admin') {
                return <Navigate to="/admin" replace />;
            }
            if (userRole === 'doctor') {
                return <Navigate to="/doctor-portal" replace />;
            }
            if (userRole === 'patient') {
                return <Navigate to="/" replace />;
            }

            // Role không xác định - về login
            return <Navigate to="/login" replace />;
        }

        // ✅ Cho phép truy cập
        console.log('✅ Access granted');
        return children;
    }
}

export default withRouter(ProtectedRoute);