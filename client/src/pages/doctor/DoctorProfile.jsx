import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './DoctorProfile.module.css';

const DoctorProfile = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        full_name: '',
        phone: '',
        email: '',
        address: '',
        experience: '',
        bio: '',
        degree: ''
    });

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchDoctorProfile();
    }, []);

    const fetchDoctorProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/doctor/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setDoctor(response.data.data);
                setProfileForm(response.data.data);
            }
        } catch (err) {
            console.error('Lỗi tải thông tin:', err);
            setError('Không thể tải thông tin cá nhân');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.put('/api/doctor/profile', profileForm, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setDoctor(response.data.data);
                setSuccessMessage('✅ Cập nhật thông tin thành công');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            console.error('Lỗi cập nhật:', err);
            setError(err.response?.data?.message || 'Lỗi khi cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.put('/api/doctor/change-password', passwordForm, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setSuccessMessage('✅ Đổi mật khẩu thành công');
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            console.error('Lỗi đổi mật khẩu:', err);
            setError(err.response?.data?.message || 'Lỗi khi đổi mật khẩu');
        } finally {
            setLoading(false);
        }
    };

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
                    onClick={() => setActiveTab('profile')}
                >
                    📋 Thông Tin Cá Nhân
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'password' ? styles.active : ''}`}
                    onClick={() => setActiveTab('password')}
                >
                    🔐 Đổi Mật Khẩu
                </button>
            </div>

            {/* TAB 1: THÔNG TIN CÁ NHÂN */}
            {activeTab === 'profile' && (
                <div className={styles.tabContent}>
                    <form onSubmit={handleUpdateProfile} className={styles.form}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>Họ Tên</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={profileForm.full_name}
                                    onChange={handleProfileChange}
                                    placeholder="Nhập họ tên"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={profileForm.email}
                                    onChange={handleProfileChange}
                                    placeholder="Nhập email"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Số Điện Thoại</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profileForm.phone}
                                    onChange={handleProfileChange}
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Chứng Chỉ / Bằng Cấp</label>
                                <input
                                    type="text"
                                    name="degree"
                                    value={profileForm.degree}
                                    onChange={handleProfileChange}
                                    placeholder="VD: Thạc sĩ Y học"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Kinh Nghiệm (Năm)</label>
                                <input
                                    type="number"
                                    name="experience"
                                    value={profileForm.experience}
                                    onChange={handleProfileChange}
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
                                    onChange={handleProfileChange}
                                    placeholder="Nhập địa chỉ"
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup_full}>
                            <label>Tiểu Sử Chuyên Nghiệp</label>
                            <textarea
                                name="bio"
                                value={profileForm.bio}
                                onChange={handleProfileChange}
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
                    <form onSubmit={handleChangePassword} className={styles.form}>
                        <div className={styles.formGrid_single}>
                            <div className={styles.formGroup}>
                                <label>Mật Khẩu Hiện Tại *</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwordForm.currentPassword}
                                    onChange={handlePasswordChange}
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
                                    onChange={handlePasswordChange}
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
                                    onChange={handlePasswordChange}
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
};

export default DoctorProfile;
