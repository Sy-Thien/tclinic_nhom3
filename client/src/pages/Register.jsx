import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import styles from './Login.module.css';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/api/auth/register', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            });

            console.log('✅ Register success:', response.data);

            // Tự động đăng nhập
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // Redirect về trang đặt lịch
            navigate('/booking');

        } catch (error) {
            console.error('❌ Register error:', error);
            setError(error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={`${styles.loginBox} ${error ? styles.error : ''}`}>
                <div className={styles.logo}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"
                            fill="currentColor"
                        />
                    </svg>
                </div>

                <h1>Đăng ký tài khoản</h1>
                <p>Phòng Khám Tclinic - Tạo tài khoản mới</p>

                {error && (
                    <div className={styles.errorBox}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                                fill="currentColor"
                            />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label>Họ và tên *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Nguyễn Văn A"
                            autoFocus
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Email *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="example@email.com"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Số điện thoại *</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            placeholder="0123456789"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Mật khẩu *</label>
                        <div className={styles.passwordWrapper}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Tối thiểu 6 ký tự"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className={styles.togglePassword}
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Xác nhận mật khẩu *</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="Nhập lại mật khẩu"
                            autoComplete="new-password"
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Đang xử lý...' : 'Đăng ký'}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>
                        Đã có tài khoản?
                        <Link to="/login">Đăng nhập ngay</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}