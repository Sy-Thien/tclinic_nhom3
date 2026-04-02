import React, { Component } from 'react';
import api from '../../utils/api';
import styles from './DoctorProfile.module.css';

class DoctorProfile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeTab: 'profile',
            doctor: null,
            loading: false,
            error: '',
            successMessage: '',
            profileForm: {
                full_name: '',
                phone: '',
                email: '',
                address: '',
                experience: '',
                bio: '',
                degree: ''
            },
            passwordForm: {
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }
        };
    }

    componentDidMount() {
        this.fetchDoctorProfile();
    }

    fetchDoctorProfile = async () => {
        try {
            this.setState({ loading: true });
            const response = await api.get('/api/doctor/profile');

            if (response.data.success) {
                this.setState({
                    doctor: response.data.data,
                    profileForm: response.data.data
                });
            }
        } catch (err) {
            console.error('Lỗi tải thông tin:', err);
            this.setState({ error: 'Không thể tải thông tin cá nhân' });
        } finally {
            this.setState({ loading: false });
        }
    };

    handleProfileChange = (e) => {
        const { name, value } = e.target;
        this.setState(prevState => ({
            profileForm: { ...prevState.profileForm, [name]: value }
        }));
    };

    handlePasswordChange = (e) => {
        const { name, value } = e.target;
        this.setState(prevState => ({
            passwordForm: { ...prevState.passwordForm, [name]: value }
        }));
    };

    handleUpdateProfile = async (e) => {
        e.preventDefault();
        this.setState({ error: '', successMessage: '' });

        try {
            this.setState({ loading: true });
            const response = await api.put('/api/doctor/profile', this.state.profileForm);

            if (response.data.success) {
                this.setState({
                    doctor: response.data.data,
                    successMessage: '✅ Cập nhật thông tin thành công'
                });
                setTimeout(() => this.setState({ successMessage: '' }), 3000);
            }
        } catch (err) {
            console.error('Lỗi cập nhật:', err);
            this.setState({ error: err.response?.data?.message || 'Lỗi khi cập nhật thông tin' });
        } finally {
            this.setState({ loading: false });
        }
    };

    handleChangePassword = async (e) => {
        e.preventDefault();
        this.setState({ error: '', successMessage: '' });
        const { passwordForm } = this.state;

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            this.setState({ error: 'Mật khẩu xác nhận không khớp' });
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            this.setState({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
            return;
        }

        try {
            this.setState({ loading: true });
            const response = await api.put('/api/doctor/change-password', passwordForm);

            if (response.data.success) {
                this.setState({
                    successMessage: '✅ Đổi mật khẩu thành công',
                    passwordForm: {
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                    }
                });
                setTimeout(() => this.setState({ successMessage: '' }), 3000);
            }
        } catch (err) {
            console.error('Lỗi đổi mật khẩu:', err);
            this.setState({ error: err.response?.data?.message || 'Lỗi khi đổi mật khẩu' });
        } finally {
            this.setState({ loading: false });
        }
    };

    render() {
        const { activeTab, doctor, loading, error, successMessage, profileForm, passwordForm } = this.state;

        if (loading && !doctor) {
            return (
                <div className={styles.container}>
                    <div className={styles.loading}>⏳ Đang tải...</div>
                </div>
            );
        }

        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>👤 Quản Lý Thông Tin Cá Nhân</h1>
                    <p>Cập nhật thông tin và đổi mật khẩu</p>
                </div>

                {error && <div className={styles.alert_error}>{error}</div>}
                {successMessage && <div className={styles.alert_success}>{successMessage}</div>}

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.active : ''}`}
                        onClick={() => this.setState({ activeTab: 'profile' })}
                    >
                        📋 Thông Tin Cá Nhân
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'password' ? styles.active : ''}`}
                        onClick={() => this.setState({ activeTab: 'password' })}
                    >
                        🔐 Đổi Mật Khẩu
                    </button>
                </div>

                {/* TAB 1: THÔNG TIN CÁ NHÂN */}
                {activeTab === 'profile' && (
                    <div className={styles.tabContent}>
                        <form onSubmit={this.handleUpdateProfile} className={styles.form}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Họ Tên</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={profileForm.full_name}
                                        onChange={this.handleProfileChange}
                                        placeholder="Nhập họ tên"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profileForm.email}
                                        onChange={this.handleProfileChange}
                                        placeholder="Nhập email"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Số Điện Thoại</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={profileForm.phone}
                                        onChange={this.handleProfileChange}
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Chứng Chỉ / Bằng Cấp</label>
                                    <input
                                        type="text"
                                        name="degree"
                                        value={profileForm.degree}
                                        onChange={this.handleProfileChange}
                                        placeholder="VD: Thạc sĩ Y học"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Kinh Nghiệm (Năm)</label>
                                    <input
                                        type="number"
                                        name="experience"
                                        value={profileForm.experience}
                                        onChange={this.handleProfileChange}
                                        placeholder="VD: 10"
                                        min="0"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Địa Chỉ</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={profileForm.address}
                                        onChange={this.handleProfileChange}
                                        placeholder="Nhập địa chỉ"
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup_full}>
                                <label>Tiểu Sử Chuyên Nghiệp</label>
                                <textarea
                                    name="bio"
                                    value={profileForm.bio}
                                    onChange={this.handleProfileChange}
                                    placeholder="Mô tả về bạn, chuyên môn, thành tích..."
                                    rows="5"
                                />
                            </div>

                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? '⏳ Đang cập nhật...' : '💾 Cập Nhật Thông Tin'}
                            </button>
                        </form>
                    </div>
                )}

                {/* TAB 2: ĐỔI MẬT KHẨU */}
                {activeTab === 'password' && (
                    <div className={styles.tabContent}>
                        <form onSubmit={this.handleChangePassword} className={styles.form}>
                            <div className={styles.formGrid_single}>
                                <div className={styles.formGroup}>
                                    <label>Mật Khẩu Hiện Tại *</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordForm.currentPassword}
                                        onChange={this.handlePasswordChange}
                                        placeholder="Nhập mật khẩu hiện tại"
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Mật Khẩu Mới *</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordForm.newPassword}
                                        onChange={this.handlePasswordChange}
                                        placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                                        required
                                        minLength="6"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Xác Nhận Mật Khẩu Mới *</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordForm.confirmPassword}
                                        onChange={this.handlePasswordChange}
                                        placeholder="Nhập lại mật khẩu mới"
                                        required
                                        minLength="6"
                                    />
                                </div>
                            </div>

                            <div className={styles.passwordTips}>
                                <h3>💡 Lưu Ý Bảo Mật</h3>
                                <ul>
                                    <li>✅ Mật khẩu phải có ít nhất 6 ký tự</li>
                                    <li>✅ Sử dụng hỗn hợp chữ hoa, chữ thường, số</li>
                                    <li>✅ Không sử dụng thông tin cá nhân (tên, ngày sinh)</li>
                                    <li>✅ Thay đổi mật khẩu định kỳ</li>
                                </ul>
                            </div>

                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? '⏳ Đang xử lý...' : '🔐 Đổi Mật Khẩu'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        );
    }
}

export default DoctorProfile;
