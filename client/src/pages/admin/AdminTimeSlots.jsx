import React, { Component } from 'react';
import api from '../../utils/api';
import styles from './AdminTimeSlots.module.css';

function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getWeekDates(startDate) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        dates.push(d);
    }
    return dates;
}

function generateSlotsFromSchedule(schedule, slotDuration = 30) {
    if (!schedule) return [];
    const slots = [];
    const [startHour, startMin] = schedule.start_time.split(':').map(Number);
    const [endHour, endMin] = schedule.end_time.split(':').map(Number);

    let breakStart = null, breakEnd = null;
    if (schedule.break_start && schedule.break_end) {
        const [bsH, bsM] = schedule.break_start.split(':').map(Number);
        const [beH, beM] = schedule.break_end.split(':').map(Number);
        breakStart = bsH * 60 + bsM;
        breakEnd = beH * 60 + beM;
    }

    let current = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;

    while (current + slotDuration <= end) {
        const slotStart = current;
        const slotEnd = current + slotDuration;

        if (breakStart !== null && breakEnd !== null) {
            if (slotStart < breakEnd && slotEnd > breakStart) {
                current += slotDuration;
                continue;
            }
        }

        const startStr = `${String(Math.floor(slotStart / 60)).padStart(2, '0')}:${String(slotStart % 60).padStart(2, '0')}`;
        const endStr = `${String(Math.floor(slotEnd / 60)).padStart(2, '0')}:${String(slotEnd % 60).padStart(2, '0')}`;

        slots.push({ start: startStr, end: endStr });
        current += slotDuration;
    }

    return slots;
}

class AdminTimeSlots extends Component {
    constructor(props) {
        super(props);
        this.state = {
            doctors: [],
            specialties: [],
            loading: false,
            selectedDoctor: '',
            selectedSpecialty: 'all',
            searchDoctor: '',
            currentWeekStart: getMonday(new Date()),
            doctorSchedule: [],
            weekData: {},
            lockedSlots: {}
        };

        this.dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        this.dayOptions = [
            { value: 'Thứ 2', index: 1 },
            { value: 'Thứ 3', index: 2 },
            { value: 'Thứ 4', index: 3 },
            { value: 'Thứ 5', index: 4 },
            { value: 'Thứ 6', index: 5 },
            { value: 'Thứ 7', index: 6 },
            { value: 'Chủ nhật', index: 0 }
        ];
    }

    componentDidMount() {
        this.fetchDoctors();
        this.fetchSpecialties();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.selectedDoctor !== this.state.selectedDoctor && this.state.selectedDoctor) {
            this.fetchDoctorSchedule();
        }
        if (
            this.state.selectedDoctor && this.state.doctorSchedule.length > 0 &&
            (prevState.selectedDoctor !== this.state.selectedDoctor ||
                prevState.currentWeekStart !== this.state.currentWeekStart ||
                prevState.doctorSchedule !== this.state.doctorSchedule)
        ) {
            this.fetchWeekData();
        }
    }

    fetchDoctors = async () => {
        try {
            const response = await api.get('/api/admin/doctor-schedules/doctors-list');
            this.setState({ doctors: response.data });
        } catch (error) {
            console.error('Lỗi lấy danh sách bác sĩ:', error);
        }
    };

    fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            this.setState({ specialties: response.data });
        } catch (error) {
            console.error('Lỗi lấy chuyên khoa:', error);
        }
    };

    fetchDoctorSchedule = async () => {
        try {
            const response = await api.get(`/api/admin/doctor-schedules/${this.state.selectedDoctor}`);
            this.setState({ doctorSchedule: response.data || [] });
        } catch (error) {
            console.error('Lỗi lấy lịch bác sĩ:', error);
            this.setState({ doctorSchedule: [] });
        }
    };

    fetchWeekData = async () => {
        const { selectedDoctor, currentWeekStart, doctorSchedule } = this.state;
        if (!selectedDoctor) return;

        try {
            this.setState({ loading: true });
            const weekDates = getWeekDates(currentWeekStart);
            const data = {};
            const locked = {};

            const scheduleByDay = {};
            doctorSchedule.forEach(s => {
                const dayIndex = this.dayOptions.find(d => d.value === s.day_of_week)?.index;
                if (dayIndex !== undefined) {
                    scheduleByDay[dayIndex] = s;
                }
            });

            await Promise.all(weekDates.map(async (date) => {
                const dateStr = date.toISOString().split('T')[0];
                const dayIndex = date.getDay();
                const schedule = scheduleByDay[dayIndex];

                if (!schedule || !schedule.is_active) {
                    data[dateStr] = { hasSchedule: false, slots: [], bookings: [] };
                    return;
                }

                const generatedSlots = generateSlotsFromSchedule(schedule);

                try {
                    const bookingsRes = await api.get('/api/admin/bookings', {
                        params: {
                            doctor_id: selectedDoctor,
                            appointment_date: dateStr,
                            status: 'pending,confirmed'
                        }
                    });
                    const bookings = bookingsRes.data?.data || bookingsRes.data || [];

                    try {
                        const lockedRes = await api.get('/api/admin/time-slots', {
                            params: { doctor_id: selectedDoctor, date: dateStr }
                        });
                        const lockedData = lockedRes.data?.data || lockedRes.data || [];
                        lockedData.forEach(slot => {
                            if (!slot.is_available) {
                                const key = `${dateStr}_${slot.start_time.substring(0, 5)}`;
                                locked[key] = { id: slot.id, reason: slot.note || 'Đã khóa' };
                            }
                        });
                    } catch (err) {
                        // Ignore - no locked slots
                    }

                    const slotsWithStatus = generatedSlots.map(slot => {
                        const booking = bookings.find(b =>
                            b.appointment_time && b.appointment_time.substring(0, 5) === slot.start
                        );
                        const lockedKey = `${dateStr}_${slot.start}`;
                        const isLocked = !!locked[lockedKey];

                        return {
                            ...slot,
                            isBooked: !!booking,
                            booking: booking || null,
                            isLocked,
                            lockedInfo: locked[lockedKey] || null
                        };
                    });

                    data[dateStr] = {
                        hasSchedule: true,
                        schedule,
                        slots: slotsWithStatus,
                        bookings
                    };
                } catch (err) {
                    data[dateStr] = {
                        hasSchedule: true,
                        schedule,
                        slots: generatedSlots.map(s => ({ ...s, isBooked: false, isLocked: false })),
                        bookings: []
                    };
                }
            }));

            this.setState({ weekData: data, lockedSlots: locked });
        } catch (error) {
            console.error('Lỗi lấy dữ liệu tuần:', error);
        } finally {
            this.setState({ loading: false });
        }
    };

    handleLockSlot = async (dateStr, slot) => {
        const { selectedDoctor } = this.state;
        if (slot.isLocked && slot.lockedInfo?.id) {
            try {
                await api.put(`/api/admin/time-slots/${slot.lockedInfo.id}`, { is_available: true });
                this.fetchWeekData();
            } catch (error) {
                alert('Lỗi mở khóa slot');
            }
        } else {
            try {
                await api.post('/api/admin/time-slots', {
                    doctor_id: selectedDoctor,
                    date: dateStr,
                    start_time: slot.start + ':00',
                    end_time: slot.end + ':00',
                    is_available: false,
                    max_patients: 1,
                    note: 'Khóa thủ công'
                });
                this.fetchWeekData();
            } catch (error) {
                try {
                    const existingRes = await api.get('/api/admin/time-slots', {
                        params: { doctor_id: selectedDoctor, date: dateStr }
                    });
                    const existing = (existingRes.data?.data || existingRes.data || [])
                        .find(s => s.start_time.substring(0, 5) === slot.start);
                    if (existing) {
                        await api.put(`/api/admin/time-slots/${existing.id}`, { is_available: false });
                        this.fetchWeekData();
                    }
                } catch (err2) {
                    alert('Lỗi khóa slot');
                }
            }
        }
    };

    handleLockDay = async (dateStr, lock = true) => {
        const { weekData, selectedDoctor } = this.state;
        const dayData = weekData[dateStr];
        if (!dayData || !dayData.hasSchedule) return;

        const action = lock ? 'Khóa' : 'Mở khóa';
        if (!window.confirm(`${action} TẤT CẢ khung giờ ngày ${new Date(dateStr).toLocaleDateString('vi-VN')}?`)) return;

        try {
            this.setState({ loading: true });
            for (const slot of dayData.slots) {
                if (slot.isBooked) continue;

                if (lock && !slot.isLocked) {
                    await api.post('/api/admin/time-slots', {
                        doctor_id: selectedDoctor,
                        date: dateStr,
                        start_time: slot.start + ':00',
                        end_time: slot.end + ':00',
                        is_available: false,
                        max_patients: 1,
                        note: 'Khóa cả ngày'
                    }).catch(() => { });
                } else if (!lock && slot.isLocked && slot.lockedInfo?.id) {
                    await api.put(`/api/admin/time-slots/${slot.lockedInfo.id}`, { is_available: true });
                }
            }
            this.fetchWeekData();
        } catch (error) {
            alert('Lỗi thao tác');
        } finally {
            this.setState({ loading: false });
        }
    };

    goToPreviousWeek = () => {
        const newStart = new Date(this.state.currentWeekStart);
        newStart.setDate(newStart.getDate() - 7);
        this.setState({ currentWeekStart: newStart });
    };

    goToNextWeek = () => {
        const newStart = new Date(this.state.currentWeekStart);
        newStart.setDate(newStart.getDate() + 7);
        this.setState({ currentWeekStart: newStart });
    };

    goToCurrentWeek = () => {
        this.setState({ currentWeekStart: getMonday(new Date()) });
    };

    getFilteredDoctors = () => {
        const { doctors, searchDoctor, selectedSpecialty } = this.state;
        return doctors.filter(doc => {
            const matchesSearch = doc.full_name.toLowerCase().includes(searchDoctor.toLowerCase()) ||
                doc.specialty?.name?.toLowerCase().includes(searchDoctor.toLowerCase());
            const matchesSpecialty = selectedSpecialty === 'all' || doc.specialty_id === parseInt(selectedSpecialty);
            return matchesSearch && matchesSpecialty;
        });
    };

    getSpecialtyCounts = () => {
        const counts = {};
        this.state.doctors.forEach(doc => {
            const specId = doc.specialty_id || 0;
            counts[specId] = (counts[specId] || 0) + 1;
        });
        return counts;
    };

    getScheduleStats = () => {
        const { doctorSchedule } = this.state;
        if (!doctorSchedule.length) return null;

        const activeDays = doctorSchedule.filter(s => s.is_active).length;
        const workHours = doctorSchedule.filter(s => s.is_active).map(s => {
            const [sh, sm] = s.start_time.split(':').map(Number);
            const [eh, em] = s.end_time.split(':').map(Number);
            return (eh * 60 + em - sh * 60 - sm) / 60;
        }).reduce((a, b) => a + b, 0);

        return { activeDays, workHours: workHours.toFixed(1) };
    };

    render() {
        const {
            doctors, specialties, loading, selectedDoctor, selectedSpecialty,
            searchDoctor, currentWeekStart, doctorSchedule, weekData
        } = this.state;

        const filteredDoctors = this.getFilteredDoctors();
        const specialtyCounts = this.getSpecialtyCounts();
        const scheduleStats = this.getScheduleStats();
        const selectedDoctorInfo = doctors.find(d => d.id === selectedDoctor);
        const weekDates = getWeekDates(currentWeekStart);
        const today = new Date().toISOString().split('T')[0];

        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1>Quản Lý Khung Giờ Khám</h1>
                        <p>Lịch làm việc định kỳ hàng tuần. Khóa/mở từng khung giờ khi cần thiết.</p>
                    </div>
                </div>

                {/* Info Banner */}
                <div className={styles.infoBanner}>
                    <span>Lưu ý</span>
                    <div>
                        <strong>Cách hoạt động:</strong> Lịch làm việc của bác sĩ được thiết lập định kỳ theo tuần (ví dụ: Thứ 2-6, 8h-17h).
                        Hệ thống tự động tạo khung giờ khám cho tất cả các tuần. Bạn chỉ cần khóa những slot đặc biệt khi bác sĩ nghỉ.
                    </div>
                </div>

                {/* Specialty Tabs */}
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

                <div className={styles.mainContent}>
                    {/* Sidebar: Doctor Selection */}
                    <div className={styles.sidebar}>
                        <h3>Chọn Bác Sĩ</h3>
                        <input
                            type="text"
                            placeholder="Tìm bác sĩ..."
                            value={searchDoctor}
                            onChange={(e) => this.setState({ searchDoctor: e.target.value })}
                            className={styles.searchInput}
                        />
                        <div className={styles.doctorsList}>
                            {filteredDoctors.map(doctor => (
                                <button
                                    key={doctor.id}
                                    className={`${styles.doctorBtn} ${selectedDoctor === doctor.id ? styles.selected : ''}`}
                                    onClick={() => this.setState({ selectedDoctor: doctor.id })}
                                >
                                    <span className={styles.doctorName}>{doctor.full_name}</span>
                                    <span className={styles.doctorSpecialty}>{doctor.specialty?.name}</span>
                                </button>
                            ))}
                            {filteredDoctors.length === 0 && <p className={styles.noData}>Không tìm thấy bác sĩ</p>}
                        </div>
                    </div>

                    {/* Content */}
                    <div className={styles.content}>
                        {selectedDoctor ? (
                            <>
                                {/* Doctor Info Header */}
                                <div className={styles.contentHeader}>
                                    <div className={styles.doctorInfo}>
                                        <span><strong>{selectedDoctorInfo?.full_name}</strong></span>
                                        <span className={styles.specialty}>({selectedDoctorInfo?.specialty?.name})</span>
                                    </div>
                                    <button className={styles.btnSchedule} onClick={() => window.location.href = '/admin/doctor-schedules'}>
                                        Sửa lịch định kỳ
                                    </button>
                                </div>

                                {/* Schedule Summary */}
                                {doctorSchedule.length > 0 ? (
                                    <div className={styles.scheduleSummary}>
                                        <h4>Lịch làm việc định kỳ:</h4>
                                        <div className={styles.scheduleGrid}>
                                            {this.dayOptions.map(day => {
                                                const schedule = doctorSchedule.find(s => s.day_of_week === day.value);
                                                const isActive = schedule?.is_active;
                                                return (
                                                    <div key={day.value} className={`${styles.scheduleDay} ${isActive ? styles.active : styles.inactive}`}>
                                                        <span className={styles.dayLabel}>{day.value}</span>
                                                        {isActive ? (
                                                            <span className={styles.dayTime}>
                                                                {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                                                            </span>
                                                        ) : (
                                                            <span className={styles.dayOffText}>Nghỉ</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {scheduleStats && (
                                            <p className={styles.scheduleNote}>
                                                Làm việc {scheduleStats.activeDays} ngày/tuần, tổng ~{scheduleStats.workHours}h/tuần
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className={styles.noSchedule}>
                                        <p>Bác sĩ chưa có lịch làm việc định kỳ</p>
                                        <button className={styles.btnSchedule} onClick={() => window.location.href = '/admin/doctor-schedules'}>
                                            Tạo lịch làm việc
                                        </button>
                                    </div>
                                )}

                                {/* Week View */}
                                {doctorSchedule.length > 0 && (
                                    <>
                                        <div className={styles.weekNavigation}>
                                            <button onClick={this.goToPreviousWeek}>◀ Tuần trước</button>
                                            <button onClick={this.goToCurrentWeek} className={styles.btnToday}>Tuần này</button>
                                            <span className={styles.weekRange}>
                                                {weekDates[0].toLocaleDateString('vi-VN')} - {weekDates[6].toLocaleDateString('vi-VN')}
                                            </span>
                                            <button onClick={this.goToNextWeek}>Tuần sau ▶</button>
                                        </div>

                                        {loading ? (
                                            <div className={styles.loading}>Đang tải...</div>
                                        ) : (
                                            <div className={styles.weekGrid}>
                                                {weekDates.map((date) => {
                                                    const dateStr = date.toISOString().split('T')[0];
                                                    const dayData = weekData[dateStr] || { hasSchedule: false, slots: [] };
                                                    const isToday = dateStr === today;
                                                    const isPast = dateStr < today;

                                                    const lockedCount = dayData.slots?.filter(s => s.isLocked).length || 0;
                                                    const bookedCount = dayData.slots?.filter(s => s.isBooked).length || 0;
                                                    const availableCount = dayData.slots?.filter(s => !s.isLocked && !s.isBooked).length || 0;

                                                    return (
                                                        <div key={dateStr} className={`${styles.dayColumn} ${isToday ? styles.today : ''} ${isPast ? styles.past : ''} ${!dayData.hasSchedule ? styles.noWork : ''}`}>
                                                            <div className={styles.dayHeader}>
                                                                <div className={styles.dayName}>{this.dayNames[date.getDay()]}</div>
                                                                <div className={styles.dayDate}>{date.getDate()}/{date.getMonth() + 1}</div>
                                                                {isToday && <span className={styles.todayBadge}>Hôm nay</span>}
                                                            </div>

                                                            {dayData.hasSchedule ? (
                                                                <>
                                                                    <div className={styles.dayStats}>
                                                                        <span title="Còn trống" className={styles.available}>Trống: {availableCount}</span>
                                                                        {bookedCount > 0 && <span title="Có lịch hẹn" className={styles.booked}>Đặt: {bookedCount}</span>}
                                                                        {lockedCount > 0 && <span title="Đã khóa" className={styles.locked}>Khóa: {lockedCount}</span>}
                                                                    </div>

                                                                    <div className={styles.daySlots}>
                                                                        {dayData.slots.map((slot, idx) => (
                                                                            <div
                                                                                key={idx}
                                                                                className={`${styles.slotItem} ${slot.isLocked ? styles.disabled : ''} ${slot.isBooked ? styles.hasBooking : ''}`}
                                                                                title={slot.isBooked ? `Đã đặt: ${slot.booking?.patient?.full_name || 'Khách'}` : slot.isLocked ? 'Đã khóa' : 'Còn trống'}
                                                                            >
                                                                                <span className={styles.slotTime}>{slot.start}</span>
                                                                                {!isPast && !slot.isBooked && (
                                                                                    <button
                                                                                        className={styles.slotLockBtn}
                                                                                        onClick={() => this.handleLockSlot(dateStr, slot)}
                                                                                        title={slot.isLocked ? 'Mở khóa' : 'Khóa'}
                                                                                    >
                                                                                        {slot.isLocked ? 'Mở' : 'Khóa'}
                                                                                    </button>
                                                                                )}
                                                                                {slot.isBooked && <span className={styles.bookedIcon}>Đặt</span>}
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {!isPast && (
                                                                        <div className={styles.dayActions}>
                                                                            <button
                                                                                className={styles.btnDayAction}
                                                                                onClick={() => this.handleLockDay(dateStr, true)}
                                                                                title="Khóa cả ngày"
                                                                            >
                                                                                Khóa ngày
                                                                            </button>
                                                                            <button
                                                                                className={styles.btnDayAction}
                                                                                onClick={() => this.handleLockDay(dateStr, false)}
                                                                                title="Mở khóa cả ngày"
                                                                            >
                                                                                Mở
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div className={styles.dayOffContent}>
                                                                    <span>Nghỉ</span>
                                                                    <span>Không làm việc</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Legend */}
                                        <div className={styles.legend}>
                                            <div className={styles.legendItem}>
                                                <span className={`${styles.legendColor} ${styles.legendAvailable}`}></span>
                                                <span>Còn trống</span>
                                            </div>
                                            <div className={styles.legendItem}>
                                                <span className={`${styles.legendColor} ${styles.legendBooked}`}></span>
                                                <span>Đã đặt lịch</span>
                                            </div>
                                            <div className={styles.legendItem}>
                                                <span className={`${styles.legendColor} ${styles.legendLocked}`}></span>
                                                <span>Đã khóa</span>
                                            </div>
                                            <div className={styles.legendItem}>
                                                <span className={`${styles.legendColor} ${styles.legendOff}`}></span>
                                                <span>Ngày nghỉ</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className={styles.placeholder}>
                                <div className={styles.placeholderIcon}>👈</div>
                                <p>Vui lòng chọn bác sĩ để xem và quản lý khung giờ</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default AdminTimeSlots;
