import React, { Component } from 'react';
import api from '../../utils/api';
import styles from './AdminDoctorSchedule.module.css';

class AdminDoctorSchedule extends Component {
    constructor(props) {
        super(props);
        this.state = {
            doctors: [],
            specialties: [],
            allSchedules: [],
            loading: false,
            searchDoctor: '',
            selectedSpecialty: 'all',
            showModal: false,
            editingId: null,
            formData: {
                doctor_id: '',
                day_of_week: 'Thứ 2',
                start_time: '08:00',
                end_time: '17:00',
                break_start: '12:00',
                break_end: '13:00',
                room: '',
                is_active: true
            }
        };
        this.dayOptions = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    }

    componentDidMount() {
        this.fetchDoctors();
        this.fetchSpecialties();
        this.fetchAllSchedules();
    }

    fetchDoctors = async () => {
        try {
            const res = await api.get('/api/admin/doctor-schedules/doctors-list');
            this.setState({ doctors: res.data });
        } catch (e) {
            console.error('Lỗi lấy bác sĩ:', e);
        }
    };

    fetchSpecialties = async () => {
        try {
            const res = await api.get('/api/public/specialties');
            this.setState({ specialties: res.data });
        } catch (e) {
            console.error('Lỗi lấy chuyên khoa:', e);
        }
    };

    fetchAllSchedules = async () => {
        try {
            this.setState({ loading: true });
            const res = await api.get('/api/admin/doctor-schedules');
            this.setState({ allSchedules: res.data });
        } catch (e) {
            console.error('Lỗi lấy lịch:', e);
        } finally {
            this.setState({ loading: false });
        }
    };

    getSchedule = (doctorId, day) =>
        this.state.allSchedules.find(s => s.doctor_id === doctorId && s.day_of_week === day);

    openAdd = (doctorId, day) => {
        this.setState({
            editingId: null,
            formData: {
                doctor_id: doctorId,
                day_of_week: day,
                start_time: '08:00',
                end_time: '17:00',
                break_start: '12:00',
                break_end: '13:00',
                room: '',
                is_active: true
            },
            showModal: true
        });
    };

    openEdit = (schedule) => {
        this.setState({
            editingId: schedule.id,
            formData: {
                doctor_id: schedule.doctor_id,
                day_of_week: schedule.day_of_week,
                start_time: schedule.start_time?.substring(0, 5) || '08:00',
                end_time: schedule.end_time?.substring(0, 5) || '17:00',
                break_start: schedule.break_start?.substring(0, 5) || '12:00',
                break_end: schedule.break_end?.substring(0, 5) || '13:00',
                room: schedule.room || '',
                is_active: schedule.is_active !== false
            },
            showModal: true
        });
    };

    handleDelete = async (scheduleId) => {
        if (!window.confirm('Bạn có chắc muốn xóa lịch này?')) return;
        try {
            await api.delete(`/api/admin/doctor-schedules/${scheduleId}`);
            this.fetchAllSchedules();
        } catch (e) {
            alert('Lỗi xóa: ' + (e.response?.data?.message || e.message));
        }
    };

    handleToggle = async (schedule) => {
        try {
            await api.put(`/api/admin/doctor-schedules/${schedule.id}`, {
                doctor_id: schedule.doctor_id,
                day_of_week: schedule.day_of_week,
                start_time: schedule.start_time?.substring(0, 5),
                end_time: schedule.end_time?.substring(0, 5),
                break_start: schedule.break_start?.substring(0, 5) || null,
                break_end: schedule.break_end?.substring(0, 5) || null,
                room: schedule.room || null,
                is_active: !schedule.is_active
            });
            this.fetchAllSchedules();
        } catch (e) {
            alert('Lỗi: ' + (e.response?.data?.message || e.message));
        }
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (this.state.editingId) {
                await api.put(`/api/admin/doctor-schedules/${this.state.editingId}`, this.state.formData);
            } else {
                await api.post('/api/admin/doctor-schedules', this.state.formData);
            }
            this.setState({ showModal: false });
            this.fetchAllSchedules();
        } catch (e) {
            alert('Lỗi: ' + (e.response?.data?.message || e.message));
        }
    };

    render() {
        const { doctors, specialties, allSchedules, loading, searchDoctor, selectedSpecialty, showModal, editingId, formData } = this.state;
        const dayOptions = this.dayOptions;

        const filteredDoctors = doctors.filter(doc => {
            const matchesSearch =
                doc.full_name.toLowerCase().includes(searchDoctor.toLowerCase()) ||
                doc.specialty?.name?.toLowerCase().includes(searchDoctor.toLowerCase());
            const matchesSpecialty =
                selectedSpecialty === 'all' || doc.specialty_id === parseInt(selectedSpecialty);
            return matchesSearch && matchesSpecialty;
        });

        const scheduleCount = {};
        allSchedules.forEach(s => {
            scheduleCount[s.doctor_id] = (scheduleCount[s.doctor_id] || 0) + 1;
        });

        const specialtyCounts = {};
        doctors.forEach(doc => {
            const specId = doc.specialty_id || 0;
            specialtyCounts[specId] = (specialtyCounts[specId] || 0) + 1;
        });

        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Quản Lý Lịch Làm Việc</h1>
                    <p>Xem tổng quan lịch làm việc hàng tuần của tất cả bác sĩ. Bấm <strong>+</strong> để thêm, bấm biểu tượng để sửa/xóa.</p>
                </div>

                {/* Filter Bar */}
                <div className={styles.filterBar}>
                    <input
                        type="text"
                        placeholder="🔍 Tìm kiếm bác sĩ hoặc chuyên khoa..."
                        value={searchDoctor}
                        onChange={e => this.setState({ searchDoctor: e.target.value })}
                        className={styles.searchInput}
                    />
                    <div className={styles.specialtyTabs}>
                        <button
                            className={`${styles.tabBtn} ${selectedSpecialty === 'all' ? styles.activeTab : ''}`}
                            onClick={() => this.setState({ selectedSpecialty: 'all' })}
                        >
                            Tất cả ({doctors.length})
                        </button>
                        {specialties.map(spec => (
                            <button
                                key={spec.id}
                                className={`${styles.tabBtn} ${selectedSpecialty === String(spec.id) ? styles.activeTab : ''}`}
                                onClick={() => this.setState({ selectedSpecialty: String(spec.id) })}
                            >
                                {spec.name} ({specialtyCounts[spec.id] || 0})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Bar */}
                <div className={styles.statsBar}>
                    <span>👥 {filteredDoctors.length} bác sĩ</span>
                    <span>📅 {allSchedules.length} lịch tổng cộng</span>
                    <span className={styles.statActive}>✅ {allSchedules.filter(s => s.is_active).length} đang hoạt động</span>
                    <span className={styles.statInactive}>⏸️ {allSchedules.filter(s => !s.is_active).length} tạm dừng</span>
                </div>

                {/* Legend */}
                <div className={styles.legend}>
                    <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#e0f2fe', border: '1px solid #38bdf8' }}></span> Đang hoạt động</span>
                    <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#fee2e2', border: '1px solid #fca5a5' }}></span> Tạm dừng</span>
                    <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#f1f5f9', border: '2px dashed #cbd5e0' }}></span> Chưa có lịch → bấm + để thêm</span>
                </div>

                {/* Weekly Grid Table */}
                {loading ? (
                    <div className={styles.loading}>⏳ Đang tải dữ liệu...</div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.weeklyTable}>
                            <thead>
                                <tr>
                                    <th className={styles.doctorColHeader}>Bác sĩ / Chuyên khoa</th>
                                    {this.dayOptions.map(day => (
                                        <th key={day} className={styles.dayColHeader}>{day}</th>
                                    ))}
                                    <th className={styles.totalColHeader}>Số ngày</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDoctors.length === 0 ? (
                                    <tr>
                                        <td colSpan={this.dayOptions.length + 2} className={styles.emptyRow}>
                                            Không tìm thấy bác sĩ nào
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDoctors.map(doctor => (
                                        <tr key={doctor.id} className={styles.doctorRow}>
                                            <td className={styles.doctorCell}>
                                                <div className={styles.doctorName}>{doctor.full_name}</div>
                                                <div className={styles.doctorSpecialty}>
                                                    {doctor.specialty?.name || 'Chưa phân khoa'}
                                                </div>
                                            </td>
                                            {this.dayOptions.map(day => {
                                                const schedule = this.getSchedule(doctor.id, day);
                                                return (
                                                    <td key={day} className={styles.scheduleCell}>
                                                        {schedule ? (
                                                            <div className={`${styles.schedulePill} ${!schedule.is_active ? styles.pillInactive : styles.pillActive}`}>
                                                                <div className={styles.pillTime}>
                                                                    {schedule.start_time?.substring(0, 5)}–{schedule.end_time?.substring(0, 5)}
                                                                </div>
                                                                {schedule.break_start && (
                                                                    <div className={styles.pillBreak}>
                                                                        ☕ {schedule.break_start?.substring(0, 5)}–{schedule.break_end?.substring(0, 5)}
                                                                    </div>
                                                                )}
                                                                {schedule.room && (
                                                                    <div className={styles.pillRoom}>🚪 {schedule.room}</div>
                                                                )}
                                                                {!schedule.is_active && (
                                                                    <div className={styles.pillPaused}>⏸ Tạm dừng</div>
                                                                )}
                                                                <div className={styles.pillActions}>
                                                                    <button
                                                                        className={styles.editBtn}
                                                                        onClick={() => this.openEdit(schedule)}
                                                                        title="Chỉnh sửa"
                                                                    >✏️</button>
                                                                    <button
                                                                        className={styles.toggleBtn}
                                                                        onClick={() => this.handleToggle(schedule)}
                                                                        title={schedule.is_active ? 'Tạm dừng' : 'Kích hoạt'}
                                                                    >{schedule.is_active ? '⏸️' : '▶️'}</button>
                                                                    <button
                                                                        className={styles.deleteBtn}
                                                                        onClick={() => this.handleDelete(schedule.id)}
                                                                        title="Xóa lịch"
                                                                    >🗑️</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                className={styles.addSlotBtn}
                                                                onClick={() => this.openAdd(doctor.id, day)}
                                                                title={`Thêm lịch ${day}`}
                                                            >+</button>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className={styles.totalCell}>
                                                <span className={styles.totalBadge}>
                                                    {scheduleCount[doctor.id] || 0}/7
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className={styles.modalOverlay} onClick={() => this.setState({ showModal: false })}>
                        <div className={styles.modal} onClick={e => e.stopPropagation()}>
                            <h2>{editingId ? '✏️ Chỉnh Sửa Lịch' : '➕ Thêm Lịch Mới'}</h2>
                            <form onSubmit={this.handleSubmit}>
                                <div className={styles.modalFormGroup}>
                                    <label>Bác sĩ <span className={styles.required}>*</span></label>
                                    <select
                                        value={formData.doctor_id}
                                        onChange={e => this.setState(prev => ({ formData: { ...prev.formData, doctor_id: parseInt(e.target.value) } }))}
                                        required
                                        className={styles.modalInput}
                                    >
                                        <option value="">-- Chọn bác sĩ --</option>
                                        {doctors.map(d => (
                                            <option key={d.id} value={d.id}>{d.full_name} ({d.specialty?.name})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.modalFormGroup}>
                                    <label>Ngày trong tuần <span className={styles.required}>*</span></label>
                                    <select
                                        value={formData.day_of_week}
                                        onChange={e => this.setState(prev => ({ formData: { ...prev.formData, day_of_week: e.target.value } }))}
                                        className={styles.modalInput}
                                    >
                                        {this.dayOptions.map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.modalRow}>
                                    <div className={styles.modalFormGroup}>
                                        <label>Giờ bắt đầu <span className={styles.required}>*</span></label>
                                        <input
                                            type="time"
                                            value={formData.start_time}
                                            onChange={e => this.setState(prev => ({ formData: { ...prev.formData, start_time: e.target.value } }))}
                                            required
                                            className={styles.modalInput}
                                        />
                                    </div>
                                    <div className={styles.modalFormGroup}>
                                        <label>Giờ kết thúc <span className={styles.required}>*</span></label>
                                        <input
                                            type="time"
                                            value={formData.end_time}
                                            onChange={e => this.setState(prev => ({ formData: { ...prev.formData, end_time: e.target.value } }))}
                                            required
                                            className={styles.modalInput}
                                        />
                                    </div>
                                </div>
                                <div className={styles.modalRow}>
                                    <div className={styles.modalFormGroup}>
                                        <label>Nghỉ trưa từ</label>
                                        <input
                                            type="time"
                                            value={formData.break_start}
                                            onChange={e => this.setState(prev => ({ formData: { ...prev.formData, break_start: e.target.value } }))}
                                            className={styles.modalInput}
                                        />
                                    </div>
                                    <div className={styles.modalFormGroup}>
                                        <label>Nghỉ trưa đến</label>
                                        <input
                                            type="time"
                                            value={formData.break_end}
                                            onChange={e => this.setState(prev => ({ formData: { ...prev.formData, break_end: e.target.value } }))}
                                            className={styles.modalInput}
                                        />
                                    </div>
                                </div>
                                <div className={styles.modalFormGroup}>
                                    <label>Phòng khám</label>
                                    <input
                                        type="text"
                                        value={formData.room}
                                        onChange={e => this.setState(prev => ({ formData: { ...prev.formData, room: e.target.value } }))}
                                        placeholder="VD: Phòng 101"
                                        className={styles.modalInput}
                                    />
                                </div>
                                <div className={styles.modalCheckbox}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={e => this.setState(prev => ({ formData: { ...prev.formData, is_active: e.target.checked } }))}
                                        />
                                        <span>Lịch đang hoạt động</span>
                                    </label>
                                </div>
                                <div className={styles.modalFooter}>
                                    <button type="button" onClick={() => this.setState({ showModal: false })} className={styles.modalCancelBtn}>
                                        Hủy
                                    </button>
                                    <button type="submit" className={styles.modalSubmitBtn}>
                                        {editingId ? 'Cập nhật' : 'Thêm lịch'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default AdminDoctorSchedule;
