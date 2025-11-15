import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import styles from './Login.module.css';

export default function Login() {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
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

        try {
            const response = await api.post('/api/auth/login', formData);

            console.log('✅ Login success:', response.data);

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // ✅ Phân quyền redirect
            const role = response.data.user.role;

            if (role === 'admin') {
                navigate('/admin');
            } else if (role === 'doctor') {
                navigate('/doctor');
            } else if (role === 'patient') {
                navigate('/');
            } else {
                navigate('/');
            }

        } catch (error) {
            console.error('❌ Login error:', error);
            setError(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
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

                <h1>Đăng nhập</h1>
                <p>Phòng Khám Tclinic</p>

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
                        <label>Email / Tên đăng nhập</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            placeholder="Nhập email hoặc tên đăng nhập"
                            autoFocus
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Mật khẩu</label>
                        <div className={styles.passwordWrapper}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Nhập mật khẩu"
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

                    <button type="submit" disabled={loading}>
                        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>
                        Chưa có tài khoản?
                        <Link to="/register">Đăng ký ngay</Link>
                    </p>
                    <p className={styles.note}>
                        * Admin và Bác sĩ vui lòng liên hệ quản trị viên để được cấp tài khoản
                    </p>
                </div>
            </div>
        </div>
    );
}