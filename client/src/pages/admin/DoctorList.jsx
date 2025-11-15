import { useEffect, useState } from 'react';
import api from '../../utils/api';
import styles from './DoctorList.module.css';

export default function DoctorList() {
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        specialty: '',
        gender: 'Nam',
        address: '',
        experience: '',
        qualification: ''
    });

    useEffect(() => {
        fetchDoctors();
        fetchSpecialties();
    }, []);

    const fetchDoctors = async () => {
        try {
            const response = await api.get('/api/admin/doctors');
            console.log('✅ Doctors:', response.data); // Debug
            setDoctors(response.data);
            setLoading(false);
        } catch (error) {
            console.error('❌ Error fetching doctors:', error);
            setLoading(false);
        }
    };

    const fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/admin/specialties');
            console.log('✅ Specialties:', response.data); // ✅ Debug: Xem dữ liệu
            setSpecialties(response.data);
        } catch (error) {
            console.error('❌ Error fetching specialties:', error.response || error);
            // ✅ Nếu lỗi, dùng dữ liệu tạm thời
            setSpecialties([
                { id: 1, name: 'Nội khoa' },
                { id: 2, name: 'Ngoại khoa' },
                { id: 3, name: 'Sản phụ khoa' },
                { id: 4, name: 'Nhi khoa' },
                { id: 5, name: 'Tim mạch' }
            ]);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredDoctors = doctors.filter(doctor =>
        doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = () => {
        setEditingDoctor(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            specialty: '',
            gender: 'Nam',
            address: '',
            experience: '',
            qualification: ''
        });
        setShowModal(true);
    };

    const handleEdit = (doctor) => {
        setEditingDoctor(doctor);
        setFormData({
            name: doctor.name || '',
            email: doctor.email || '',
            phone: doctor.phone || '',
            specialty: doctor.specialty || '',
            gender: doctor.gender || 'Nam',
            address: doctor.address || '',
            experience: doctor.experience || '',
            qualification: doctor.qualification || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bác sĩ này?')) return;

        try {
            await api.delete(`/api/admin/doctors/${id}`);
            fetchDoctors();
            alert('Xóa bác sĩ thành công!');
        } catch (error) {
            console.error('Error deleting doctor:', error);
            alert('Lỗi khi xóa bác sĩ!');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingDoctor) {
                await api.put(`/api/admin/doctors/${editingDoctor.id}`, formData);
                alert('Cập nhật bác sĩ thành công!');
            } else {
                await api.post('/api/admin/doctors', formData);
                alert('Thêm bác sĩ thành công!');
            }
            setShowModal(false);
            fetchDoctors();
        } catch (error) {
            console.error('Error saving doctor:', error);
            alert(error.response?.data?.message || 'Lỗi khi lưu thông tin bác sĩ!');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
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
                    <h1>Quản lý Bác sĩ</h1>
                    <p className={styles.subtitle}>Tổng số: {doctors.length} bác sĩ</p>
                </div>
                <button onClick={handleAdd} className={styles.addBtn}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Thêm bác sĩ
                </button>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên, email, chuyên khoa..."
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
                            <th>Email</th>
                            <th>Số điện thoại</th>
                            <th>Chuyên khoa</th>
                            <th>Giới tính</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDoctors.length === 0 ? (
                            <tr>
                                <td colSpan="7" className={styles.empty}>
                                    Không có dữ liệu
                                </td>
                            </tr>
                        ) : (
                            filteredDoctors.map(doctor => (
                                <tr key={doctor.id}>
                                    <td>{doctor.id}</td>
                                    <td>
                                        <div className={styles.doctorInfo}>
                                            <div className={styles.avatar}>
                                                {doctor.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <span>{doctor.name}</span>
                                        </div>
                                    </td>
                                    <td>{doctor.email}</td>
                                    <td>{doctor.phone || '—'}</td>
                                    <td>
                                        <span className={styles.badge}>{doctor.specialty || '—'}</span>
                                    </td>
                                    <td>{doctor.gender || '—'}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                onClick={() => handleEdit(doctor)}
                                                className={styles.editBtn}
                                                title="Sửa"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <path d="M11 2H9C4 2 2 4 2 9v6c0 5 2 7 7 7h6c5 0 7-2 7-7v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M16.04 3.02 8.16 10.9c-.3.3-.6.89-.66 1.32l-.43 3.01c-.16 1.09.61 1.85 1.7 1.7l3.01-.43c.42-.06 1.01-.36 1.32-.66l7.88-7.88c1.36-1.36 2-2.94 0-4.94-2-2-3.58-1.36-4.94 0z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M14.91 4.15a7.144 7.144 0 0 0 4.94 4.94" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(doctor.id)}
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
                            <h2>{editingDoctor ? 'Chỉnh sửa bác sĩ' : 'Thêm bác sĩ mới'}</h2>
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
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Nhập họ tên"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Email <span className={styles.required}>*</span></label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="example@email.com"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Số điện thoại</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="0123456789"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Giới tính</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange}>
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                    </select>
                                </div>

                                {/* ✅ DROPDOWN CHUYÊN KHOA */}
                                <div className={styles.formGroup}>
                                    <label>Chuyên khoa <span className={styles.required}>*</span></label>
                                    <select
                                        name="specialty"
                                        value={formData.specialty}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">-- Chọn chuyên khoa --</option>
                                        {specialties.length === 0 ? (
                                            <option disabled>Đang tải...</option>
                                        ) : (
                                            specialties.map((spec) => (
                                                <option key={spec.id} value={spec.name}>
                                                    {spec.name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {/* ✅ Debug: Hiển thị số lượng chuyên khoa */}
                                    <small style={{ color: '#6b7280', fontSize: '12px' }}>
                                        ({specialties.length} chuyên khoa)
                                    </small>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Kinh nghiệm (năm)</label>
                                    <input
                                        type="number"
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleChange}
                                        placeholder="0"
                                        min="0"
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
                                    <label>Bằng cấp</label>
                                    <textarea
                                        name="qualification"
                                        value={formData.qualification}
                                        onChange={handleChange}
                                        placeholder="VD: Bác sĩ đa khoa, Thạc sĩ Y khoa..."
                                        rows="3"
                                    />
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                                    Hủy
                                </button>
                                <button type="submit" className={styles.submitBtn}>
                                    {editingDoctor ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}