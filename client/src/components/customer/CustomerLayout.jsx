import React, { Component } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import styles from './CustomerLayout.module.css';
import NotificationBell from '../common/NotificationBell';
import withRouter from '../../utils/withRouter';

class CustomerLayout extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: null,
            loading: true,
            showMobileMenu: false,
            showUserMenu: false
        };
        this.userMenuRef = React.createRef();
    }

    componentDidMount() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                this.setState({ user: parsedUser });
            } catch (error) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        this.setState({ loading: false });
        document.addEventListener('mousedown', this.handleClickOutside);
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside);
    }

    handleClickOutside = (event) => {
        if (this.userMenuRef.current && !this.userMenuRef.current.contains(event.target)) {
            this.setState({ showUserMenu: false });
        }
    };

    handleLogout = () => {
        localStorage.clear();
        this.setState({ user: null });
        window.location.href = '/';
    };

    render() {
        const { user, loading, showMobileMenu, showUserMenu } = this.state;

        return (
            <div className={styles.layout}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerInner}>
                        {/* Logo */}
                        <Link to="/" className={styles.logo}>
                            <div className={styles.logoIcon}>
                                <img src="/logo.png" alt="TClinic" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '🏥'; }} />
                            </div>
                            <span className={styles.logoText}>TClinic</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className={styles.nav}>
                            <NavLink to="/" end className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                                Trang chủ
                            </NavLink>
                            <NavLink to="/booking" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                                Đặt lịch
                            </NavLink>
                            <NavLink to="/doctors" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                                Bác sĩ
                            </NavLink>
                            <NavLink to="/services" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                                Dịch vụ
                            </NavLink>
                            <NavLink to="/news" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                                Tin tức
                            </NavLink>
                            <NavLink to="/contact" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                                Liên hệ
                            </NavLink>
                        </nav>

                        {/* Actions */}
                        <div className={styles.actions}>
                            {!loading && (
                                <>
                                    {user ? (
                                        <>
                                            {user.role === 'patient' && <NotificationBell />}
                                            <div className={styles.userMenu} ref={this.userMenuRef}>
                                                <button
                                                    className={styles.userBtn}
                                                    onClick={() => this.setState({ showUserMenu: !showUserMenu })}
                                                >
                                                    <div className={styles.avatar}>
                                                        {user.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className={styles.userName}>{user.name || 'Người dùng'}</span>
                                                    <svg className={styles.chevron} width="12" height="12" viewBox="0 0 12 12">
                                                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                                    </svg>
                                                </button>
                                                {showUserMenu && (
                                                    <div className={styles.userDropdown}>
                                                        <Link to="/profile" onClick={() => this.setState({ showUserMenu: false })}>
                                                            <i>👤</i> Hồ sơ cá nhân
                                                        </Link>
                                                        <Link to="/my-appointments" onClick={() => this.setState({ showUserMenu: false })}>
                                                            <i>📅</i> Lịch hẹn của tôi
                                                        </Link>
                                                        <Link to="/medical-history" onClick={() => this.setState({ showUserMenu: false })}>
                                                            <i>📋</i> Lịch sử khám
                                                        </Link>
                                                        <Link to="/reviews" onClick={() => this.setState({ showUserMenu: false })}>
                                                            <i>⭐</i> Đánh giá
                                                        </Link>
                                                        <div className={styles.divider}></div>
                                                        <button onClick={this.handleLogout} className={styles.logoutBtn}>
                                                            <i>🚪</i> Đăng xuất
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className={styles.authBtns}>
                                            <Link to="/login" className={styles.loginBtn}>Đăng nhập</Link>
                                            <Link to="/register" className={styles.registerBtn}>Đăng ký</Link>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Mobile menu button */}
                            <button
                                className={styles.mobileMenuBtn}
                                onClick={() => this.setState({ showMobileMenu: !showMobileMenu })}
                            >
                                {showMobileMenu ? '✕' : '☰'}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {showMobileMenu && (
                        <nav className={styles.mobileNav}>
                            <NavLink to="/" end onClick={() => this.setState({ showMobileMenu: false })}>Trang chủ</NavLink>
                            <NavLink to="/booking" onClick={() => this.setState({ showMobileMenu: false })}>Đặt lịch</NavLink>
                            <NavLink to="/doctors" onClick={() => this.setState({ showMobileMenu: false })}>Bác sĩ</NavLink>
                            <NavLink to="/services" onClick={() => this.setState({ showMobileMenu: false })}>Dịch vụ</NavLink>
                            <NavLink to="/news" onClick={() => this.setState({ showMobileMenu: false })}>Tin tức</NavLink>
                            <NavLink to="/contact" onClick={() => this.setState({ showMobileMenu: false })}>Liên hệ</NavLink>
                            {user && (
                                <>
                                    <div className={styles.mobileDivider}></div>
                                    <NavLink to="/my-appointments" onClick={() => this.setState({ showMobileMenu: false })}>Lịch hẹn</NavLink>
                                    <NavLink to="/medical-history" onClick={() => this.setState({ showMobileMenu: false })}>Lịch sử khám</NavLink>
                                    <NavLink to="/profile" onClick={() => this.setState({ showMobileMenu: false })}>Hồ sơ</NavLink>
                                </>
                            )}
                        </nav>
                    )}
                </header>

                {/* Main Content */}
                <main className={styles.main}>
                    <Outlet />
                </main>

                {/* Footer */}
                <footer className={styles.footer}>
                    <div className={styles.footerInner}>
                        <div className={styles.footerBrand}>
                            <div className={styles.footerLogo}>🏥 TClinic</div>
                            <p>Chăm sóc sức khỏe toàn diện</p>
                        </div>
                        <div className={styles.footerLinks}>
                            <div>
                                <h4>Liên hệ</h4>
                                <p>📍 123 Đường ABC, Quận 1, TP.HCM</p>
                                <p>📞 (028) 1234 5678</p>
                                <p>✉️ contact@tclinic.vn</p>
                            </div>
                            <div>
                                <h4>Giờ làm việc</h4>
                                <p>Thứ 2 - Thứ 6: 7:00 - 20:00</p>
                                <p>Thứ 7: 7:00 - 17:00</p>
                                <p>Chủ nhật: Nghỉ</p>
                            </div>
                        </div>
                    </div>
                    <div className={styles.footerBottom}>
                        © 2026 TClinic. All rights reserved.
                    </div>
                </footer>
            </div>
        );
    }
}

export default withRouter(CustomerLayout);