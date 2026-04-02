import React, { Component } from 'react';
import api from '../../utils/api';
import styles from './DoctorSelfSchedule.module.css';

const dayOptions = [
    { value: 'Thứ 2', label: 'Thứ 2' },
    { value: 'Thứ 3', label: 'Thứ 3' },
    { value: 'Thứ 4', label: 'Thứ 4' },
    { value: 'Thứ 5', label: 'Thứ 5' },
    { value: 'Thứ 6', label: 'Thứ 6' },
    { value: 'Thứ 7', label: 'Thứ 7' },
    { value: 'Chủ nhật', label: 'Chủ nhật' }
];

const shiftOptions = [
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

class DoctorSelfSchedule extends Component {
    constructor(props) {
        super(props);
        this.state = {
            schedules: [],
            loading: false,
            doctor: null,
            rooms: [],
            // selectedSlots: { 'Thứ 2': { morning: true, afternoon: false }, ... }
            selectedSlots: {},
            room: ''
        };
    }

    componentDidMount() {
        this.fetchMyProfile();
        this.fetchMySchedules();
        this.fetchRooms();
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

    fetchRooms = async () => {
        try {
            const response = await api.get('/api/doctor/rooms');
            if (response.data.success) {
                this.setState({ rooms: response.data.rooms });
            }
        } catch (error) {
            console.error('Lỗi lấy danh sách phòng:', error);
        }
    };

    handleSlotToggle = (day, shift) => {
        this.setState(prevState => {
            const prev = prevState.selectedSlots;
            const daySlots = { ...(prev[day] || {}) };
            daySlots[shift] = !daySlots[shift];
            return { selectedSlots: { ...prev, [day]: daySlots } };
        });
    };

    handleSelectAllForDay = (day) => {
        this.setState(prevState => {
            const daySlots = prevState.selectedSlots[day] || {};
            const allSelected = shiftOptions.every(s => daySlots[s.value]);
            const newDaySlots = {};
            shiftOptions.forEach(s => { newDaySlots[s.value] = !allSelected; });
            return { selectedSlots: { ...prevState.selectedSlots, [day]: newDaySlots } };
        });
    };

    handleSelectAllForShift = (shift) => {
        this.setState(prevState => {
            const prev = prevState.selectedSlots;
            const allSelected = dayOptions.every(d => (prev[d.value] || {})[shift]);
            const newSlots = { ...prev };
            dayOptions.forEach(d => {
                newSlots[d.value] = { ...(newSlots[d.value] || {}), [shift]: !allSelected };
            });
            return { selectedSlots: newSlots };
        });
    };

    handleSelectAll = () => {
        this.setState(prevState => {
            const allSelected = dayOptions.every(d =>
                shiftOptions.every(s => (prevState.selectedSlots[d.value] || {})[s.value])
            );
            const newSlots = {};
            dayOptions.forEach(d => {
                newSlots[d.value] = {};
                shiftOptions.forEach(s => { newSlots[d.value][s.value] = !allSelected; });
            });
            return { selectedSlots: newSlots };
        });
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        const { selectedSlots, room } = this.state;

        // Collect all selected day+shift combinations
        const entries = [];
        dayOptions.forEach(day => {
            shiftOptions.forEach(shift => {
                if (selectedSlots[day.value]?.[shift.value]) {
                    entries.push({ day_of_week: day.value, shift });
                }
            });
        });

        if (entries.length === 0) {
            alert('Vui lòng chọn ít nhất một ô ngày + ca làm việc');
            return;
        }

        try {
            this.setState({ loading: true });

            const promises = entries.map(({ day_of_week, shift }) => {
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

            this.setState({ selectedSlots: {}, room: '' });
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

    getRegistrationWindowInfo() {
        // Tính thời gian Việt Nam (UTC+7)
        const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
        const dayOfWeek = vnNow.getUTCDay(); // 0=CN, 6=T7
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Thứ 7 hoặc Chủ nhật

        // Tính tuần đăng ký (tuần sau)
        const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
        const nextMonday = new Date(vnNow);
        nextMonday.setUTCDate(vnNow.getUTCDate() + daysUntilMonday);
        const nextSunday = new Date(nextMonday);
        nextSunday.setUTCDate(nextMonday.getUTCDate() + 6);

        const fmtDate = (d) =>
            `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;

        // ✅ Tính ngày cụ thể cho từng ngày trong tuần
        const weekDates = {};
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        for (let i = 0; i < 7; i++) {
            const date = new Date(nextMonday);
            date.setUTCDate(nextMonday.getUTCDate() + i);
            const dayName = dayNames[(i + 1) % 7]; // Monday = index 1 in dayNames
            weekDates[dayName] = fmtDate(date);
        }

        // Tính thứ 7 tiếp theo (khi cửa sổ đóng)
        const daysToNextSat = (6 - dayOfWeek + 7) % 7 || 7;
        const nextSat = new Date(vnNow);
        nextSat.setUTCDate(vnNow.getUTCDate() + daysToNextSat);

        return {
            isWeekend,
            nextWeekFrom: fmtDate(nextMonday),
            nextWeekTo: fmtDate(nextSunday),
            nextOpenDate: fmtDate(nextSat),
            weekDates // { 'Thứ 2': '01/04/2026', 'Thứ 3': '02/04/2026', ... }
        };
    }

    render() {
        const { schedules, loading, doctor, rooms, selectedSlots, room } = this.state;
        const { isWeekend, nextWeekFrom, nextWeekTo, nextOpenDate, weekDates } = this.getRegistrationWindowInfo();

        const totalSelected = dayOptions.reduce((total, day) =>
            total + shiftOptions.filter(s => selectedSlots[day.value]?.[s.value]).length, 0
        );
        const allSelected = dayOptions.every(d =>
            shiftOptions.every(s => selectedSlots[d.value]?.[s.value])
        );

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
                    {/* Banner cửa sổ đăng ký lịch */}
                    {isWeekend ? (
                        <div className={styles.windowBannerOpen}>
                            <span className={styles.windowBannerIcon}>🟢</span>
                            <div>
                                <strong>Cửa sổ đăng ký đang mở</strong>
                                <span> — Bạn đang đăng ký lịch làm việc cho tuần&nbsp;</span>
                                <strong>{nextWeekFrom} – {nextWeekTo}</strong>
                                <span className={styles.windowBannerNote}>&nbsp;Admin sẽ duyệt lịch của bạn sau khi gửi.</span>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.windowBannerClosed} style={{ opacity: 0.85 }}>
                            <span className={styles.windowBannerIcon}>🟡</span>
                            <div>
                                <strong>Khuyến nghị đăng ký cuối tuần</strong>
                                <span> — Bạn vẫn có thể đăng ký lịch bất kỳ lúc nào, nhưng nên đăng ký vào <strong>Thứ 7 và Chủ nhật</strong> để admin duyệt kịp.</span>
                                <span className={styles.windowBannerNote}>&nbsp;Cuối tuần tới mở vào: <strong>{nextOpenDate}</strong></span>
                            </div>
                        </div>
                    )}

                    {/* Form đăng ký theo tuần */}
                    <div className={styles.formSection}>
                        <h2>➕ Đăng Ký Lịch Mới</h2>
                        <form onSubmit={this.handleSubmit} className={styles.form}>

                            {/* Bước 1: Ma trận chọn Ngày × Ca */}
                            <div className={styles.stepSection}>
                                <h3>Bước 1: Chọn từng ca cho từng ngày</h3>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                                    Tick vào ô giao giữa ngày và ca để đăng ký. Bấm vào tên ngày để chọn/bỏ cả hàng, bấm vào tên ca để chọn/bỏ cả cột.
                                </p>

                                <div className={styles.matrixWrapper}>
                                    <table className={styles.scheduleMatrixTable}>
                                        <thead>
                                            <tr>
                                                <th className={styles.matrixCorner}>
                                                    <button
                                                        type="button"
                                                        onClick={this.handleSelectAll}
                                                        className={styles.matrixSelectAllBtn}
                                                        title={allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                                    >
                                                        {allSelected ? '✅ Tất cả' : '☑️ Tất cả'}
                                                    </button>
                                                </th>
                                                {shiftOptions.map(shift => {
                                                    const colAll = dayOptions.every(d => selectedSlots[d.value]?.[shift.value]);
                                                    return (
                                                        <th key={shift.value} className={styles.matrixShiftHeader}>
                                                            <button
                                                                type="button"
                                                                onClick={() => this.handleSelectAllForShift(shift.value)}
                                                                className={`${styles.matrixColBtn} ${colAll ? styles.matrixColBtnActive : ''}`}
                                                            >
                                                                <span className={styles.matrixShiftIcon}>{shift.icon}</span>
                                                                <span className={styles.matrixShiftName}>{shift.label}</span>
                                                                <span className={styles.matrixShiftTime}>{shift.time}</span>
                                                                {shift.break_start && (
                                                                    <span className={styles.matrixShiftBreak}>☕ {shift.break_start}-{shift.break_end}</span>
                                                                )}
                                                            </button>
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dayOptions.map(day => {
                                                const rowAll = shiftOptions.every(s => selectedSlots[day.value]?.[s.value]);
                                                return (
                                                    <tr key={day.value}>
                                                        <td className={styles.matrixDayCell}>
                                                            <button
                                                                type="button"
                                                                onClick={() => this.handleSelectAllForDay(day.value)}
                                                                className={`${styles.matrixRowBtn} ${rowAll ? styles.matrixRowBtnActive : ''}`}
                                                            >
                                                                <span className={styles.matrixDayName}>{day.label}</span>
                                                                {weekDates && weekDates[day.value] && (
                                                                    <span className={styles.matrixDayDate}>{weekDates[day.value]}</span>
                                                                )}
                                                            </button>
                                                        </td>
                                                        {shiftOptions.map(shift => {
                                                            const checked = !!selectedSlots[day.value]?.[shift.value];
                                                            return (
                                                                <td key={shift.value} className={styles.matrixCell}>
                                                                    <label className={`${styles.matrixCheckCell} ${checked ? styles.matrixCheckCellActive : ''}`}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={checked}
                                                                            onChange={() => this.handleSlotToggle(day.value, shift.value)}
                                                                        />
                                                                        <span className={styles.matrixCheckMark}>
                                                                            {checked ? '✓' : ''}
                                                                        </span>
                                                                    </label>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className={styles.matrixSummary}>
                                    Đã chọn: <strong>{totalSelected}</strong> ca làm việc
                                    {totalSelected > 0 && (
                                        <span className={styles.matrixSummaryDetail}>
                                            &nbsp;({dayOptions
                                                .filter(d => shiftOptions.some(s => selectedSlots[d.value]?.[s.value]))
                                                .map(d => {
                                                    const shifts = shiftOptions.filter(s => selectedSlots[d.value]?.[s.value]).map(s => s.label).join(', ');
                                                    return `${d.label}: ${shifts}`;
                                                })
                                                .join(' | ')}
                                            )
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Bước 2: Phòng khám (tùy chọn) */}
                            <div className={styles.stepSection}>
                                <h3>Bước 2: Chọn phòng khám (tùy chọn)</h3>
                                <select
                                    value={room}
                                    onChange={(e) => this.setState({ room: e.target.value })}
                                    className={styles.roomSelect}
                                >
                                    <option value="">-- Chưa chọn phòng --</option>
                                    {rooms.map(r => (
                                        <option key={r.id} value={r.name}>
                                            {r.room_number ? `Phòng ${r.room_number}` : r.name}
                                            {r.floor && ` - Tầng ${r.floor}`}
                                            {r.specialty && ` (${r.specialty.name})`}
                                        </option>
                                    ))}
                                </select>
                                <p className={styles.roomNote}>
                                    💡 Nếu không chọn phòng, Admin sẽ sắp xếp phòng cho bạn sau khi duyệt lịch
                                </p>
                            </div>

                            {/* Submit button */}
                            <div className={styles.formActions}>
                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={loading || totalSelected === 0}
                                >
                                    {loading ? '⏳ Đang xử lý...' : '✅ Đăng Ký Lịch Làm Việc'}
                                </button>
                                {/* form always enabled */}
                            </div>

                            <div className={styles.noteBox}>
                                <p>📝 <strong>Lưu ý:</strong></p>
                                <ul>
                                    <li>Tick vào ô giao giữa <strong>ngày</strong> và <strong>ca</strong> để đăng ký ca đó</li>
                                    <li>Bấm tên ngày (Thứ 2, Thứ 3...) để chọn/bỏ tất cả ca trong ngày đó</li>
                                    <li>Bấm tên ca (Ca Sáng, Ca Chiều) để chọn/bỏ ca đó cho toàn bộ các ngày</li>
                                    <li>Lịch đăng ký sẽ được gửi đến admin để phê duyệt</li>
                                    <li>Không thể đăng ký trùng ngày + ca đã có lịch</li>
                                    <li>Nếu không đăng ký trước Chủ nhật, hệ thống sẽ tự xếp lịch full tuần (Thứ 2–6) vào sáng thứ 2</li>
                                </ul>
                            </div>
                        </form>
                    </div>

                    {/* Danh sách lịch làm việc hiện tại */}
                    <div className={styles.scheduleSection}>
                        <div className={styles.scheduleSectionHeader}>
                            <h2>📋 Lịch Làm Việc Đã Đăng Ký</h2>
                            <div className={styles.scheduleSummaryChips}>
                                <span className={styles.chipPending}>⏳ Chờ duyệt: {schedules.filter(s => s.approval_status === 'pending').length}</span>
                                <span className={styles.chipApproved}>✅ Đã duyệt: {schedules.filter(s => s.approval_status === 'approved').length}</span>
                                <span className={styles.chipRejected}>❌ Từ chối: {schedules.filter(s => s.approval_status === 'rejected').length}</span>
                            </div>
                        </div>

                        {loading ? (
                            <div className={styles.loading}>Đang tải...</div>
                        ) : schedules.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>Bạn chưa đăng ký lịch làm việc nào.</p>
                                <p>Vui lòng dùng form bên trên để tạo lịch mới.</p>
                            </div>
                        ) : (
                            <div className={styles.tableWrapper}>
                                <table className={styles.scheduleTable}>
                                    <thead>
                                        <tr>
                                            <th>Ngày trong tuần</th>
                                            <th>Ca làm việc</th>
                                            <th>Giờ làm</th>
                                            <th>Phòng</th>
                                            <th>Trạng thái</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dayOptions.map(day => {
                                            const daySchedules = schedulesByDay[day.value];
                                            if (!daySchedules || daySchedules.length === 0) return null;
                                            return daySchedules.map((schedule, idx) => (
                                                <tr key={schedule.id} className={schedule.approval_status === 'rejected' ? styles.rowRejected : ''}>
                                                    {idx === 0 && (
                                                        <td rowSpan={daySchedules.length} className={styles.tdDay}>
                                                            <div className={styles.dayColumn}>
                                                                <span className={styles.dayBadge}>{day.label}</span>
                                                                {weekDates && weekDates[day.value] && (
                                                                    <span className={styles.dayDateSmall}>{weekDates[day.value]}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td>{this.getShiftLabel(schedule)}</td>
                                                    <td className={styles.tdTime}>
                                                        {schedule.start_time?.substring(0, 5)} – {schedule.end_time?.substring(0, 5)}
                                                        {schedule.break_start && (
                                                            <div className={styles.breakNote}>☕ {schedule.break_start?.substring(0, 5)}–{schedule.break_end?.substring(0, 5)}</div>
                                                        )}
                                                    </td>
                                                    <td>{schedule.room || <span className={styles.noRoom}>–</span>}</td>
                                                    <td>
                                                        {schedule.approval_status === 'pending' && (
                                                            <span className={`${styles.statusBadge} ${styles.statusPending}`}>⏳ Chờ duyệt</span>
                                                        )}
                                                        {schedule.approval_status === 'approved' && (
                                                            <div className={styles.statusGroup}>
                                                                <span className={`${styles.statusBadge} ${styles.statusApproved}`}>✅ Đã duyệt</span>
                                                                {schedule.is_active
                                                                    ? <span className={`${styles.statusBadge} ${styles.statusActive}`}>🟢 Hoạt động</span>
                                                                    : <span className={`${styles.statusBadge} ${styles.statusInactive}`}>⏸️ Tạm dừng</span>
                                                                }
                                                            </div>
                                                        )}
                                                        {schedule.approval_status === 'rejected' && (
                                                            <div>
                                                                <span className={`${styles.statusBadge} ${styles.statusRejected}`}>❌ Từ chối</span>
                                                                {schedule.rejection_reason && (
                                                                    <div className={styles.rejectionNote}>{schedule.rejection_reason}</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className={styles.tdActions}>
                                                        {schedule.approval_status !== 'rejected' && (
                                                            <>
                                                                {schedule.approval_status === 'approved' && (
                                                                    <button
                                                                        onClick={() => this.handleToggleActive(schedule.id)}
                                                                        className={styles.btnToggle}
                                                                        title={schedule.is_active ? 'Tạm dừng' : 'Kích hoạt'}
                                                                    >
                                                                        {schedule.is_active ? '⏸️ Tạm dừng' : '▶️ Kích hoạt'}
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => this.handleDelete(schedule.id)}
                                                                    className={styles.btnDelete}
                                                                    title="Xóa"
                                                                >
                                                                    🗑️ Xóa
                                                                </button>
                                                            </>
                                                        )}
                                                        {schedule.approval_status === 'rejected' && (
                                                            <button
                                                                onClick={() => this.handleDelete(schedule.id)}
                                                                className={styles.btnDelete}
                                                                title="Xóa"
                                                            >
                                                                🗑️ Xóa
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ));
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default DoctorSelfSchedule;
