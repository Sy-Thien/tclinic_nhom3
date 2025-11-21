import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './AdminDoctorSchedule.module.css';

export default function AdminDoctorSchedule() {
    const [doctors, setDoctors] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [editingId, setEditingId] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        doctor_id: '',
        day_of_week: 'Thứ 2',
        start_time: '08:00',
        end_time: '17:00',
        break_start: '12:00',
        break_end: '13:00'
    });

    const dayOptions = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

    useEffect(() => {
        fetchDoctors();
        fetchAllSchedules();
    }, []);

    const fetchDoctors = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/doctors-list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDoctors(response.data);
        } catch (error) {
            console.error('Lỗi lấy danh sách bác sĩ:', error);
        }
    };

    const fetchAllSchedules = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/doctor-schedules', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSchedules(response.data);
        } catch (error) {
            console.error('Lỗi lấy danh sách lịch:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSchedulesByDoctor = async (doctorId) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/admin/doctor-schedules/${doctorId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSchedules(response.data);
        } catch (error) {
            console.error('Lỗi lấy lịch bác sĩ:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDoctor = (doctorId) => {
        setSelectedDoctor(doctorId);
        setFormData(prev => ({ ...prev, doctor_id: doctorId }));
        if (doctorId) {
            fetchSchedulesByDoctor(doctorId);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.doctor_id) {
            alert('Vui lòng chọn bác sĩ');
            return;
        }

        try {
            const token = localStorage.getItem('token');

            if (editingId) {
                // Update
                await axios.put(`http://localhost:5000/api/admin/doctor-schedules/${editingId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('✅ Cập nhật lịch thành công');
            } else {
                // Create
                await axios.post('http://localhost:5000/api/admin/doctor-schedules', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('✅ Tạo lịch thành công');
            }

            // Reset form
            setFormData({
                doctor_id: selectedDoctor,
                day_of_week: 'Thứ 2',
                start_time: '08:00',
                end_time: '17:00',
                break_start: '12:00',
                break_end: '13:00'
            });
            setEditingId(null);
            fetchSchedulesByDoctor(selectedDoctor);
        } catch (error) {
            alert('❌ ' + (error.response?.data?.message || 'Có lỗi xảy ra'));
        }
    };

    const handleEdit = (schedule) => {
        setEditingId(schedule.id);
        setFormData({
            doctor_id: schedule.doctor_id,
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            break_start: schedule.break_start,
            break_end: schedule.break_end
        });
    };

    const handleDelete = async (scheduleId) => {
        if (!window.confirm('Bạn có chắc muốn xóa lịch này?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/admin/doctor-schedules/${scheduleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('✅ Xóa lịch thành công');
            fetchSchedulesByDoctor(selectedDoctor);
        } catch (error) {
            alert('❌ ' + (error.response?.data?.message || 'Có lỗi xảy ra'));
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
            break_end: '13:00'
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>⏰ Quản Lý Lịch Làm Việc Bác Sĩ</h1>
                <p>Cấu hình lịch làm việc hàng ngày cho các bác sĩ</p>
            </div>

            <div className={styles.content}>
                {/* Chọn bác sĩ */}
                <div className={styles.section}>
                    <h2>Chọn Bác Sĩ</h2>
                    <div className={styles.doctorsList}>
                        {doctors.map(doctor => (
                            <button
                                key={doctor.id}
                                className={`${styles.doctorBtn} ${selectedDoctor === doctor.id ? styles.selected : ''}`}
                                onClick={() => handleSelectDoctor(doctor.id)}
                            >
                                <div className={styles.doctorName}>{doctor.full_name}</div>
                                <div className={styles.doctorSpecialty}>{doctor.specialty?.name}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {selectedDoctor && (
                    <>
                        {/* Form thêm/sửa lịch */}
                        <div className={styles.section}>
                            <h2>{editingId ? 'Chỉnh Sửa Lịch Làm Việc' : 'Thêm Lịch Làm Việc'}</h2>
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Ngày trong tuần *</label>
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
                                        <label>Giờ bắt đầu *</label>
                                        <input
                                            type="time"
                                            name="start_time"
                                            value={formData.start_time}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Giờ kết thúc *</label>
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
                                    <h3>Giờ Nghỉ (Tùy Chọn)</h3>
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
                                    </div>
                                </div>

                                <div className={styles.formActions}>
                                    <button type="submit" className={styles.btnSubmit}>
                                        {editingId ? 'Cập Nhật Lịch' : 'Thêm Lịch'}
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
                            <h2>Lịch Làm Việc</h2>
                            {loading ? (
                                <p>Đang tải...</p>
                            ) : schedules.length > 0 ? (
                                <div className={styles.scheduleList}>
                                    {schedules.map(schedule => (
                                        <div key={schedule.id} className={styles.scheduleCard}>
                                            <div className={styles.scheduleInfo}>
                                                <div className={styles.day}>{schedule.day_of_week}</div>
                                                <div className={styles.time}>
                                                    {schedule.start_time} - {schedule.end_time}
                                                </div>
                                                {schedule.break_start && schedule.break_end && (
                                                    <div className={styles.breakTime}>
                                                        Nghỉ: {schedule.break_start} - {schedule.break_end}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.scheduleActions}>
                                                <button
                                                    className={styles.btnEdit}
                                                    onClick={() => handleEdit(schedule)}
                                                >
                                                    ✏️ Sửa
                                                </button>
                                                <button
                                                    className={styles.btnDelete}
                                                    onClick={() => handleDelete(schedule.id)}
                                                >
                                                    🗑️ Xóa
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.empty}>Bác sĩ này chưa có lịch làm việc</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
