import React, { Component } from 'react';
import api from '../../utils/api';
import styles from './DoctorSelfSchedule.module.css';

class DoctorSelfScheduleWeekly extends Component {
    constructor(props) {
        super(props);

        this.dayOptions = [
            { value: 'Thứ 2', label: 'Thứ 2' },
            { value: 'Thứ 3', label: 'Thứ 3' },
            { value: 'Thứ 4', label: 'Thứ 4' },
            { value: 'Thứ 5', label: 'Thứ 5' },
            { value: 'Thứ 6', label: 'Thứ 6' },
            { value: 'Thứ 7', label: 'Thứ 7' },
            { value: 'Chủ nhật', label: 'Chủ nhật' }
        ];

        this.shiftOptions = [
            {
                value: 'morning',
                label: 'Ca Sáng',
                icon: '🌅',
                time: '07:00 - 12:00',
                start_time: '07:00',
                end_time: '12:00',
                break_start: null,
                break_end: null
            },
            {
                value: 'afternoon',
                label: 'Ca Chiều',
                icon: '🌆',
                time: '13:00 - 17:00',
                start_time: '13:00',
                end_time: '17:00',
                break_start: null,
                break_end: null
            },
            {
                value: 'fullday',
                label: 'Cả Ngày',
                icon: '☀️',
                time: '07:00 - 17:00',
                start_time: '07:00',
                end_time: '17:00',
                break_start: '12:00',
                break_end: '13:00'
            }
        ];

        this.state = {
            schedules: [],
            loading: false,
            doctor: null,
            selectedDays: [],
            selectedShift: 'morning',
            room: ''
        };
    }

    componentDidMount() {
        this.fetchMyProfile();
        this.fetchMySchedules();
    }

    fetchMyProfile = async () => {
        try {
            const response = await api.get('/api/doctor/my-profile');
            if (response.data.success) {
                this.setState({ doctor: response.data.doctor });
            }
        } catch (error) {
            console.error('Lỗi lấy thông tin bác sĩ:', error);
        }
    };

    fetchMySchedules = async () => {
        try {
            this.setState({ loading: true });
            const response = await api.get('/api/doctor/my-schedules');
            if (response.data.success) {
                this.setState({ schedules: response.data.schedules });
            }
        } catch (error) {
            console.error('Lỗi lấy lịch làm việc:', error);
            alert('Không thể tải lịch làm việc: ' + (error.response?.data?.message || error.message));
        } finally {
            this.setState({ loading: false });
        }
    };

    handleDayToggle = (dayValue) => {
        this.setState(prevState => {
            const selectedDays = prevState.selectedDays.includes(dayValue)
                ? prevState.selectedDays.filter(d => d !== dayValue)
                : [...prevState.selectedDays, dayValue];
            return { selectedDays };
        });
    };

    handleSelectAllDays = () => {
        this.setState(prevState => ({
            selectedDays: prevState.selectedDays.length === this.dayOptions.length
                ? []
                : this.dayOptions.map(d => d.value)
        }));
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        const { selectedDays, selectedShift, room } = this.state;

        if (selectedDays.length === 0) {
            alert('Vui lòng chọn ít nhất một ngày trong tuần');
            return;
        }

        if (!selectedShift) {
            alert('Vui lòng chọn ca làm việc');
            return;
        }

        const shift = this.shiftOptions.find(s => s.value === selectedShift);

        try {
            this.setState({ loading: true });

            const promises = selectedDays.map(day_of_week => {
                return api.post('/api/doctor/my-schedules', {
                    day_of_week,
                    start_time: shift.start_time,
                    end_time: shift.end_time,
                    break_start: shift.break_start,
                    break_end: shift.break_end,
                    room: room || null,
                    is_active: true
                });
            });

            const results = await Promise.allSettled(promises);

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            if (succeeded > 0) {
                alert(`✅ Đã tạo ${succeeded} lịch làm việc thành công${failed > 0 ? `. ${failed} lịch bị lỗi (có thể đã tồn tại)` : ''}. Đang chờ admin phê duyệt.`);
            } else {
                alert('❌ Không tạo được lịch nào. Có thể các ngày này đã có lịch.');
            }

            // Reset form
            this.setState({
                selectedDays: [],
                selectedShift: 'morning',
                room: ''
            });
            this.fetchMySchedules();
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || error.message));
        } finally {
            this.setState({ loading: false });
        }
    };

    handleDelete = async (scheduleId) => {
        if (!window.confirm('Bạn có chắc muốn xóa lịch này?')) return;

        try {
            const response = await api.delete(`/api/doctor/my-schedules/${scheduleId}`);
            if (response.data.success) {
                alert('Xóa lịch thành công');
                this.fetchMySchedules();
            }
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || error.message));
        }
    };

    handleToggleActive = async (scheduleId) => {
        try {
            const response = await api.patch(`/api/doctor/my-schedules/${scheduleId}/toggle`);
            if (response.data.success) {
                alert(response.data.message);
                this.fetchMySchedules();
            }
        } catch (error) {
            alert('Lỗi khi thay đổi trạng thái: ' + (error.response?.data?.message || error.message));
        }
    };

    getShiftLabel = (schedule) => {
        const start = schedule.start_time?.substring(0, 5);
        const end = schedule.end_time?.substring(0, 5);

        if (start === '07:00' && end === '12:00') return '🌅 Ca Sáng';
        if (start === '13:00' && end === '17:00') return '🌆 Ca Chiều';
        if (start === '07:00' && end === '17:00') return '☀️ Cả Ngày';
        return `🕐 ${start} - ${end}`;
    };

    render() {
        const { schedules, loading, doctor, selectedDays, selectedShift, room } = this.state;
        const { dayOptions, shiftOptions } = this;

        // Nhóm lịch theo ngày trong tuần
        const schedulesByDay = {};
        dayOptions.forEach(day => {
            schedulesByDay[day.value] = schedules.filter(s => s.day_of_week === day.value);
        });

        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>🏥 Đăng Ký Lịch Làm Việc Theo Tuần</h1>
                    {doctor && (
                        <div className={styles.doctorInfo}>
                            <p><strong>Bác sĩ:</strong> {doctor.full_name}</p>
                            {doctor.specialty && (
                                <p><strong>Chuyên khoa:</strong> {doctor.specialty.name}</p>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.content}>
                    {/* Form đăng ký theo tuần */}
                    <div className={styles.formSection}>
                        <h2>➕ Đăng Ký Lịch Mới</h2>
                        <form onSubmit={this.handleSubmit} className={styles.form}>

                            {/* Bước 1: Chọn ngày */}
                            <div className={styles.stepSection}>
                                <h3>Bước 1: Chọn các ngày trong tuần</h3>
                                <div className={styles.daySelection}>
                                    <div className={styles.selectAllWrapper}>
                                        <button
                                            type="button"
                                            onClick={this.handleSelectAllDays}
                                            className={styles.selectAllBtn}
                                        >
                                            {selectedDays.length === dayOptions.length ? '✅ Bỏ chọn tất cả' : '☑️ Chọn tất cả'}
                                        </button>
                                        <span className={styles.selectedCount}>
                                            Đã chọn: <strong>{selectedDays.length}</strong> ngày
                                        </span>
                                    </div>

                                    <div className={styles.dayGrid}>
                                        {dayOptions.map(day => (
                                            <label
                                                key={day.value}
                                                className={`${styles.dayCheckbox} ${selectedDays.includes(day.value) ? styles.checked : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDays.includes(day.value)}
                                                    onChange={() => this.handleDayToggle(day.value)}
                                                />
                                                <span className={styles.dayLabel}>{day.label}</span>
                                                <span className={styles.checkIcon}>✓</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Bước 2: Chọn ca */}
                            <div className={styles.stepSection}>
                                <h3>Bước 2: Chọn ca làm việc</h3>
                                <div className={styles.shiftSelection}>
                                    {shiftOptions.map(shift => (
                                        <label
                                            key={shift.value}
                                            className={`${styles.shiftCard} ${selectedShift === shift.value ? styles.selected : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name="shift"
                                                value={shift.value}
                                                checked={selectedShift === shift.value}
                                                onChange={(e) => this.setState({ selectedShift: e.target.value })}
                                            />
                                            <div className={styles.shiftIcon}>{shift.icon}</div>
                                            <div className={styles.shiftLabel}>{shift.label}</div>
                                            <div className={styles.shiftTime}>{shift.time}</div>
                                            {shift.break_start && (
                                                <div className={styles.shiftBreak}>
                                                    ☕ Nghỉ: {shift.break_start} - {shift.break_end}
                                                </div>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Bước 3: Phòng khám (tùy chọn) */}
                            <div className={styles.stepSection}>
                                <h3>Bước 3: Phòng khám (tùy chọn)</h3>
                                <input
                                    type="text"
                                    value={room}
                                    onChange={(e) => this.setState({ room: e.target.value })}
                                    placeholder="Vd: Phòng 101, Phòng khám đa khoa..."
                                    className={styles.roomInput}
                                />
                            </div>

                            {/* Submit button */}
                            <div className={styles.formActions}>
                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={loading || selectedDays.length === 0}
                                >
                                    {loading ? '⏳ Đang xử lý...' : '✅ Đăng Ký Lịch Làm Việc'}
                                </button>
                            </div>

                            <div className={styles.noteBox}>
                                <p>📝 <strong>Lưu ý:</strong></p>
                                <ul>
                                    <li>Lịch đăng ký sẽ được gửi đến admin để phê duyệt</li>
                                    <li>Bạn sẽ nhận được thông báo khi lịch được duyệt/từ chối</li>
                                    <li>Không thể đăng ký trùng ngày đã có lịch</li>
                                </ul>
                            </div>
                        </form>
                    </div>

                    {/* Danh sách lịch làm việc hiện tại */}
                    <div className={styles.scheduleSection}>
                        <h2>📅 Lịch Làm Việc Hiện Tại</h2>

                        {loading ? (
                            <div className={styles.loading}>Đang tải...</div>
                        ) : schedules.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>Bạn chưa đăng ký lịch làm việc nào.</p>
                                <p>Vui lòng điền form bên trên để tạo lịch mới.</p>
                            </div>
                        ) : (
                            <div className={styles.scheduleGrid}>
                                {dayOptions.map(day => {
                                    const daySchedules = schedulesByDay[day.value];
                                    const hasSchedules = daySchedules && daySchedules.length > 0;

                                    return (
                                        <div key={day.value} className={styles.dayColumn}>
                                            <h3 className={styles.dayHeader}>{day.label}</h3>

                                            {!hasSchedules ? (
                                                <div className={styles.emptyDay}>
                                                    <p>Chưa có lịch</p>
                                                </div>
                                            ) : (
                                                <div className={styles.daySchedules}>
                                                    {daySchedules.map(schedule => (
                                                        <div key={schedule.id} className={styles.scheduleCard}>
                                                            {/* Badge trạng thái */}
                                                            <div className={styles.cardBadges}>
                                                                {schedule.approval_status === 'pending' && (
                                                                    <span className={`${styles.badge} ${styles.badgePending}`}>
                                                                        ⏳ Chờ duyệt
                                                                    </span>
                                                                )}
                                                                {schedule.approval_status === 'approved' && (
                                                                    <>
                                                                        <span className={`${styles.badge} ${styles.badgeApproved}`}>
                                                                            ✅ Đã duyệt
                                                                        </span>
                                                                        {schedule.is_active ? (
                                                                            <span className={`${styles.badge} ${styles.badgeActive}`}>
                                                                                🟢 Hoạt động
                                                                            </span>
                                                                        ) : (
                                                                            <span className={`${styles.badge} ${styles.badgeInactive}`}>
                                                                                ⏸️ Tạm dừng
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                )}
                                                                {schedule.approval_status === 'rejected' && (
                                                                    <span className={`${styles.badge} ${styles.badgeRejected}`}>
                                                                        ❌ Từ chối
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Thông tin ca */}
                                                            <div className={styles.cardBody}>
                                                                <div className={styles.shiftInfo}>
                                                                    {this.getShiftLabel(schedule)}
                                                                </div>
                                                                {schedule.room && (
                                                                    <div className={styles.roomInfo}>
                                                                        🚪 {schedule.room}
                                                                    </div>
                                                                )}

                                                                {/* Lý do từ chối */}
                                                                {schedule.approval_status === 'rejected' && schedule.rejection_reason && (
                                                                    <div className={styles.rejectionInfo}>
                                                                        <strong>Lý do:</strong> {schedule.rejection_reason}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Actions */}
                                                            {schedule.approval_status !== 'rejected' && (
                                                                <div className={styles.cardActions}>
                                                                    {schedule.approval_status === 'approved' && (
                                                                        <button
                                                                            onClick={() => this.handleToggleActive(schedule.id)}
                                                                            className={styles.toggleBtn}
                                                                            title={schedule.is_active ? "Tạm dừng" : "Kích hoạt"}
                                                                        >
                                                                            {schedule.is_active ? '⏸️' : '▶️'}
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => this.handleDelete(schedule.id)}
                                                                        className={styles.deleteBtn}
                                                                        title="Xóa"
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default DoctorSelfScheduleWeekly;
