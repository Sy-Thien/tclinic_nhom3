import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    console.log('🔐 ProtectedRoute check:', {
        hasToken: !!token,
        role: user.role,
        allowedRoles
    });

    // Kiểm tra token
    if (!token) {
        console.log('❌ No token - Redirect to /login');
        return <Navigate to="/login" replace />;
    }

    // Kiểm tra role (nếu có yêu cầu)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        console.log('❌ Unauthorized role - Redirect to /');
        return <Navigate to="/" replace />;
    }

    console.log('✅ Access granted');
    return children;
}