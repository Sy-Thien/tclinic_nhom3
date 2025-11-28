import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook to detect localStorage changes from other tabs
 * Automatically redirects user if role changes
 */
export const useStorageSync = (requiredRole = null) => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleStorageChange = (e) => {
            // Only react to user/token changes
            if (e.key !== 'user' && e.key !== 'token' && e.key !== null) {
                return;
            }

            console.log('🔄 Storage changed in another tab:', e.key);

            const userStr = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            // If logged out in another tab
            if (!userStr || !token) {
                console.log('❌ Logged out in another tab');
                window.location.href = '/login';
                return;
            }

            try {
                const user = JSON.parse(userStr);

                // If role changed and doesn't match required role
                if (requiredRole && user.role !== requiredRole) {
                    console.log(`⚠️ Role changed from ${requiredRole} to ${user.role}`);

                    // Redirect to appropriate page based on new role
                    if (user.role === 'admin') {
                        window.location.href = '/admin';
                    } else if (user.role === 'doctor') {
                        window.location.href = '/doctor';
                    } else if (user.role === 'patient') {
                        window.location.href = '/';
                    } else {
                        window.location.href = '/login';
                    }
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                window.location.href = '/login';
            }
        };

        // Listen for storage events (fired when localStorage changes in OTHER tabs)
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [requiredRole, navigate]);
};
