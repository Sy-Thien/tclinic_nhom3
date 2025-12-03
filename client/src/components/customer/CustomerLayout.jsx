import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './CustomerLayout.module.css';

export default function CustomerLayout() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // ✅ Đọc user từ localStorage ngay lập tức (không cần chờ API)
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                console.log('✅ User loaded from localStorage:', parsedUser.name);
            } catch (error) {
                console.error('❌ Parse user error:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const handleLogout = () => {
        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.clear(); // Clear any other potential data
        setUser(null);
        // Force reload để đảm bảo clean state
        window.location.href = '/';
    };

    const navLinks = [
        { path: '/', label: 'Trang chủ' },
        { path: '/booking', label: 'Đặt lịch' },
        { path: '/my-appointments', label: 'Lịch của tôi' }, // ✅ Thêm link này
        { path: '/services', label: 'Dịch vụ' },
        { path: '/doctors', label: 'Bác sĩ' },
        { path: '/about', label: 'Giới thiệu' }, // ✅ Thêm
        { path: '/contact', label: 'Liên hệ' } // ✅ Thêm
    ];

    return (
        <div className={styles.layout}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.container}>
                    <div className={styles.logo}>
                        <Link to="/">
                            <div className={styles.logoIcon}>
                                <img src="/logo.png" alt="TClinic Logo" />
                            </div>
                            <div>
                                <div className={styles.logoText}>Phòng Khám Tclinic</div>
                                <div className={styles.logoSubtext}>Chăm sóc sức khỏe toàn diện</div>
                            </div>
                        </Link>
                    </div>

                    <nav className={styles.nav}>
                        <Link to="/">Trang chủ</Link>
                        <Link to="/booking">Đặt lịch</Link>
                        <Link to="/my-appointments">Lịch của tôi</Link>
                        <Link to="/my-consultations">Lịch sử tư vấn</Link>
                        <Link to="/medical-history">Lịch sử khám</Link>
                        <Link to="/reviews">Đánh giá</Link>
                        <Link to="/services">Dịch vụ</Link>
                        <Link to="/doctors">Bác sĩ</Link>
                        <Link to="/news">Tin tức</Link>
                        <Link to="/about">Giới thiệu</Link> {/* ✅ Thêm */}
                        <Link to="/contact">Liên hệ</Link> {/* ✅ Thêm */}
                    </nav>

                    <div className={styles.actions}>
                        {!loading && (
                            <>
                                {user ? (
                                    // ✅ Đã đăng nhập
                                    <>
                                        <div className={styles.userInfo}>
                                            <span className={styles.userName}>{user.name || user.username}</span>
                                            <span className={styles.userRole}>
                                                {user.role === 'patient' ? 'Bệnh nhân' : 'Người dùng'}
                                            </span>
                                        </div>
                                        <Link to="/profile" className={styles.btnProfile} title="Xem thông tin cá nhân">
                                            👤
                                        </Link>
                                        <button onClick={handleLogout} className={styles.btnLogout}>
                                            Đăng xuất
                                        </button>
                                    </>
                                ) : (
                                    // ✅ Chưa đăng nhập
                                    <Link to="/login" className={styles.btnLogin}>
                                        Đăng nhập
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.main}>
                <Outlet />
            </main>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.container}>
                    <div className={styles.footerGrid}>
                        <div>
                            <h3>Phòng Khám Tclinic</h3>
                            <p>Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM</p>
                            <p>Điện thoại: (028) 1234 5678</p>
                        </div>
                        <div>
                            <h3>Giờ làm việc</h3>
                            <p>Thứ 2 - Thứ 6: 7:00 - 20:00</p>
                            <p>Thứ 7: 7:00 - 17:00</p>
                        </div>
                        <div>
                            <h3>Liên kết</h3>
                            <p>Chính sách bảo mật</p>
                            <p>Điều khoản sử dụng</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}