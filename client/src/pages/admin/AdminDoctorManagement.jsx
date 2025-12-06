import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './AdminDoctorManagement.module.css';

const DAYS_OF_WEEK = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

export default function AdminDoctorManagement() {
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDoctorModal, setShowDoctorModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false); // ✅ NEW: Modal chỉnh sửa lịch
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedTab, setSelectedTab] = useState(null); // 'info' hoặc 'schedule'
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
    const [doctorSchedule, setDoctorSchedule] = useState(null);
    const [editingSchedule, setEditingSchedule] = useState(null); // ✅ Schedule đang edit
    const [scheduleFormData, setScheduleFormData] = useState({
        day_of_week: 'Thứ 2',
        start_time: '08:00',
        end_time: '17:00',
        break_start: '12:00',
        break_end: '13:00',
        is_active: true,
        room: ''
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

    const fetchDoctorSchedule = async (doctorId) => {
        try {
            setLoading(true);
            const response = await api.get(`/api/admin/doctor-schedules/${doctorId}`);
            setDoctorSchedule(response.data);
        } catch (error) {
            console.error('Error fetching schedule:', error);
            setDoctorSchedule([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDoctorModal = (doctor) => {
        setSelectedDoctor(doctor);
        setSelectedTab('info');
        setShowDoctorModal(true);
    };

    const handleTabChange = (tab) => {
        setSelectedTab(tab);
        if (tab === 'schedule' && !doctorSchedule) {
            fetchDoctorSchedule(selectedDoctor.id);
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
                await api.put(`/api/admin/doctors/${selectedDoctor.id}`, formData);
                alert('Cập nhật thông tin bác sĩ thành công!');
            } else {
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

    // ✅ NEW: Mở modal thêm/sửa lịch làm việc
    const handleOpenScheduleModal = (schedule = null) => {
        if (schedule) {
            setEditingSchedule(schedule);
            setScheduleFormData({
                day_of_week: schedule.day_of_week,
                start_time: schedule.start_time?.substring(0, 5) || '08:00',
                end_time: schedule.end_time?.substring(0, 5) || '17:00',
                break_start: schedule.break_start?.substring(0, 5) || '12:00',
                break_end: schedule.break_end?.substring(0, 5) || '13:00',
                is_active: schedule.is_active !== false,
                room: schedule.room || ''
            });
        } else {
            setEditingSchedule(null);
            setScheduleFormData({
                day_of_week: 'Thứ 2',
                start_time: '08:00',
                end_time: '17:00',
                break_start: '12:00',
                break_end: '13:00',
                is_active: true,
                room: ''
            });
        }
        setShowScheduleModal(true);
    };

    const handleScheduleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setScheduleFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // ✅ Lưu lịch làm việc (thêm mới hoặc cập nhật)
    const handleSaveSchedule = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (editingSchedule) {
                // Cập nhật
                await api.put(`/api/admin/doctor-schedules/${editingSchedule.id}`, scheduleFormData);
                alert('Cập nhật lịch làm việc thành công!');
            } else {
                // Thêm mới
                await api.post(`/api/admin/doctor-schedules`, {
                    doctor_id: selectedDoctor.id,
                    ...scheduleFormData
                });
                alert('Thêm lịch làm việc thành công!');
            }
            setShowScheduleModal(false);
            fetchDoctorSchedule(selectedDoctor.id);
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert(error.response?.data?.message || 'Lỗi khi lưu lịch làm việc');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Xóa lịch làm việc
    const handleDeleteSchedule = async (scheduleId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa lịch làm việc này?')) return;
        try {
            setLoading(true);
            await api.delete(`/api/admin/doctor-schedules/${scheduleId}`);
            alert('Xóa lịch làm việc thành công!');
            fetchDoctorSchedule(selectedDoctor.id);
        } catch (error) {
            console.error('Error deleting schedule:', error);
            alert(error.response?.data?.message || 'Lỗi khi xóa lịch làm việc');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Toggle active/inactive lịch làm việc (cho bác sĩ nghỉ)
    const handleToggleScheduleActive = async (schedule) => {
        try {
            setLoading(true);
            await api.put(`/api/admin/doctor-schedules/${schedule.id}`, {
                ...schedule,
                is_active: !schedule.is_active
            });
            alert(`${schedule.is_active ? 'Đã tắt' : 'Đã bật'} lịch làm việc ${schedule.day_of_week}!`);
            fetchDoctorSchedule(selectedDoctor.id);
        } catch (error) {
            console.error('Error toggling schedule:', error);
            alert('Lỗi khi thay đổi trạng thái lịch');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Quản Lý Bác Sĩ & Lịch Làm Việc</h1>
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
                                        <div className={styles.doctorName} onClick={() => handleOpenDoctorModal(doctor)} style={{ cursor: 'pointer', color: '#3b82f6' }}>
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
                                                {doctor.is_active ? 'Khóa' : 'Mở khóa'}
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

            {/* Doctor Detail & Schedule Modal */}
            {showDoctorModal && selectedDoctor && (
                <div className={styles.modalOverlay} onClick={() => setShowDoctorModal(false)}>
                    <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{selectedDoctor.full_name}</h2>
                            <button className={styles.btnClose} onClick={() => setShowDoctorModal(false)}>Đóng</button>
                        </div>

                        {/* Tab Navigation */}
                        <div className={styles.tabNav}>
                            <button
                                className={`${styles.tabBtn} ${selectedTab === 'info' ? styles.active : ''}`}
                                onClick={() => handleTabChange('info')}
                            >
                                Thông tin chi tiết
                            </button>
                            <button
                                className={`${styles.tabBtn} ${selectedTab === 'schedule' ? styles.active : ''}`}
                                onClick={() => handleTabChange('schedule')}
                            >
                                Lịch làm việc
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className={styles.tabContent}>
                            {/* Tab: Thông tin */}
                            {selectedTab === 'info' && (
                                <div className={styles.infoTab}>
                                    <div className={styles.infoGrid}>
                                        <div className={styles.infoItem}>
                                            <label>Email:</label>
                                            <p>{selectedDoctor.email}</p>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <label>Số điện thoại:</label>
                                            <p>{selectedDoctor.phone}</p>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <label>Giới tính:</label>
                                            <p>{selectedDoctor.gender === 'male' ? 'Nam' : selectedDoctor.gender === 'female' ? 'Nữ' : 'Khác'}</p>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <label>Chuyên khoa:</label>
                                            <p>{selectedDoctor.specialty?.name || 'Chưa có'}</p>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <label>Kinh nghiệm:</label>
                                            <p>{selectedDoctor.experience || 'Chưa cập nhật'}</p>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <label>Học vấn:</label>
                                            <p>{selectedDoctor.education || 'Chưa cập nhật'}</p>
                                        </div>
                                        <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                                            <label>Mô tả:</label>
                                            <p>{selectedDoctor.description || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>
                                    <div className={styles.modalFooter}>
                                        <button
                                            className={styles.btnEdit}
                                            onClick={() => {
                                                setShowDoctorModal(false);
                                                handleOpenModal(selectedDoctor);
                                            }}
                                        >
                                            Chỉnh sửa
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Tab: Lịch làm việc */}
                            {selectedTab === 'schedule' && (
                                <div className={styles.scheduleTab}>
                                    <div className={styles.scheduleHeader}>
                                        <h3>Quản lý lịch làm việc</h3>
                                        <button
                                            className={styles.btnAddSchedule}
                                            onClick={() => handleOpenScheduleModal()}
                                        >
                                            Thêm lịch
                                        </button>
                                    </div>
                                    {loading ? (
                                        <p>Đang tải lịch làm việc...</p>
                                    ) : doctorSchedule && doctorSchedule.length > 0 ? (
                                        <div className={styles.scheduleGrid}>
                                            {doctorSchedule.map(schedule => (
                                                <div
                                                    key={schedule.id}
                                                    className={`${styles.scheduleCard} ${!schedule.is_active ? styles.scheduleInactive : ''}`}
                                                >
                                                    <div className={styles.scheduleDay}>
                                                        <strong>{schedule.day_of_week}</strong>
                                                        {!schedule.is_active && <span className={styles.offBadge}>NGHỈ</span>}
                                                    </div>
                                                    <div className={styles.scheduleTime}>
                                                        <span>Giờ: {schedule.start_time?.substring(0, 5)} - {schedule.end_time?.substring(0, 5)}</span>
                                                    </div>
                                                    {schedule.break_start && schedule.break_end && (
                                                        <div className={styles.scheduleBreak}>
                                                            <span>Nghỉ: {schedule.break_start?.substring(0, 5)} - {schedule.break_end?.substring(0, 5)}</span>
                                                        </div>
                                                    )}
                                                    <div className={styles.scheduleRoom}>
                                                        <span>Phòng: {schedule.room || 'Phòng khám'}</span>
                                                    </div>
                                                    <div className={styles.scheduleActions}>
                                                        <button
                                                            className={styles.btnScheduleEdit}
                                                            onClick={() => handleOpenScheduleModal(schedule)}
                                                            title="Sửa"
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button
                                                            className={`${styles.btnScheduleToggle} ${!schedule.is_active ? styles.inactive : ''}`}
                                                            onClick={() => handleToggleScheduleActive(schedule)}
                                                            title={schedule.is_active ? 'Cho nghỉ' : 'Mở lại'}
                                                        >
                                                            {schedule.is_active ? 'Nghỉ' : 'Mở'}
                                                        </button>
                                                        <button
                                                            className={styles.btnScheduleDelete}
                                                            onClick={() => handleDeleteSchedule(schedule.id)}
                                                            title="Xóa"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={styles.noSchedule}>Bác sĩ chưa có lịch làm việc. Nhấn "Thêm lịch" để tạo mới.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.btnCancel}
                                onClick={() => setShowDoctorModal(false)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
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

            {/* ✅ Schedule Edit Modal */}
            {showScheduleModal && (
                <div className={styles.modalOverlay} onClick={() => setShowScheduleModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{editingSchedule ? 'Sửa lịch làm việc' : 'Thêm lịch làm việc'}</h2>
                            <button className={styles.btnClose} onClick={() => setShowScheduleModal(false)}>Đóng</button>
                        </div>
                        <form onSubmit={handleSaveSchedule} className={styles.form}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Ngày trong tuần <span className={styles.required}>*</span></label>
                                    <select
                                        name="day_of_week"
                                        value={scheduleFormData.day_of_week}
                                        onChange={handleScheduleFormChange}
                                        required
                                    >
                                        {DAYS_OF_WEEK.map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Phòng khám</label>
                                    <input
                                        type="text"
                                        name="room"
                                        value={scheduleFormData.room}
                                        onChange={handleScheduleFormChange}
                                        placeholder="VD: Phòng 101"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Giờ bắt đầu <span className={styles.required}>*</span></label>
                                    <input
                                        type="time"
                                        name="start_time"
                                        value={scheduleFormData.start_time}
                                        onChange={handleScheduleFormChange}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Giờ kết thúc <span className={styles.required}>*</span></label>
                                    <input
                                        type="time"
                                        name="end_time"
                                        value={scheduleFormData.end_time}
                                        onChange={handleScheduleFormChange}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Giờ nghỉ bắt đầu</label>
                                    <input
                                        type="time"
                                        name="break_start"
                                        value={scheduleFormData.break_start}
                                        onChange={handleScheduleFormChange}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Giờ nghỉ kết thúc</label>
                                    <input
                                        type="time"
                                        name="break_end"
                                        value={scheduleFormData.break_end}
                                        onChange={handleScheduleFormChange}
                                    />
                                </div>
                                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={scheduleFormData.is_active}
                                            onChange={handleScheduleFormChange}
                                        />
                                        <span>Lịch đang hoạt động (bỏ tick nếu bác sĩ xin nghỉ ngày này)</span>
                                    </label>
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.btnCancel} onClick={() => setShowScheduleModal(false)}>
                                    Hủy
                                </button>
                                <button type="submit" className={styles.btnSubmit} disabled={loading}>
                                    {loading ? 'Đang xử lý...' : editingSchedule ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
