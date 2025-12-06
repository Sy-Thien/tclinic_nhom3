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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.clear();
        window.location.href = '/login';
    };

    if (!doctor) {
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
                    <span className={styles.brandText}>TClinic Bác Sĩ</span>
                </div>

                {/* User Info Card */}
                <div className={styles.userCard}>
                    <div className={styles.userAvatar}>
                        {doctor.full_name?.charAt(0) || doctor.name?.charAt(0) || 'B'}
                    </div>
                    <div className={styles.userInfo}>
                        <div className={styles.userName}>{doctor.full_name || doctor.name}</div>
                        <div className={styles.userRole}>Bác sĩ</div>
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
                            to="/doctor-portal"
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
                            to="/doctor-portal/patients"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            Hồ sơ bệnh nhân
                        </NavLink>

                        <NavLink
                            to="/doctor-portal/schedule"
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
                            to="/doctor-portal/reviews"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            Đánh giá từ BN
                        </NavLink>

                        <NavLink
                            to="/doctor-portal/profile"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            Thông tin cá nhân
                        </NavLink>
                    </div>

                    {/* HOẠT ĐỘNG */}
                    <div className={styles.navSection}>
                        <div className={styles.sectionTitle}>HOẠT ĐỘNG</div>

                        <NavLink
                            to="/doctor-portal/appointments"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            Lịch khám
                        </NavLink>

                        <NavLink
                            to="/doctor-portal/walk-in"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="8.5" cy="7" r="4" />
                                <line x1="20" y1="8" x2="20" y2="14" />
                                <line x1="23" y1="11" x2="17" y2="11" />
                            </svg>
                            Tiếp nhận trực tiếp
                        </NavLink>

                        <NavLink
                            to="/doctor-portal/consultations"
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            Tư vấn bệnh nhân
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