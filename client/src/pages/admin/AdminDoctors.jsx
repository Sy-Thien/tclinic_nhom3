import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './AdminDoctors.module.css';

export default function AdminDoctors() {
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        gender: 'male',
        specialty_id: '',
        experience: '',
        education: '',
        description: ''
    });
    const [filters, setFilters] = useState({
        search: '',
        specialty_id: '',
        status: 'all'
    });

    useEffect(() => {
        fetchDoctors();
        fetchSpecialties();
    }, [filters]);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.specialty_id) params.append('specialty_id', filters.specialty_id);
            if (filters.status !== 'all') params.append('status', filters.status);

            const response = await api.get(`/api/admin/doctors?${params}`);
            setDoctors(response.data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            alert('Lỗi khi tải danh sách bác sĩ');
        } finally {
            setLoading(false);
        }
    };

    const fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            setSpecialties(response.data);
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    const handleOpenModal = (doctor = null) => {
        if (doctor) {
            setSelectedDoctor(doctor);
            setFormData({
                email: doctor.email,
                password: '',
                full_name: doctor.full_name,
                phone: doctor.phone,
                gender: doctor.gender,
                specialty_id: doctor.specialty_id || '',
                experience: doctor.experience || '',
                education: doctor.education || '',
                description: doctor.description || ''
            });
        } else {
            setSelectedDoctor(null);
            setFormData({
                email: '',
                password: '',
                full_name: '',
                phone: '',
                gender: 'male',
                specialty_id: '',
                experience: '',
                education: '',
                description: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedDoctor(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.email || !formData.full_name || !formData.phone) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        if (!selectedDoctor && !formData.password) {
            alert('Vui lòng nhập mật khẩu cho bác sĩ mới');
            return;
        }

        try {
            setLoading(true);
            if (selectedDoctor) {
                // Update
                await api.put(`/api/admin/doctors/${selectedDoctor.id}`, formData);
                alert('Cập nhật thông tin bác sĩ thành công!');
            } else {
                // Create
                await api.post('/api/admin/doctors', formData);
                alert('Thêm bác sĩ mới thành công!');
            }
            handleCloseModal();
            fetchDoctors();
        } catch (error) {
            console.error('Error saving doctor:', error);
            alert(error.response?.data?.message || 'Lỗi khi lưu thông tin bác sĩ');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = (doctor) => {
        setSelectedDoctor(doctor);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        try {
            setLoading(true);
            await api.delete(`/api/admin/doctors/${selectedDoctor.id}`);
            alert('Xóa bác sĩ thành công!');
            setShowDeleteModal(false);
            setSelectedDoctor(null);
            fetchDoctors();
        } catch (error) {
            console.error('Error deleting doctor:', error);
            alert(error.response?.data?.message || 'Lỗi khi xóa bác sĩ');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (doctor) => {
        try {
            await api.put(`/api/admin/doctors/${doctor.id}/toggle-status`);
            alert(`${doctor.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'} tài khoản thành công!`);
            fetchDoctors();
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Lỗi khi thay đổi trạng thái');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Quản lý Bác sĩ</h1>
                <button className={styles.btnAdd} onClick={() => handleOpenModal()}>
                    Thêm bác sĩ
                </button>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <input
                    type="text"
                    name="search"
                    placeholder="Tìm kiếm (tên, email, số điện thoại)..."
                    value={filters.search}
                    onChange={handleFilterChange}
                    className={styles.searchInput}
                />
                <select
                    name="specialty_id"
                    value={filters.specialty_id}
                    onChange={handleFilterChange}
                    className={styles.filterSelect}
                >
                    <option value="">-- Tất cả chuyên khoa --</option>
                    {specialties.map(sp => (
                        <option key={sp.id} value={sp.id}>{sp.name}</option>
                    ))}
                </select>
                <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className={styles.filterSelect}
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Đã vô hiệu hóa</option>
                </select>
            </div>

            {/* Table */}
            {loading && <div className={styles.loading}>Đang tải...</div>}

            {!loading && doctors.length === 0 && (
                <div className={styles.noData}>Không có dữ liệu</div>
            )}

            {!loading && doctors.length > 0 && (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Họ tên</th>
                                <th>Email</th>
                                <th>Số điện thoại</th>
                                <th>Giới tính</th>
                                <th>Chuyên khoa</th>
                                <th>Kinh nghiệm</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctors.map(doctor => (
                                <tr key={doctor.id}>
                                    <td>{doctor.id}</td>
                                    <td>
                                        <div className={styles.doctorName}>
                                            {doctor.full_name}
                                        </div>
                                    </td>
                                    <td>{doctor.email}</td>
                                    <td>{doctor.phone}</td>
                                    <td>
                                        {doctor.gender === 'male' ? 'Nam' :
                                            doctor.gender === 'female' ? 'Nữ' : 'Khác'}
                                    </td>
                                    <td>{doctor.specialty?.name || 'Chưa có'}</td>
                                    <td>{doctor.experience || 'Chưa cập nhật'}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${doctor.is_active ? styles.active : styles.inactive}`}>
                                            {doctor.is_active ? 'Hoạt động' : 'Vô hiệu'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className={styles.btnEdit}
                                                onClick={() => handleOpenModal(doctor)}
                                                title="Sửa"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                className={styles.btnToggle}
                                                onClick={() => handleToggleStatus(doctor)}
                                                title={doctor.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                            >
                                                {doctor.is_active ? 'Khóa' : 'Mở'}
                                            </button>
                                            <button
                                                className={styles.btnDelete}
                                                onClick={() => handleDeleteConfirm(doctor)}
                                                title="Xóa"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Form */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={handleCloseModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{selectedDoctor ? 'Sửa thông tin bác sĩ' : 'Thêm bác sĩ mới'}</h2>
                            <button className={styles.btnClose} onClick={handleCloseModal}>Đóng</button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Email <span className={styles.required}>*</span></label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>
                                        Mật khẩu {!selectedDoctor && <span className={styles.required}>*</span>}
                                        {selectedDoctor && <small> (để trống nếu không đổi)</small>}
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required={!selectedDoctor}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Họ tên <span className={styles.required}>*</span></label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        required
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
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Giới tính</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange}>
                                        <option value="male">Nam</option>
                                        <option value="female">Nữ</option>
                                        <option value="other">Khác</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Chuyên khoa</label>
                                    <select name="specialty_id" value={formData.specialty_id} onChange={handleChange}>
                                        <option value="">-- Chọn chuyên khoa --</option>
                                        {specialties.map(sp => (
                                            <option key={sp.id} value={sp.id}>{sp.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Kinh nghiệm</label>
                                    <input
                                        type="text"
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleChange}
                                        placeholder="VD: 10 năm kinh nghiệm"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Học vấn</label>
                                    <input
                                        type="text"
                                        name="education"
                                        value={formData.education}
                                        onChange={handleChange}
                                        placeholder="VD: Bác sĩ ĐH Y Hà Nội"
                                    />
                                </div>
                                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                    <label>Mô tả</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                        placeholder="Giới thiệu về bác sĩ..."
                                    />
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.btnCancel} onClick={handleCloseModal}>
                                    Hủy
                                </button>
                                <button type="submit" className={styles.btnSubmit} disabled={loading}>
                                    {loading ? 'Đang xử lý...' : selectedDoctor ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
                    <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
                        <h3>Xác nhận xóa</h3>
                        <p>Bạn có chắc chắn muốn xóa bác sĩ <strong>{selectedDoctor?.full_name}</strong>?</p>
                        <div className={styles.modalFooter}>
                            <button className={styles.btnCancel} onClick={() => setShowDeleteModal(false)}>
                                Hủy
                            </button>
                            <button className={styles.btnDelete} onClick={handleDelete} disabled={loading}>
                                {loading ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
