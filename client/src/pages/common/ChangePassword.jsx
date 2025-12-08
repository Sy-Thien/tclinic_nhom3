import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './ChangePassword.module.css';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (formData.currentPassword === formData.newPassword) {
            setError('Mật khẩu mới phải khác mật khẩu hiện tại');
            return;
        }

        try {
            setLoading(true);

            await api.post('/api/auth/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            setSuccess('✅ Đổi mật khẩu thành công!');

            // Clear form
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            // Redirect after 2 seconds
            setTimeout(() => {
                const user = JSON.parse(localStorage.getItem('user'));
                if (user?.role === 'admin') {
                    navigate('/admin/dashboard');
                } else if (user?.role === 'doctor') {
                    navigate('/doctor-portal');
                } else {
                    navigate('/dashboard');
                }
            }, 2000);
        } catch (error) {
            console.error('Error changing password:', error);
            setError(error.response?.data?.message || 'Lỗi khi đổi mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h2>🔐 Đổi mật khẩu</h2>
                    <p>Vui lòng nhập mật khẩu hiện tại và mật khẩu mới</p>
                </div>

                {error && (
                    <div className={styles.errorAlert}>
                        ❌ {error}
                    </div>
                )}

                {success && (
                    <div className={styles.successAlert}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Mật khẩu hiện tại <span className={styles.required}>*</span></label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            placeholder="Nhập mật khẩu hiện tại"
                            disabled={loading}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Mật khẩu mới <span className={styles.required}>*</span></label>
                        <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                            disabled={loading}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Xác nhận mật khẩu mới <span className={styles.required}>*</span></label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Nhập lại mật khẩu mới"
                            disabled={loading}
                        />
                    </div>

                    <div className={styles.buttonGroup}>
                        <button
                            type="button"
                            className={styles.btnCancel}
                            onClick={() => navigate(-1)}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={styles.btnSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                        </button>
                    </div>
                </form>

                <div className={styles.infoBox}>
                    <h4>📌 Lưu ý:</h4>
                    <ul>
                        <li>Mật khẩu mới phải có ít nhất 6 ký tự</li>
                        <li>Mật khẩu mới phải khác mật khẩu hiện tại</li>
                        <li>Sau khi đổi mật khẩu, bạn sẽ được chuyển về trang chủ</li>
                        <li>Nên sử dụng mật khẩu mạnh kết hợp chữ, số và ký tự đặc biệt</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
