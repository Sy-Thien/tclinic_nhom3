import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useStorageSync } from '../../hooks/useStorageSync';
import styles from './PatientProfile.module.css';

export default function PatientProfile() {
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [activeTab, setActiveTab] = useState('profile');

    // ✅ Auto-redirect if role changes
    useStorageSync('patient');

    const [profileForm, setProfileForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        gender: 'other',
        birthday: '',
        address: ''
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
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

        fetchPatientProfile();
    }, [navigate]);

    const fetchPatientProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/patient-profile/profile');

            if (response.data.success) {
                const data = response.data.data;
                setPatient(data);

                // ✅ Convert null values to empty strings
                setProfileForm({
                    full_name: data.full_name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    gender: data.gender || 'other',
                    birthday: data.birthday || '',
                    address: data.address || ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
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
        if (!profileForm.full_name || !profileForm.phone) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const response = await api.put('/api/patient-profile/profile', profileForm);

            if (response.data.success) {
                setSuccessMessage(response.data.message);
                setPatient(response.data.data);
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setError(error.response?.data?.message || 'Lỗi khi cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

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
            setError('');
            const response = await api.put('/api/patient-profile/change-password', passwordForm);

            if (response.data.success) {
                setSuccessMessage(response.data.message);
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error changing password:', error);
            setError(error.response?.data?.message || 'Lỗi khi đổi mật khẩu');
        } finally {
            setLoading(false);
        }
    };

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
                    onClick={() => setActiveTab('profile')}
                >
                    ℹ️ Thông Tin Cá Nhân
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'password' ? styles.active : ''}`}
                    onClick={() => setActiveTab('password')}
                >
                    🔐 Đổi Mật Khẩu
                </button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <form onSubmit={handleUpdateProfile} className={styles.form}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Họ tên <span>*</span></label>
                            <input
                                type="text"
                                name="full_name"
                                value={profileForm.full_name}
                                onChange={handleProfileChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={profileForm.email}
                                onChange={handleProfileChange}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Số điện thoại <span>*</span></label>
                            <input
                                type="tel"
                                name="phone"
                                value={profileForm.phone}
                                onChange={handleProfileChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Giới tính</label>
                            <select name="gender" value={profileForm.gender} onChange={handleProfileChange}>
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
                                onChange={handleProfileChange}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Địa chỉ</label>
                            <input
                                type="text"
                                name="address"
                                value={profileForm.address}
                                onChange={handleProfileChange}
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
                <form onSubmit={handleChangePassword} className={styles.form}>
                    <div className={styles.formGroup} style={{ maxWidth: '400px' }}>
                        <label>Mật khẩu hiện tại <span>*</span></label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup} style={{ maxWidth: '400px' }}>
                        <label>Mật khẩu mới <span>*</span></label>
                        <input
                            type="password"
                            name="newPassword"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup} style={{ maxWidth: '400px' }}>
                        <label>Xác nhận mật khẩu <span>*</span></label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordChange}
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
