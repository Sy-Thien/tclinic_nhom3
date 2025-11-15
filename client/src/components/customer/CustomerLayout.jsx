import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './CustomerLayout.module.css';

export default function CustomerLayout() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setLoading(false);
            setUser(null); // ✅ Đảm bảo user = null
            return;
        }

        try {
            const response = await api.get('/api/auth/verify');

            if (response.data.valid) {
                setUser(response.data.user);
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/');
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
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" fill="currentColor" />
                                </svg>
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
                        <Link to="/services">Dịch vụ</Link>
                        <Link to="/doctors">Bác sĩ</Link>
                        <Link to="/about">Giới thiệu</Link> {/* ✅ Thêm */}
                        <Link to="/contact">Liên hệ</Link> {/* ✅ Thêm */}
                    </nav>

                    <div className={styles.actions}>
                        {!loading && (
                            <>
                                {user ? (
                                    // ✅ Đã đăng nhập - Hiển thị đầy đủ
                                    <>
                                        <div className={styles.userInfo}>
                                            <span className={styles.userName}>{user.name || user.username}</span>
                                            <span className={styles.userRole}>
                                                {user.role === 'admin' ? 'Admin' : 'Khách hàng'}
                                            </span>
                                        </div>
                                        {user.role === 'admin' && (
                                            <Link to="/admin" className={styles.btnAdmin}>
                                                Quản trị
                                            </Link>
                                        )}
                                        <button onClick={handleLogout} className={styles.btnLogout}>
                                            Đăng xuất
                                        </button>
                                    </>
                                ) : (
                                    // ✅ Chưa đăng nhập - CHỈ HIỆN NÚT ĐĂNG NHẬP
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