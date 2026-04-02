import React, { Component } from 'react';
import api from '../../utils/api';
import withRouter from '../../utils/withRouter';
import styles from './PatientProfile.module.css';

class PatientProfile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            patient: null,
            loading: true,
            error: '',
            successMessage: '',
            activeTab: 'profile',
            profileForm: {
                full_name: '',
                email: '',
                phone: '',
                gender: 'other',
                birthday: '',
                address: ''
            },
            passwordForm: {
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }
        };
    }

    componentDidMount() {
        const { navigate } = this.props;

        // ✅ Auto-redirect if role changes (inline useStorageSync)
        this.handleStorageChange = (e) => {
            if (e.key !== 'user' && e.key !== 'token' && e.key !== null) return;
            console.log('🔄 Storage changed in another tab:', e.key);
            const userStr = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            if (!userStr || !token) {
                window.location.href = '/login';
                return;
            }
            try {
                const user = JSON.parse(userStr);
                if (user.role !== 'patient') {
                    if (user.role === 'admin') window.location.href = '/admin';
                    else if (user.role === 'doctor') window.location.href = '/doctor-portal';
                    else window.location.href = '/login';
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                window.location.href = '/login';
            }
        };
        window.addEventListener('storage', this.handleStorageChange);

        // ✅ Check role before fetching
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            navigate('/login');
            return;
        }

        const user = JSON.parse(userStr);
        if (user.role !== 'patient') {
            navigate('/');
            return;
        }

        this.fetchPatientProfile();
    }

    componentWillUnmount() {
        window.removeEventListener('storage', this.handleStorageChange);
    }

    fetchPatientProfile = async () => {
        try {
            this.setState({ loading: true });
            const response = await api.get('/api/patient/profile');

            if (response.data.success) {
                const data = response.data.data;
                this.setState({
                    patient: data,
                    profileForm: {
                        full_name: data.full_name || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        gender: data.gender || 'other',
                        birthday: data.birthday || '',
                        address: data.address || ''
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            this.setState({ error: 'Không thể tải thông tin cá nhân' });
        } finally {
            this.setState({ loading: false });
        }
    };

    handleProfileChange = (e) => {
        const { name, value } = e.target;
        this.setState(prev => ({
            profileForm: { ...prev.profileForm, [name]: value }
        }));
    };

    handlePasswordChange = (e) => {
        const { name, value } = e.target;
        this.setState(prev => ({
            passwordForm: { ...prev.passwordForm, [name]: value }
        }));
    };

    handleUpdateProfile = async (e) => {
        e.preventDefault();
        const { profileForm } = this.state;
        if (!profileForm.full_name || !profileForm.phone) {
            this.setState({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
            return;
        }

        try {
            this.setState({ loading: true, error: '' });
            const response = await api.put('/api/patient/profile', profileForm);

            if (response.data.success) {
                this.setState({ successMessage: response.data.message, patient: response.data.data });
                setTimeout(() => this.setState({ successMessage: '' }), 3000);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.setState({ error: error.response?.data?.message || 'Lỗi khi cập nhật thông tin' });
        } finally {
            this.setState({ loading: false });
        }
    };

    handleChangePassword = async (e) => {
        e.preventDefault();
        const { passwordForm } = this.state;

        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            this.setState({ error: 'Vui lòng điền đầy đủ thông tin' });
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            this.setState({ error: 'Mật khẩu xác nhận không khớp' });
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            this.setState({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
            return;
        }

        try {
            this.setState({ loading: true, error: '' });
            const response = await api.put('/api/patient/profile/change-password', passwordForm);

            if (response.data.success) {
                this.setState({
                    successMessage: response.data.message,
                    passwordForm: { currentPassword: '', newPassword: '', confirmPassword: '' }
                });
                setTimeout(() => this.setState({ successMessage: '' }), 3000);
            }
        } catch (error) {
            console.error('Error changing password:', error);
            this.setState({ error: error.response?.data?.message || 'Lỗi khi đổi mật khẩu' });
        } finally {
            this.setState({ loading: false });
        }
    };

    render() {
        const { patient, loading, error, successMessage, activeTab, profileForm, passwordForm } = this.state;

        if (loading && !patient) {
            return (
                <div className={styles.container}>
                    <div className={styles.loading}>⏳ Đang tải...</div>
                </div>
            );
        }

        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>👤 Thông Tin Cá Nhân</h1>
                </div>

                {error && <div className={styles.alert} style={{ backgroundColor: '#fee' }}>{error}</div>}
                {successMessage && <div className={styles.alert} style={{ backgroundColor: '#efe' }}>{successMessage}</div>}

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.active : ''}`}
                        onClick={() => this.setState({ activeTab: 'profile' })}
                    >
                        ℹ️ Thông Tin Cá Nhân
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'password' ? styles.active : ''}`}
                        onClick={() => this.setState({ activeTab: 'password' })}
                    >
                        🔐 Đổi Mật Khẩu
                    </button>
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <form onSubmit={this.handleUpdateProfile} className={styles.form}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>Họ tên <span>*</span></label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={profileForm.full_name}
                                    onChange={this.handleProfileChange}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={profileForm.email}
                                    onChange={this.handleProfileChange}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Số điện thoại <span>*</span></label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profileForm.phone}
                                    onChange={this.handleProfileChange}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Giới tính</label>
                                <select name="gender" value={profileForm.gender} onChange={this.handleProfileChange}>
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                    <option value="other">Khác</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Ngày sinh</label>
                                <input
                                    type="date"
                                    name="birthday"
                                    value={profileForm.birthday}
                                    onChange={this.handleProfileChange}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Địa chỉ</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={profileForm.address}
                                    onChange={this.handleProfileChange}
                                    placeholder="VD: 123 Phố Huế, Hoàn Kiếm, Hà Nội"
                                />
                            </div>
                        </div>

                        <div className={styles.formFooter}>
                            <button type="submit" className={styles.btnSubmit} disabled={loading}>
                                {loading ? '⏳ Đang cập nhật...' : '💾 Lưu Thay Đổi'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                    <form onSubmit={this.handleChangePassword} className={styles.form}>
                        <div className={styles.formGroup} style={{ maxWidth: '400px' }}>
                            <label>Mật khẩu hiện tại <span>*</span></label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={passwordForm.currentPassword}
                                onChange={this.handlePasswordChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup} style={{ maxWidth: '400px' }}>
                            <label>Mật khẩu mới <span>*</span></label>
                            <input
                                type="password"
                                name="newPassword"
                                value={passwordForm.newPassword}
                                onChange={this.handlePasswordChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup} style={{ maxWidth: '400px' }}>
                            <label>Xác nhận mật khẩu <span>*</span></label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwordForm.confirmPassword}
                                onChange={this.handlePasswordChange}
                                required
                            />
                        </div>

                        <div className={styles.passwordTips}>
                            <strong>💡 Gợi ý:</strong>
                            <ul>
                                <li>Mật khẩu phải có ít nhất 6 ký tự</li>
                                <li>Sử dụng chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                                <li>Không sử dụng mật khẩu có thể đoán dễ dàng</li>
                            </ul>
                        </div>

                        <div className={styles.formFooter}>
                            <button type="submit" className={styles.btnSubmit} disabled={loading}>
                                {loading ? '⏳ Đang đổi...' : '🔒 Đổi Mật Khẩu'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        );
    }
}

export default withRouter(PatientProfile);
