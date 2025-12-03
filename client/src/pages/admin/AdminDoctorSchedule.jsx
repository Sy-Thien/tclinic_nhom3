import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './AdminDoctorSchedule.module.css';

export default function AdminDoctorSchedule() {
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [searchDoctor, setSearchDoctor] = useState('');

    // Form states
    const [formData, setFormData] = useState({
        doctor_id: '',
        day_of_week: 'Thứ 2',
        start_time: '08:00',
        end_time: '17:00',
        break_start: '12:00',
        break_end: '13:00',
        room: '',
        is_active: true
    });

    const dayOptions = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

    useEffect(() => {
        fetchDoctors();
        fetchSpecialties();
    }, []);

    const fetchDoctors = async () => {
        try {
            const response = await api.get('/api/admin/doctors-list');
            setDoctors(response.data);
        } catch (error) {
            console.error('Lỗi lấy danh sách bác sĩ:', error);
        }
    };

    const fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            setSpecialties(response.data);
        } catch (error) {
            console.error('Lỗi lấy chuyên khoa:', error);
        }
    };

    const fetchSchedulesByDoctor = async (doctorId) => {
        try {
            setLoading(true);
            const response = await api.get(`/api/admin/doctor-schedules/${doctorId}`);
            setSchedules(response.data);
        } catch (error) {
            console.error('Lỗi lấy lịch bác sĩ:', error);
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDoctor = (doctorId) => {
        setSelectedDoctor(doctorId);
        setFormData(prev => ({ ...prev, doctor_id: doctorId }));
        fetchSchedulesByDoctor(doctorId);
        setEditingId(null);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.doctor_id) {
            alert('Vui lòng chọn bác sĩ');
            return;
        }

        try {
            if (editingId) {
                await api.put(`/api/admin/doctor-schedules/${editingId}`, formData);
                alert('Cập nhật lịch thành công');
            } else {
                await api.post('/api/admin/doctor-schedules', formData);
                alert('Tạo lịch thành công');
            }

            // Reset form
            setFormData({
                doctor_id: selectedDoctor,
                day_of_week: 'Thứ 2',
                start_time: '08:00',
                end_time: '17:00',
                break_start: '12:00',
                break_end: '13:00',
                room: '',
                is_active: true
            });
            setEditingId(null);
            fetchSchedulesByDoctor(selectedDoctor);
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || 'Có lỗi xảy ra'));
        }
    };

    const handleEdit = (schedule) => {
        setEditingId(schedule.id);
        setFormData({
            doctor_id: schedule.doctor_id,
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time?.substring(0, 5) || '08:00',
            end_time: schedule.end_time?.substring(0, 5) || '17:00',
            break_start: schedule.break_start?.substring(0, 5) || '12:00',
            break_end: schedule.break_end?.substring(0, 5) || '13:00',
            room: schedule.room || '',
            is_active: schedule.is_active !== false
        });
    };

    const handleDelete = async (scheduleId) => {
        if (!window.confirm('Bạn có chắc muốn xóa lịch này?')) return;

        try {
            await api.delete(`/api/admin/doctor-schedules/${scheduleId}`);
            alert('Xóa lịch thành công');
            fetchSchedulesByDoctor(selectedDoctor);
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || 'Có lỗi xảy ra'));
        }
    };

    const handleToggleActive = async (schedule) => {
        try {
            await api.put(`/api/admin/doctor-schedules/${schedule.id}`, {
                ...schedule,
                is_active: !schedule.is_active
            });
            alert(`${schedule.is_active ? 'Đã tắt' : 'Đã bật'} lịch ${schedule.day_of_week}`);
            fetchSchedulesByDoctor(selectedDoctor);
        } catch (error) {
            alert('Lỗi khi thay đổi trạng thái');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({
            doctor_id: selectedDoctor,
            day_of_week: 'Thứ 2',
            start_time: '08:00',
            end_time: '17:00',
            break_start: '12:00',
            break_end: '13:00',
            room: '',
            is_active: true
        });
    };

    // Lọc bác sĩ theo tìm kiếm và chuyên khoa
    const filteredDoctors = doctors.filter(doc => {
        const matchesSearch = doc.full_name.toLowerCase().includes(searchDoctor.toLowerCase()) ||
            doc.specialty?.name?.toLowerCase().includes(searchDoctor.toLowerCase());
        const matchesSpecialty = selectedSpecialty === 'all' || doc.specialty_id === parseInt(selectedSpecialty);
        return matchesSearch && matchesSpecialty;
    });

    // Nhóm bác sĩ theo chuyên khoa
    const doctorsBySpecialty = {};
    filteredDoctors.forEach(doc => {
        const specName = doc.specialty?.name || 'Chưa phân khoa';
        if (!doctorsBySpecialty[specName]) {
            doctorsBySpecialty[specName] = [];
        }
        doctorsBySpecialty[specName].push(doc);
    });

    // Đếm số bác sĩ theo chuyên khoa
    const specialtyCounts = {};
    doctors.forEach(doc => {
        const specId = doc.specialty_id || 0;
        specialtyCounts[specId] = (specialtyCounts[specId] || 0) + 1;
    });

    const selectedDoctorInfo = doctors.find(d => d.id === selectedDoctor);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Quản Lý Lịch Làm Việc</h1>
                <p>Cấu hình lịch làm việc hàng tuần cho các bác sĩ. Có thể tắt lịch khi bác sĩ xin nghỉ.</p>
            </div>

            <div className={styles.content}>
                {/* Tabs chuyên khoa */}
                <div className={styles.specialtyTabs}>
                    <button
                        className={`${styles.tabBtn} ${selectedSpecialty === 'all' ? styles.activeTab : ''}`}
                        onClick={() => setSelectedSpecialty('all')}
                    >
                        Tất cả ({doctors.length})
                    </button>
                    {specialties.map(spec => (
                        <button
                            key={spec.id}
                            className={`${styles.tabBtn} ${selectedSpecialty === String(spec.id) ? styles.activeTab : ''}`}
                            onClick={() => setSelectedSpecialty(String(spec.id))}
                        >
                            {spec.name} ({specialtyCounts[spec.id] || 0})
                        </button>
                    ))}
                </div>

                {/* Chọn bác sĩ */}
                <div className={styles.section}>
                    <h2>Chọn Bác Sĩ</h2>
                    <input
                        type="text"
                        placeholder="Tìm kiếm bác sĩ theo tên hoặc chuyên khoa..."
                        value={searchDoctor}
                        onChange={(e) => setSearchDoctor(e.target.value)}
                        className={styles.searchInput}
                    />

                    {/* Hiển thị bác sĩ theo nhóm chuyên khoa */}
                    {selectedSpecialty === 'all' ? (
                        // Hiển thị theo nhóm khi chọn "Tất cả"
                        Object.keys(doctorsBySpecialty).length > 0 ? (
                            Object.entries(doctorsBySpecialty).map(([specName, docs]) => (
                                <div key={specName} className={styles.specialtyGroup}>
                                    <h3 className={styles.groupTitle}>
                                        {specName}
                                        <span className={styles.groupCount}>({docs.length} bác sĩ)</span>
                                    </h3>
                                    <div className={styles.doctorsList}>
                                        {docs.map(doctor => (
                                            <button
                                                key={doctor.id}
                                                className={`${styles.doctorBtn} ${selectedDoctor === doctor.id ? styles.selected : ''}`}
                                                onClick={() => handleSelectDoctor(doctor.id)}
                                            >
                                                <div className={styles.doctorName}>{doctor.full_name}</div>
                                                <div className={styles.doctorSpecialty}>{doctor.specialty?.name || 'Chưa có chuyên khoa'}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className={styles.noData}>Không tìm thấy bác sĩ</p>
                        )
                    ) : (
                        // Hiển thị danh sách khi chọn chuyên khoa cụ thể
                        <div className={styles.doctorsList}>
                            {filteredDoctors.map(doctor => (
                                <button
                                    key={doctor.id}
                                    className={`${styles.doctorBtn} ${selectedDoctor === doctor.id ? styles.selected : ''}`}
                                    onClick={() => handleSelectDoctor(doctor.id)}
                                >
                                    <div className={styles.doctorName}>{doctor.full_name}</div>
                                    <div className={styles.doctorSpecialty}>{doctor.specialty?.name || 'Chưa có chuyên khoa'}</div>
                                </button>
                            ))}
                            {filteredDoctors.length === 0 && (
                                <p className={styles.noData}>Không có bác sĩ trong chuyên khoa này</p>
                            )}
                        </div>
                    )}
                </div>

                {selectedDoctor && (
                    <>
                        {/* Thông tin bác sĩ đang chọn */}
                        <div className={styles.selectedInfo}>
                            <span>Đang quản lý lịch của: </span>
                            <strong>{selectedDoctorInfo?.full_name}</strong>
                            <span className={styles.specialty}>({selectedDoctorInfo?.specialty?.name})</span>
                        </div>

                        {/* Form thêm/sửa lịch */}
                        <div className={styles.section}>
                            <h2>{editingId ? 'Chỉnh Sửa Lịch' : 'Thêm Lịch Mới'}</h2>
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Ngày trong tuần <span className={styles.required}>*</span></label>
                                        <select
                                            name="day_of_week"
                                            value={formData.day_of_week}
                                            onChange={handleChange}
                                            required
                                        >
                                            {dayOptions.map(day => (
                                                <option key={day} value={day}>{day}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Phòng khám</label>
                                        <input
                                            type="text"
                                            name="room"
                                            value={formData.room}
                                            onChange={handleChange}
                                            placeholder="VD: Phòng 101"
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Giờ bắt đầu <span className={styles.required}>*</span></label>
                                        <input
                                            type="time"
                                            name="start_time"
                                            value={formData.start_time}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Giờ kết thúc <span className={styles.required}>*</span></label>
                                        <input
                                            type="time"
                                            name="end_time"
                                            value={formData.end_time}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={styles.breakSection}>
                                    <h3>Giờ Nghỉ Trưa (Tùy Chọn)</h3>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label>Bắt đầu nghỉ</label>
                                            <input
                                                type="time"
                                                name="break_start"
                                                value={formData.break_start}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label>Kết thúc nghỉ</label>
                                            <input
                                                type="time"
                                                name="break_end"
                                                value={formData.break_end}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.checkboxLabel}>
                                                <input
                                                    type="checkbox"
                                                    name="is_active"
                                                    checked={formData.is_active}
                                                    onChange={handleChange}
                                                />
                                                <span>Lịch đang hoạt động</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.formActions}>
                                    <button type="submit" className={styles.btnSubmit}>
                                        {editingId ? 'Cập Nhật' : 'Thêm Lịch'}
                                    </button>
                                    {editingId && (
                                        <button type="button" className={styles.btnCancel} onClick={handleCancel}>
                                            Hủy
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Danh sách lịch */}
                        <div className={styles.section}>
                            <h2>Lịch Làm Việc Hiện Tại</h2>
                            {loading ? (
                                <p className={styles.loading}>Đang tải...</p>
                            ) : schedules.length > 0 ? (
                                <div className={styles.scheduleGrid}>
                                    {schedules.map(schedule => (
                                        <div
                                            key={schedule.id}
                                            className={`${styles.scheduleCard} ${!schedule.is_active ? styles.inactive : ''}`}
                                        >
                                            <div className={styles.scheduleHeader}>
                                                <span className={styles.day}>{schedule.day_of_week}</span>
                                                {!schedule.is_active && <span className={styles.offBadge}>NGHỈ</span>}
                                            </div>
                                            <div className={styles.scheduleInfo}>
                                                <div className={styles.time}>
                                                    {schedule.start_time?.substring(0, 5)} - {schedule.end_time?.substring(0, 5)}
                                                </div>
                                                {schedule.break_start && schedule.break_end && (
                                                    <div className={styles.breakTime}>
                                                        Nghỉ: {schedule.break_start?.substring(0, 5)} - {schedule.break_end?.substring(0, 5)}
                                                    </div>
                                                )}
                                                {schedule.room && (
                                                    <div className={styles.room}>
                                                        Phòng: {schedule.room}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.scheduleActions}>
                                                <button
                                                    className={styles.btnEdit}
                                                    onClick={() => handleEdit(schedule)}
                                                    title="Sửa"
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    className={`${styles.btnToggle} ${!schedule.is_active ? styles.toggleOff : ''}`}
                                                    onClick={() => handleToggleActive(schedule)}
                                                    title={schedule.is_active ? 'Cho nghỉ' : 'Mở lại'}
                                                >
                                                    {schedule.is_active ? 'Khóa' : 'Mở'}
                                                </button>
                                                <button
                                                    className={styles.btnDelete}
                                                    onClick={() => handleDelete(schedule.id)}
                                                    title="Xóa"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.empty}>Bác sĩ này chưa có lịch làm việc. Hãy thêm lịch mới!</p>
                            )}
                        </div>
                    </>
                )}

                {!selectedDoctor && (
                    <div className={styles.placeholder}>
                        <div className={styles.placeholderIcon}>👆</div>
                        <p>Vui lòng chọn một bác sĩ để quản lý lịch làm việc</p>
                    </div>
                )}
            </div>
        </div>
    );
}
