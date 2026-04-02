import React, { Component } from 'react';
import withRouter from '../../utils/withRouter';
import api from '../../utils/api';
import styles from './ChangePassword.module.css';

class ChangePassword extends Component {
    constructor(props) {
        super(props);
        this.state = {
            formData: {
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            },
            loading: false,
            error: '',
            success: ''
        };
    }

    handleChange = (e) => {
        this.setState({
            formData: {
                ...this.state.formData,
                [e.target.name]: e.target.value
            },
            error: ''
        });
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        const { formData } = this.state;
        const { navigate } = this.props;

        this.setState({ error: '', success: '' });

        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            this.setState({ error: 'Vui lòng điền đầy đủ thông tin' });
            return;
        }

        if (formData.newPassword.length < 6) {
            this.setState({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            this.setState({ error: 'Mật khẩu xác nhận không khớp' });
            return;
        }

        if (formData.currentPassword === formData.newPassword) {
            this.setState({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
            return;
        }

        try {
            this.setState({ loading: true });

            await api.post('/api/auth/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            this.setState({
                success: '✅ Đổi mật khẩu thành công!',
                formData: {
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }
            });

            this.redirectTimer = setTimeout(() => {
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
            this.setState({ error: error.response?.data?.message || 'Lỗi khi đổi mật khẩu' });
        } finally {
            this.setState({ loading: false });
        }
    };

    componentWillUnmount() {
        if (this.redirectTimer) {
            clearTimeout(this.redirectTimer);
        }
    }

    render() {
        const { formData, loading, error, success } = this.state;
        const { navigate } = this.props;

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

                    <form onSubmit={this.handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Mật khẩu hiện tại <span className={styles.required}>*</span></label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={this.handleChange}
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
                                onChange={this.handleChange}
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
                                onChange={this.handleChange}
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
    }
}

export default withRouter(ChangePassword);
