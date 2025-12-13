import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './AdminPatients.module.css';

export default function AdminPatients() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Modals
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
    const [showEditRecordModal, setShowEditRecordModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientHistory, setPatientHistory] = useState([]);
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [activeTab, setActiveTab] = useState('info'); // 'info', 'bookings', 'records'

    // Form data for edit
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        gender: 'male',
        birthday: '',
        address: ''
    });

    // Form data for edit medical record
    const [recordFormData, setRecordFormData] = useState({
        symptoms: '',
        diagnosis: '',
        conclusion: '',
        note: ''
    });

    // Lấy danh sách bệnh nhân
    const fetchPatients = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (searchTerm) params.append('search', searchTerm);
            if (filterStatus !== 'all') params.append('status', filterStatus);

            const response = await api.get(`/api/admin/patients?${params}`);
            setPatients(response.data);
        } catch (error) {
            console.error('Error fetching patients:', error);
            alert('Lỗi khi tải danh sách bệnh nhân');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [searchTerm, filterStatus]);

    // Lấy lịch sử khám của bệnh nhân
    const fetchPatientHistory = async (patientId) => {
        try {
            const response = await api.get(`/api/admin/patients/${patientId}/history`);
            setPatientHistory(response.data);
        } catch (error) {
            console.error('Error fetching patient history:', error);
            alert('Lỗi khi tải lịch sử khám');
        }
    };

    // Lấy hồ sơ bệnh án chi tiết
    const fetchMedicalRecords = async (patientId) => {
        try {
            const response = await api.get(`/api/admin/patients/${patientId}/medical-records`);
            if (response.data.success) {
                setMedicalRecords(response.data.medicalRecords || []);
            }
        } catch (error) {
            console.error('Error fetching medical records:', error);
            alert('Lỗi khi tải hồ sơ bệnh án');
        }
    };

    // Xem chi tiết bệnh nhân
    const handleViewDetail = async (patient) => {
        setSelectedPatient(patient);
        setActiveTab('info');
        await Promise.all([
            fetchPatientHistory(patient.id),
            fetchMedicalRecords(patient.id)
        ]);
        setShowDetailModal(true);
    };

    // Mở modal chỉnh sửa
    const handleEdit = (patient) => {
        setSelectedPatient(patient);
        setFormData({
            full_name: patient.full_name || '',
            email: patient.email || '',
            phone: patient.phone || '',
            gender: patient.gender || 'male',
            birthday: patient.birthday || '',
            address: patient.address || ''
        });
        setShowEditModal(true);
    };

    // Cập nhật bệnh nhân
    const handleUpdatePatient = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/admin/patients/${selectedPatient.id}`, formData);

            alert('Cập nhật thông tin bệnh nhân thành công');
            setShowEditModal(false);
            fetchPatients();
        } catch (error) {
            console.error('Error updating patient:', error);
            alert(error.response?.data?.message || 'Lỗi khi cập nhật bệnh nhân');
        }
    };

    // Mở modal chỉnh sửa hồ sơ bệnh án
    const handleEditRecord = (record) => {
        setSelectedRecord(record);
        setRecordFormData({
            symptoms: record.symptoms || '',
            diagnosis: record.diagnosis || '',
            conclusion: record.conclusion || '',
            note: record.note || ''
        });
        setShowEditRecordModal(true);
    };

    // Cập nhật hồ sơ bệnh án
    const handleUpdateRecord = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/admin/medical-records/${selectedRecord.id}`, recordFormData);

            alert('Cập nhật hồ sơ bệnh án thành công');
            setShowEditRecordModal(false);
            // Refresh medical records
            await fetchMedicalRecords(selectedPatient.id);
        } catch (error) {
            console.error('Error updating medical record:', error);
            alert(error.response?.data?.message || 'Lỗi khi cập nhật hồ sơ bệnh án');
        }
    };

    // Xóa bệnh nhân
    const handleDelete = (patient) => {
        setSelectedPatient(patient);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/api/admin/patients/${selectedPatient.id}`);

            alert('Xóa bệnh nhân thành công');
            setShowDeleteModal(false);
            fetchPatients();
        } catch (error) {
            console.error('Error deleting patient:', error);
            alert(error.response?.data?.message || 'Lỗi khi xóa bệnh nhân');
        }
    };

    // Toggle trạng thái
    const handleToggleStatus = async (patient) => {
        try {
            await api.put(`/api/admin/patients/${patient.id}/toggle-status`);

            alert(`${patient.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'} tài khoản thành công`);
            fetchPatients();
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Lỗi khi thay đổi trạng thái bệnh nhân');
        }
    };

    // Format ngày
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    // Format giờ
    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        return timeString.substring(0, 5);
    };

    // Render status badge
    const renderStatusBadge = (status) => {
        const statusMap = {
            pending: { text: 'Chờ xác nhận', class: styles.statusPending },
            confirmed: { text: 'Đã xác nhận', class: styles.statusConfirmed },
            completed: { text: 'Hoàn thành', class: styles.statusCompleted },
            cancelled: { text: 'Đã hủy', class: styles.statusCancelled }
        };

        const statusInfo = statusMap[status] || { text: status, class: '' };
        return <span className={`${styles.statusBadge} ${statusInfo.class}`}>{statusInfo.text}</span>;
    };

    if (loading) {
        return <div className={styles.loading}>Đang tải dữ liệu...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Quản lý bệnh nhân</h1>
                <p>Xem thông tin, lịch sử khám và cập nhật hồ sơ bệnh nhân</p>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <input
                    type="text"
                    placeholder="Tìm theo tên, số điện thoại, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={styles.filterSelect}
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Đã khóa</option>
                </select>
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Họ và tên</th>
                            <th>Số điện thoại</th>
                            <th>Email</th>
                            <th>Giới tính</th>
                            <th>Ngày sinh</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patients.length === 0 ? (
                            <tr>
                                <td colSpan="8" className={styles.noData}>
                                    Không có dữ liệu
                                </td>
                            </tr>
                        ) : (
                            patients.map((patient) => (
                                <tr key={patient.id}>
                                    <td>{patient.id}</td>
                                    <td>{patient.full_name}</td>
                                    <td>{patient.phone}</td>
                                    <td>{patient.email || 'N/A'}</td>
                                    <td>
                                        {patient.gender === 'male'
                                            ? 'Nam'
                                            : patient.gender === 'female'
                                                ? 'Nữ'
                                                : 'Khác'}
                                    </td>
                                    <td>{patient.birthday || 'N/A'}</td>
                                    <td>
                                        <span
                                            className={`${styles.statusBadge} ${patient.is_active ? styles.statusActive : styles.statusInactive
                                                }`}
                                        >
                                            {patient.is_active ? 'Hoạt động' : 'Đã khóa'}
                                        </span>
                                    </td>
                                    <td className={styles.actions}>
                                        <button
                                            onClick={() => handleViewDetail(patient)}
                                            className={styles.btnView}
                                            title="Xem chi tiết"
                                        >
                                            Xem
                                        </button>
                                        <button
                                            onClick={() => handleEdit(patient)}
                                            className={styles.btnEdit}
                                            title="Chỉnh sửa"
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(patient)}
                                            className={styles.btnToggle}
                                            title={patient.is_active ? 'Khóa tài khoản' : 'Kích hoạt'}
                                        >
                                            {patient.is_active ? 'Khóa' : 'Mở'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(patient)}
                                            className={styles.btnDelete}
                                            title="Xóa"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedPatient && (
                <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Hồ sơ bệnh nhân - {selectedPatient.full_name}</h2>
                            <button onClick={() => setShowDetailModal(false)} className={styles.closeBtn}>
                                ✕
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className={styles.tabContainer}>
                            <button
                                className={`${styles.tabBtn} ${activeTab === 'info' ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab('info')}
                            >
                                📋 Thông tin cá nhân
                            </button>
                            <button
                                className={`${styles.tabBtn} ${activeTab === 'bookings' ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab('bookings')}
                            >
                                📅 Lịch sử đặt khám ({patientHistory.length})
                            </button>
                            <button
                                className={`${styles.tabBtn} ${activeTab === 'records' ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab('records')}
                            >
                                🏥 Hồ sơ bệnh án ({medicalRecords.length})
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className={styles.tabContent}>
                            {/* Info Tab */}
                            {activeTab === 'info' && (
                                <div className={styles.patientInfo}>
                                    <div className={styles.infoGrid}>
                                        <div className={styles.infoItem}>
                                            <strong>Họ và tên:</strong>
                                            <span>{selectedPatient.full_name}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <strong>Số điện thoại:</strong>
                                            <span>{selectedPatient.phone}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <strong>Email:</strong>
                                            <span>{selectedPatient.email || 'N/A'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <strong>Giới tính:</strong>
                                            <span>
                                                {selectedPatient.gender === 'male'
                                                    ? 'Nam'
                                                    : selectedPatient.gender === 'female'
                                                        ? 'Nữ'
                                                        : 'Khác'}
                                            </span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <strong>Ngày sinh:</strong>
                                            <span>{selectedPatient.birthday || 'N/A'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <strong>Địa chỉ:</strong>
                                            <span>{selectedPatient.address || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bookings Tab */}
                            {activeTab === 'bookings' && (
                                <div className={styles.patientHistory}>
                                    {patientHistory.length === 0 ? (
                                        <p className={styles.noHistory}>Chưa có lịch sử đặt khám</p>
                                    ) : (
                                        <div className={styles.historyTable}>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Mã</th>
                                                        <th>Ngày</th>
                                                        <th>Giờ</th>
                                                        <th>Chuyên khoa</th>
                                                        <th>Bác sĩ</th>
                                                        <th>Triệu chứng</th>
                                                        <th>Trạng thái</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {patientHistory.map((booking) => (
                                                        <tr key={booking.id}>
                                                            <td>{booking.booking_code}</td>
                                                            <td>{formatDate(booking.appointment_date)}</td>
                                                            <td>{formatTime(booking.appointment_time)}</td>
                                                            <td>{booking.specialty?.name || 'N/A'}</td>
                                                            <td>{booking.doctor?.full_name || 'Chưa có'}</td>
                                                            <td className={styles.symptoms}>
                                                                {booking.symptoms || 'N/A'}
                                                            </td>
                                                            <td>{renderStatusBadge(booking.status)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Medical Records Tab */}
                            {activeTab === 'records' && (
                                <div className={styles.medicalRecords}>
                                    {medicalRecords.length === 0 ? (
                                        <p className={styles.noHistory}>Chưa có hồ sơ bệnh án</p>
                                    ) : (
                                        <div className={styles.recordsList}>
                                            {medicalRecords.map((record) => (
                                                <div key={record.id} className={styles.recordCard}>
                                                    <div className={styles.recordHeader}>
                                                        <div className={styles.recordDate}>
                                                            <span className={styles.recordIcon}>📅</span>
                                                            {formatDate(record.visit_date)} - {formatTime(record.visit_time)}
                                                        </div>
                                                        <div className={styles.recordDoctor}>
                                                            <span className={styles.recordIcon}>👨‍⚕️</span>
                                                            BS. {record.doctor?.full_name || 'N/A'}
                                                            {record.doctor?.specialty?.name && (
                                                                <span className={styles.specialtyTag}>
                                                                    {record.doctor.specialty.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            className={styles.btnEditRecord}
                                                            onClick={() => handleEditRecord(record)}
                                                            title="Chỉnh sửa"
                                                        >
                                                            Sửa
                                                        </button>
                                                    </div>

                                                    <div className={styles.recordBody}>
                                                        <div className={styles.recordSection}>
                                                            <label>Triệu chứng:</label>
                                                            <p>{record.symptoms || 'Chưa có'}</p>
                                                        </div>
                                                        <div className={styles.recordSection}>
                                                            <label>Chẩn đoán:</label>
                                                            <p>{record.diagnosis || 'Chưa có'}</p>
                                                        </div>
                                                        <div className={styles.recordSection}>
                                                            <label>Kết luận:</label>
                                                            <p>{record.conclusion || 'Chưa có'}</p>
                                                        </div>
                                                        {record.note && (
                                                            <div className={styles.recordSection}>
                                                                <label>Ghi chú:</label>
                                                                <p>{record.note}</p>
                                                            </div>
                                                        )}

                                                        {/* Prescription */}
                                                        {record.prescription && record.prescription.details?.length > 0 && (
                                                            <div className={styles.prescriptionSection}>
                                                                <label>💊 Đơn thuốc:</label>
                                                                <table className={styles.prescriptionTable}>
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Thuốc</th>
                                                                            <th>SL</th>
                                                                            <th>Đơn vị</th>
                                                                            <th>Cách dùng</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {record.prescription.details.map((detail, idx) => (
                                                                            <tr key={idx}>
                                                                                <td>{detail.drug?.name || 'N/A'}</td>
                                                                                <td>{detail.quantity}</td>
                                                                                <td>{detail.drug?.unit || 'N/A'}</td>
                                                                                <td>{detail.dosage}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Chỉnh sửa thông tin bệnh nhân</h2>
                            <button onClick={() => setShowEditModal(false)} className={styles.closeBtn}>
                                Đóng
                            </button>
                        </div>

                        <form onSubmit={handleUpdatePatient} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Họ và tên *</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Số điện thoại *</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Giới tính</label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="male">Nam</option>
                                        <option value="female">Nữ</option>
                                        <option value="other">Khác</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Ngày sinh</label>
                                    <input
                                        type="date"
                                        value={formData.birthday}
                                        onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Địa chỉ</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows="3"
                                />
                            </div>

                            <div className={styles.formActions}>
                                <button type="button" onClick={() => setShowEditModal(false)} className={styles.btnCancel}>
                                    Hủy
                                </button>
                                <button type="submit" className={styles.btnSubmit}>
                                    Cập nhật
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedPatient && (
                <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Xác nhận xóa</h2>
                            <button onClick={() => setShowDeleteModal(false)} className={styles.closeBtn}>
                                Đóng
                            </button>
                        </div>

                        <div className={styles.deleteConfirm}>
                            <p>Bạn có chắc chắn muốn xóa bệnh nhân:</p>
                            <p className={styles.patientName}>{selectedPatient.full_name}</p>
                            <p className={styles.warning}>Cảnh báo: Không thể khôi phục sau khi xóa!</p>
                        </div>

                        <div className={styles.formActions}>
                            <button onClick={() => setShowDeleteModal(false)} className={styles.btnCancel}>
                                Hủy
                            </button>
                            <button onClick={confirmDelete} className={styles.btnDelete}>
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Medical Record Modal */}
            {showEditRecordModal && selectedRecord && (
                <div className={styles.modalOverlay} onClick={() => setShowEditRecordModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Chỉnh sửa hồ sơ bệnh án</h2>
                            <button onClick={() => setShowEditRecordModal(false)} className={styles.closeBtn}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpdateRecord} className={styles.form}>
                            <div className={styles.recordInfo}>
                                <p>
                                    <strong>Ngày khám:</strong> {formatDate(selectedRecord.visit_date)} - {formatTime(selectedRecord.visit_time)}
                                </p>
                                <p>
                                    <strong>Bác sĩ:</strong> BS. {selectedRecord.doctor?.full_name || 'N/A'}
                                </p>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Triệu chứng</label>
                                <textarea
                                    value={recordFormData.symptoms}
                                    onChange={(e) => setRecordFormData({ ...recordFormData, symptoms: e.target.value })}
                                    rows="3"
                                    placeholder="Mô tả triệu chứng của bệnh nhân..."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Chẩn đoán</label>
                                <textarea
                                    value={recordFormData.diagnosis}
                                    onChange={(e) => setRecordFormData({ ...recordFormData, diagnosis: e.target.value })}
                                    rows="3"
                                    placeholder="Chẩn đoán bệnh..."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Kết luận</label>
                                <textarea
                                    value={recordFormData.conclusion}
                                    onChange={(e) => setRecordFormData({ ...recordFormData, conclusion: e.target.value })}
                                    rows="3"
                                    placeholder="Kết luận sau khám..."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Ghi chú</label>
                                <textarea
                                    value={recordFormData.note}
                                    onChange={(e) => setRecordFormData({ ...recordFormData, note: e.target.value })}
                                    rows="2"
                                    placeholder="Ghi chú thêm (nếu có)..."
                                />
                            </div>

                            <div className={styles.formActions}>
                                <button type="button" onClick={() => setShowEditRecordModal(false)} className={styles.btnCancel}>
                                    Hủy
                                </button>
                                <button type="submit" className={styles.btnSubmit}>
                                    Cập nhật
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
