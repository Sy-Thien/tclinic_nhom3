import { useState, useEffect } from 'react';
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

    // ✅ Check nếu đã đăng nhập → redirect về trang phù hợp
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            try {
                const user = JSON.parse(userData);
                const role = user.role;

                console.log('🔄 Already logged in, redirecting...', role);

                if (role === 'admin') {
                    navigate('/admin', { replace: true });
                } else if (role === 'doctor') {
                    navigate('/doctor-portal', { replace: true });
                } else {
                    navigate('/', { replace: true });
                }
            } catch (error) {
                console.error('❌ Parse user error:', error);
                localStorage.clear();
            }
        }
    }, [navigate]);

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
                navigate('/doctor-portal');
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
                    <img src="/logo.png" alt="TClinic Logo" />
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