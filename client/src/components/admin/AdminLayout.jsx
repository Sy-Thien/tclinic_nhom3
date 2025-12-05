import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
    const [admin, setAdmin] = useState(null);
    const [doctorMenuOpen, setDoctorMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Auto-expand doctor menu if on doctor pages
    useEffect(() => {
        if (location.pathname.includes('/admin/doctors') ||
            location.pathname.includes('/admin/doctor-schedules') ||
            location.pathname.includes('/admin/time-slots')) {
            setDoctorMenuOpen(true);
        }
    }, [location.pathname]);

    useEffect(() => {
        const userData = localStorage.getItem('user');

        if (userData) {
            try {
                const user = JSON.parse(userData);
                setAdmin(user);
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

    if (!admin) {
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
                    <div className={styles.logo}>
                        <img src="/logo.png" alt="TClinic Logo" />
                    </div>
                    <div>
                        <div className={styles.brandName}>Admin</div>
                        <div className={styles.brandSubtext}>Phòng Khám Tclinic</div>
                    </div>
                </div>

                <nav className={styles.nav}>
                    <NavLink
                        to="/admin"
                        end
                        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/admin/appointments"
                        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                            <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
                            <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
                            <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
                        </svg>
                        Lịch hẹn
                    </NavLink>

                    {/* Menu Bác sĩ với submenu */}
                    <div className={styles.menuGroup}>
                        <div
                            className={`${styles.navItem} ${styles.menuParent} ${doctorMenuOpen ? styles.open : ''}`}
                            onClick={() => setDoctorMenuOpen(!doctorMenuOpen)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2" />
                                <circle cx="9" cy="7" r="4" strokeWidth="2" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeWidth="2" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2" />
                            </svg>
                            Bác sĩ
                            <svg
                                className={`${styles.arrow} ${doctorMenuOpen ? styles.arrowOpen : ''}`}
                                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            >
                                <polyline points="6 9 12 15 18 9" strokeWidth="2" />
                            </svg>
                        </div>

                        <div className={`${styles.submenu} ${doctorMenuOpen ? styles.submenuOpen : ''}`}>
                            <NavLink
                                to="/admin/doctors"
                                className={({ isActive }) => isActive ? `${styles.subItem} ${styles.active}` : styles.subItem}
                            >
                                Quản lý bác sĩ
                            </NavLink>
                            <NavLink
                                to="/admin/doctor-schedules"
                                className={({ isActive }) => isActive ? `${styles.subItem} ${styles.active}` : styles.subItem}
                            >
                                Lịch làm việc
                            </NavLink>
                            <NavLink
                                to="/admin/time-slots"
                                className={({ isActive }) => isActive ? `${styles.subItem} ${styles.active}` : styles.subItem}
                            >
                                Quản lý khung giờ
                            </NavLink>
                        </div>
                    </div>

                    <NavLink
                        to="/admin/patients"
                        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2" />
                            <circle cx="9" cy="7" r="4" strokeWidth="2" />
                        </svg>
                        Bệnh nhân
                    </NavLink>

                    <NavLink
                        to="/admin/specialties"
                        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" strokeWidth="2" />
                            <path d="M2 17l10 5 10-5" strokeWidth="2" />
                            <path d="M2 12l10 5 10-5" strokeWidth="2" />
                        </svg>
                        Chuyên khoa
                    </NavLink>

                    <NavLink
                        to="/admin/rooms"
                        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2" />
                            <polyline points="9 22 9 12 15 12 15 22" strokeWidth="2" />
                        </svg>
                        Phòng khám
                    </NavLink>

                    <NavLink
                        to="/admin/services"
                        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                            <line x1="9" y1="9" x2="15" y2="9" strokeWidth="2" />
                            <line x1="9" y1="15" x2="15" y2="15" strokeWidth="2" />
                        </svg>
                        Dịch vụ
                    </NavLink>

                    <NavLink
                        to="/admin/drugs"
                        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2" />
                        </svg>
                        Kho Thuốc
                    </NavLink>

                    <NavLink
                        to="/admin/consultations"
                        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="2" />
                        </svg>
                        Yêu cầu tư vấn
                    </NavLink>

                    <NavLink
                        to="/admin/news"
                        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" strokeWidth="2" />
                            <path d="M18 14h-8" strokeWidth="2" />
                            <path d="M18 18h-8" strokeWidth="2" />
                            <path d="M14 6h4v4h-4z" strokeWidth="2" />
                        </svg>
                        Tin tức
                    </NavLink>

                    <NavLink
                        to="/admin/reports"
                        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                            <line x1="3" y1="9" x2="21" y2="9" strokeWidth="2" />
                            <line x1="9" y1="21" x2="9" y2="9" strokeWidth="2" />
                        </svg>
                        Báo cáo
                    </NavLink>
                </nav>

                <button className={styles.logoutBtn} onClick={handleLogout}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="2" />
                        <polyline points="16 17 21 12 16 7" strokeWidth="2" />
                        <line x1="21" y1="12" x2="9" y2="12" strokeWidth="2" />
                    </svg>
                    Đăng xuất
                </button>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}