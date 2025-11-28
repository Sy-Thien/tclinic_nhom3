import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute Component
 * Bảo vệ routes theo role người dùng
 * 
 * @param {string} requiredRole - Role yêu cầu: 'admin' | 'doctor' | 'patient' | 'any'
 * @param {JSX.Element} children - Component cần bảo vệ
 */
export default function ProtectedRoute({ children, requiredRole = 'any' }) {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const location = useLocation();

    // Parse user data
    let user = null;
    if (userData) {
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

    // ✅ Case 1: Route không yêu cầu đăng nhập (requiredRole = 'any' hoặc 'guest')
    // Cho phép tất cả user (kể cả admin/doctor) truy cập customer pages
    if (requiredRole === 'any' || requiredRole === 'guest') {
        return children;
    }

    // ✅ Case 2: Route yêu cầu đăng nhập
    if (!token || !user) {
        console.log('❌ Not logged in - Redirect to /login');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // ✅ Case 3: Kiểm tra role phù hợp
    if (requiredRole !== userRole) {
        console.log('❌ Wrong role:', userRole, '!==', requiredRole);
        console.log('📍 Current path:', location.pathname);
        console.log('🔄 Will redirect to:',
            userRole === 'admin' ? '/admin' :
                userRole === 'doctor' ? '/doctor' :
                    userRole === 'patient' ? '/' : '/login'
        );

        // Redirect về trang phù hợp với role
        if (userRole === 'admin') {
            return <Navigate to="/admin" replace />;
        }
        if (userRole === 'doctor') {
            return <Navigate to="/doctor" replace />;
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