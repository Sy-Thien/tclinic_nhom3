import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
    const [admin, setAdmin] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.clear();
        window.location.href = '/login';
    };

    if (!admin) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Đang tải...</p>
            </div>
        );
    }

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                {/* Logo & Brand */}
                <div className={styles.brand}>
                    <div className={styles.logoWrapper}>
                        <img src="/logo.png" alt="TClinic" className={styles.logoImg} />
                    </div>
                    <span className={styles.brandText}>TClinic Admin</span>
                </div>

                {/* User Info Card */}
                <div className={styles.userCard}>
                    <div className={styles.userAvatar}>
                        {admin.full_name?.charAt(0) || admin.username?.charAt(0) || 'A'}
                    </div>
                    <div className={styles.userInfo}>
                        <div className={styles.userName}>{admin.full_name || admin.username}</div>
                        <div className={styles.userRole}>Quản trị viên</div>
                    </div>
                    <button className={styles.logoutBtnSmall} onClick={handleLogout}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Đăng xuất
                    </button>
                </div>

                {/* Navigation */}
                <nav className={styles.nav}>
                    {/* TỔNG QUAN */}
                    <div className={styles.navSection}>
                        <div className={styles.sectionTitle}>TỔNG QUAN</div>
                        <NavLink
                            to="/admin"
                            end
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                            </svg>
                            Dashboard
                        </NavLink>
                    </div>

                    {/* QUẢN LÝ */}
                    <div className={styles.navSection}>
                        <div className={styles.sectionTitle}>QUẢN LÝ</div>

                        <NavLink
                            to="/admin/doctors"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            Bác sĩ
                        </NavLink>

                        <NavLink
                            to="/admin/patients"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                            </svg>
                            Bệnh nhân
                        </NavLink>

                        <NavLink
                            to="/admin/specialties"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" />
                            </svg>
                            Chuyên khoa
                        </NavLink>

                        <NavLink
                            to="/admin/rooms"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            Phòng khám
                        </NavLink>

                        <NavLink
                            to="/admin/services"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                            </svg>
                            Dịch vụ
                        </NavLink>

                        <NavLink
                            to="/admin/drugs"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.5 20.5L3.5 13.5a4.95 4.95 0 1 1 7-7l10 10a4.95 4.95 0 1 1-7 7l-3-3z" />
                                <path d="M8.5 8.5l7 7" />
                            </svg>
                            Kho thuốc
                        </NavLink>

                        <NavLink
                            to="/admin/revenue"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="5" width="20" height="14" rx="2" />
                                <path d="M2 10h20" />
                                <path d="M12 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                            </svg>
                            Doanh thu
                        </NavLink>

                        <NavLink
                            to="/admin/news"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                                <path d="M18 14h-8" />
                                <path d="M18 18h-8" />
                                <rect x="10" y="6" width="8" height="4" />
                            </svg>
                            Tin tức
                        </NavLink>
                    </div>

                    {/* HOẠT ĐỘNG */}
                    <div className={styles.navSection}>
                        <div className={styles.sectionTitle}>HOẠT ĐỘNG</div>

                        <NavLink
                            to="/admin/appointments"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            Đặt lịch
                        </NavLink>

                        <NavLink
                            to="/admin/doctor-schedules"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <path d="M8 2v4M16 2v4M3 10h18" />
                                <circle cx="12" cy="15" r="2" />
                            </svg>
                            Lịch làm việc
                        </NavLink>

                        <NavLink
                            to="/admin/time-slots"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            Khung giờ
                        </NavLink>

                        <NavLink
                            to="/admin/consultations"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            Tư vấn
                        </NavLink>

                        <NavLink
                            to="/admin/reports"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6422 3.10899 20.454C3 20.2401 3 19.9601 3 19.4V3" />
                                <path d="M7 14l4-4 4 4 6-6" />
                            </svg>
                            Báo cáo
                        </NavLink>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}