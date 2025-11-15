import { useEffect, useState } from 'react';
import api from '../../utils/api';
import styles from './PatientList.module.css';

export default function PatientList() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: 'Nam',
        address: '',
        id_number: '',
        insurance_number: '',
        blood_type: '',
        allergies: '',
        medical_history: '',
        emergency_contact: '',
        notes: ''
    });

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await api.get('/api/admin/patients');
            setPatients(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching patients:', error);
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredPatients = patients.filter(patient =>
        patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone?.includes(searchTerm) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = () => {
        setEditingPatient(null);
        setFormData({
            full_name: '',
            email: '',
            phone: '',
            date_of_birth: '',
            gender: 'Nam',
            address: '',
            id_number: '',
            insurance_number: '',
            blood_type: '',
            allergies: '',
            medical_history: '',
            emergency_contact: '',
            notes: ''
        });
        setShowModal(true);
    };

    const handleEdit = (patient) => {
        setEditingPatient(patient);
        setFormData({
            full_name: patient.full_name || '',
            email: patient.email || '',
            phone: patient.phone || '',
            date_of_birth: patient.date_of_birth || '',
            gender: patient.gender || 'Nam',
            address: patient.address || '',
            id_number: patient.id_number || '',
            insurance_number: patient.insurance_number || '',
            blood_type: patient.blood_type || '',
            allergies: patient.allergies || '',
            medical_history: patient.medical_history || '',
            emergency_contact: patient.emergency_contact || '',
            notes: patient.notes || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bệnh nhân này?')) return;

        try {
            await api.delete(`/api/admin/patients/${id}`);
            fetchPatients();
            alert('Xóa bệnh nhân thành công!');
        } catch (error) {
            console.error('Error deleting patient:', error);
            alert('Lỗi khi xóa bệnh nhân!');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingPatient) {
                await api.put(`/api/admin/patients/${editingPatient.id}`, formData);
                alert('Cập nhật bệnh nhân thành công!');
            } else {
                await api.post('/api/admin/patients', formData);
                alert('Thêm bệnh nhân thành công!');
            }
            setShowModal(false);
            fetchPatients();
        } catch (error) {
            console.error('Error saving patient:', error);
            alert(error.response?.data?.message || 'Lỗi khi lưu thông tin bệnh nhân!');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const calculateAge = (dob) => {
        if (!dob) return '—';
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age + ' tuổi';
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Đang tải...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Quản lý Bệnh nhân</h1>
                    <p className={styles.subtitle}>Tổng số: {patients.length} bệnh nhân</p>
                </div>
                <button onClick={handleAdd} className={styles.addBtn}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Thêm bệnh nhân
                </button>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên, SĐT, email..."
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Họ tên</th>
                            <th>Ngày sinh</th>
                            <th>Giới tính</th>
                            <th>Số điện thoại</th>
                            <th>Email</th>
                            <th>Địa chỉ</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPatients.length === 0 ? (
                            <tr>
                                <td colSpan="8" className={styles.empty}>
                                    Không có dữ liệu
                                </td>
                            </tr>
                        ) : (
                            filteredPatients.map(patient => (
                                <tr key={patient.id}>
                                    <td>{patient.id}</td>
                                    <td>
                                        <div className={styles.patientInfo}>
                                            <div className={styles.avatar}>
                                                {patient.full_name?.charAt(0).toUpperCase()}
                                            </div>
                                            <span>{patient.full_name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {patient.date_of_birth
                                            ? new Date(patient.date_of_birth).toLocaleDateString('vi-VN')
                                            : '—'
                                        }
                                        <br />
                                        <small className={styles.age}>{calculateAge(patient.date_of_birth)}</small>
                                    </td>
                                    <td>{patient.gender || '—'}</td>
                                    <td>{patient.phone}</td>
                                    <td>{patient.email || '—'}</td>
                                    <td className={styles.address}>{patient.address || '—'}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                onClick={() => handleEdit(patient)}
                                                className={styles.editBtn}
                                                title="Sửa"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <path d="M11 2H9C4 2 2 4 2 9v6c0 5 2 7 7 7h6c5 0 7-2 7-7v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M16.04 3.02 8.16 10.9c-.3.3-.6.89-.66 1.32l-.43 3.01c-.16 1.09.61 1.85 1.7 1.7l3.01-.43c.42-.06 1.01-.36 1.32-.66l7.88-7.88c1.36-1.36 2-2.94 0-4.94-2-2-3.58-1.36-4.94 0z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(patient.id)}
                                                className={styles.deleteBtn}
                                                title="Xóa"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <path d="M21 5.98c-3.33-.33-6.68-.5-10.02-.5-1.98 0-3.96.1-5.94.3L3 5.98M8.5 4.97l.22-1.31C8.88 2.71 9 2 10.69 2h2.62c1.69 0 1.82.75 1.97 1.67l.22 1.3M18.85 9.14l-.65 10.07C18.09 20.78 18 22 15.21 22H8.79C6 22 5.91 20.78 5.8 19.21L5.15 9.14M10.33 16.5h3.33M9.5 12.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Add/Edit */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{editingPatient ? 'Chỉnh sửa bệnh nhân' : 'Thêm bệnh nhân mới'}</h2>
                            <button onClick={() => setShowModal(false)} className={styles.closeBtn}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Họ tên <span className={styles.required}>*</span></label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Nhập họ tên"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Số điện thoại <span className={styles.required}>*</span></label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        placeholder="0123456789"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="example@email.com"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Ngày sinh</label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Giới tính</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange}>
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                        <option value="Khác">Khác</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Nhóm máu</label>
                                    <select name="blood_type" value={formData.blood_type} onChange={handleChange}>
                                        <option value="">-- Chọn nhóm máu --</option>
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="AB">AB</option>
                                        <option value="O">O</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>CMND/CCCD</label>
                                    <input
                                        type="text"
                                        name="id_number"
                                        value={formData.id_number}
                                        onChange={handleChange}
                                        placeholder="Số CMND/CCCD"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Số BHYT</label>
                                    <input
                                        type="text"
                                        name="insurance_number"
                                        value={formData.insurance_number}
                                        onChange={handleChange}
                                        placeholder="Số bảo hiểm y tế"
                                    />
                                </div>

                                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                    <label>Địa chỉ</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Nhập địa chỉ"
                                    />
                                </div>

                                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                    <label>Liên hệ khẩn cấp</label>
                                    <input
                                        type="text"
                                        name="emergency_contact"
                                        value={formData.emergency_contact}
                                        onChange={handleChange}
                                        placeholder="Tên và SĐT người thân"
                                    />
                                </div>

                                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                    <label>Dị ứng</label>
                                    <textarea
                                        name="allergies"
                                        value={formData.allergies}
                                        onChange={handleChange}
                                        placeholder="VD: Dị ứng thuốc kháng sinh, hải sản..."
                                        rows="2"
                                    />
                                </div>

                                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                    <label>Tiền sử bệnh</label>
                                    <textarea
                                        name="medical_history"
                                        value={formData.medical_history}
                                        onChange={handleChange}
                                        placeholder="VD: Tiểu đường, huyết áp cao..."
                                        rows="2"
                                    />
                                </div>

                                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                    <label>Ghi chú</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        placeholder="Ghi chú khác..."
                                        rows="2"
                                    />
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                                    Hủy
                                </button>
                                <button type="submit" className={styles.submitBtn}>
                                    {editingPatient ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}