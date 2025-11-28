import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styles from './DoctorLayout.module.css';

export default function DoctorLayout() {
    const [doctor, setDoctor] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem('user');

        if (userData) {
            try {
                const user = JSON.parse(userData);
                setDoctor(user);
            } catch (error) {
                console.error('❌ Parse user error:', error);
            }
        }
    }, []);

    const handleLogout = () => {
        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.clear();
        // Force reload to clean state
        window.location.href = '/login';
    };

    if (!doctor) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #e2e8f0',
                        borderTopColor: '#667eea',
                        borderRadius: '50%',
                        margin: '0 auto 1rem',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p>Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <div className={styles.logo}>👨‍⚕️</div>
                    <div>
                        <div className={styles.brandName}>Bác Sĩ</div>
                        <div className={styles.brandSubtext}>{doctor.full_name || doctor.name}</div>
                    </div>
                </div>

                <nav className={styles.nav}>
                    <NavLink
                        to="/doctor-portal"
                        end
                        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Tổng Quan
                    </NavLink>

                    <NavLink
                        to="/doctor-portal/appointments"
                        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Lịch Khám
                    </NavLink>

                    <NavLink
                        to="/doctor-portal/schedule"
                        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M8 2v4M16 2v4M3 10h18" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Lịch Làm Việc
                    </NavLink>

                    <NavLink
                        to="/doctor-portal/profile"
                        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Thông Tin Cá Nhân
                    </NavLink>
                </nav>

                <button className={styles.logoutBtn} onClick={handleLogout}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="16 17 21 12 16 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="21" y1="12" x2="9" y2="12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Đăng Xuất
                </button>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}