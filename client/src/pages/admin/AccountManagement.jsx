import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './AccountManagement.module.css';

const AccountManagement = () => {
    const [accounts, setAccounts] = useState({
        admins: [],
        doctors: [],
        patients: []
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('admins');
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);

            // Fetch admins with password status
            const adminsRes = await api.get('/api/admin/accounts/admins');

            // Fetch doctors with password status  
            const doctorsRes = await api.get('/api/admin/accounts/doctors');

            // Fetch patients with password status
            const patientsRes = await api.get('/api/admin/accounts/patients');

            setAccounts({
                admins: adminsRes.data || [],
                doctors: doctorsRes.data || [],
                patients: patientsRes.data || []
            });
        } catch (error) {
            console.error('Error fetching accounts:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            alert('Lỗi: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    }; const handleResetPassword = (account, type) => {
        setSelectedAccount({ ...account, accountType: type });
        setNewPassword('123456'); // Mật khẩu mặc định
        setShowResetModal(true);
    };

    const confirmResetPassword = async () => {
        try {
            const { accountType, id } = selectedAccount;

            await api.post(`/api/admin/accounts/reset-password`, {
                accountType,
                accountId: id,
                newPassword
            });

            alert('✅ Reset mật khẩu thành công!');
            setShowResetModal(false);
            setSelectedAccount(null);
            setNewPassword('');
        } catch (error) {
            console.error('Error resetting password:', error);
            alert('❌ Lỗi: ' + (error.response?.data?.message || 'Không thể reset mật khẩu'));
        }
    };

    const renderAccountTable = (accountList, type) => {
        if (accountList.length === 0) {
            return <p className={styles.noData}>Không có tài khoản nào</p>;
        }

        return (
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên</th>
                            <th>Email/Username</th>
                            {type === 'doctors' && <th>Chuyên khoa</th>}
                            {type !== 'admins' && <th>Số điện thoại</th>}
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accountList.map(account => (
                            <tr key={account.id}>
                                <td>{account.id}</td>
                                <td>
                                    {type === 'admins' && account.full_name}
                                    {type === 'doctors' && account.full_name}
                                    {type === 'patients' && account.full_name}
                                </td>
                                <td>
                                    <div className={styles.credentials}>
                                        <div>
                                            <strong>
                                                {type === 'admins' ? '👤 ' + account.username : '📧 ' + account.email}
                                            </strong>
                                        </div>
                                        <div className={styles.passwordHint}>
                                            {account.has_default_password ? (
                                                <>
                                                    🔑 Mật khẩu: <code>123456</code>
                                                    <span className={styles.defaultBadge}>Mặc định</span>
                                                </>
                                            ) : (
                                                <>
                                                    🔒 <span className={styles.changedBadge}>Đã đổi mật khẩu</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                {type === 'doctors' && (
                                    <td>{account.Specialty?.name || 'Chưa có'}</td>
                                )}
                                {type !== 'admins' && (
                                    <td>{account.phone || account.phone_number || 'N/A'}</td>
                                )}
                                <td>
                                    <span className={`${styles.badge} ${styles.badgeActive}`}>
                                        Hoạt động
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className={styles.btnReset}
                                        onClick={() => handleResetPassword(account, type)}
                                    >
                                        🔄 Reset mật khẩu
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    if (loading) {
        return <div className={styles.loading}>Đang tải...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>🔐 Quản lý tài khoản</h1>
                <p>Xem và quản lý tài khoản người dùng trong hệ thống</p>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'admins' ? styles.active : ''}`}
                    onClick={() => setActiveTab('admins')}
                >
                    👨‍💼 Admin ({accounts.admins.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'doctors' ? styles.active : ''}`}
                    onClick={() => setActiveTab('doctors')}
                >
                    👨‍⚕️ Bác sĩ ({accounts.doctors.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'patients' ? styles.active : ''}`}
                    onClick={() => setActiveTab('patients')}
                >
                    🧑‍🤝‍🧑 Bệnh nhân ({accounts.patients.length})
                </button>
            </div>

            {/* Content */}
            <div className={styles.content}>
                {activeTab === 'admins' && renderAccountTable(accounts.admins, 'admins')}
                {activeTab === 'doctors' && renderAccountTable(accounts.doctors, 'doctors')}
                {activeTab === 'patients' && renderAccountTable(accounts.patients, 'patients')}
            </div>

            {/* Reset Password Modal */}
            {showResetModal && (
                <div className={styles.modalOverlay} onClick={() => setShowResetModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3>🔄 Reset mật khẩu</h3>
                        <p>
                            Reset mật khẩu cho: <strong>
                                {selectedAccount?.full_name} ({selectedAccount?.email || selectedAccount?.username})
                            </strong>
                        </p>
                        <div className={styles.formGroup}>
                            <label>Mật khẩu mới:</label>
                            <input
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nhập mật khẩu mới"
                            />
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                className={styles.btnCancel}
                                onClick={() => setShowResetModal(false)}
                            >
                                Hủy
                            </button>
                            <button
                                className={styles.btnConfirm}
                                onClick={confirmResetPassword}
                                disabled={!newPassword}
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className={styles.infoBox}>
                <h4>📌 Lưu ý:</h4>
                <ul>
                    <li>Mật khẩu mặc định khi tạo tài khoản: <code>123456</code></li>
                    <li>Admin có username để đăng nhập, bác sĩ và bệnh nhân dùng email</li>
                    <li>Reset mật khẩu sẽ đặt lại về mật khẩu mới (mặc định 123456)</li>
                    <li>Người dùng nên đổi mật khẩu sau lần đăng nhập đầu tiên</li>
                </ul>
            </div>
        </div>
    );
};

export default AccountManagement;
