import React, { Component } from 'react';
import api from '../../utils/api';
import styles from './DoctorScheduleView.module.css';

// Hàm lấy ngày theo timezone local (tránh bug UTC)
const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

class DoctorScheduleView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            viewMode: 'week',
            selectedDate: getLocalDateString(new Date()),
            loading: false,
            weekData: [],
            workSchedule: [],
            workScheduleLoaded: false,
            stats: { total: 0, confirmed: 0, completed: 0, waiting: 0 }
        };
    }

    componentDidMount() {
        this.fetchWorkSchedule();
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            prevState.workScheduleLoaded !== this.state.workScheduleLoaded ||
            prevState.selectedDate !== this.state.selectedDate ||
            prevState.workSchedule !== this.state.workSchedule
        ) {
            if (this.state.workScheduleLoaded) {
                this.fetchWeekData();
            }
        }
    }

    fetchWorkSchedule = async () => {
        try {
            const response = await api.get('/api/doctor/work-schedule');
            this.setState({ workSchedule: response.data.schedules || [] });
        } catch (error) {
            console.error('Error fetching work schedule:', error);
        } finally {
            this.setState({ workScheduleLoaded: true });
        }
    };

    fetchWeekData = async () => {
        const { selectedDate } = this.state;
        try {
            this.setState({ loading: true });
            const { startDate, endDate } = this.getWeekRange(selectedDate);

            const response = await api.get(`/api/doctor/my-schedule?start_date=${startDate}&end_date=${endDate}`);
            const bookings = response.data.bookings || [];

            const grouped = this.groupByDate(bookings, startDate, endDate);
            this.setState({ weekData: grouped });

            this.calculateStats(bookings);
        } catch (error) {
            console.error('Error fetching week data:', error);
            const { startDate, endDate } = this.getWeekRange(selectedDate);
            const empty = this.groupByDate([], startDate, endDate);
            this.setState({ weekData: empty });
        } finally {
            this.setState({ loading: false });
        }
    };

    groupByDate = (bookings, startDate, endDate) => {
        const { workSchedule } = this.state;
        const days = [];
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
        const todayStr = getLocalDateString(new Date());

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = getLocalDateString(d);
            const dayName = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()];

            const workDay = workSchedule.find(w => w.day_of_week === dayName);
            const dayBookings = bookings.filter(b => b.appointment_date === dateStr);

            days.push({
                date: dateStr,
                dayName,
                dayNumber: d.getDate(),
                month: d.getMonth() + 1,
                isToday: dateStr === todayStr,
                workSchedule: workDay,
                bookings: dayBookings,
                stats: {
                    total: dayBookings.length,
                    waiting: dayBookings.filter(b => b.status.includes('waiting')).length,
                    confirmed: dayBookings.filter(b => b.status === 'confirmed').length,
                    completed: dayBookings.filter(b => b.status === 'completed').length
                }
            });
        }

        return days;
    };

    calculateStats = (data) => {
        const totals = data.reduce((acc, item) => {
            acc.total++;
            if (item.status === 'confirmed') acc.confirmed++;
            if (item.status === 'completed') acc.completed++;
            if (item.status.includes('waiting')) acc.waiting++;
            return acc;
        }, { total: 0, confirmed: 0, completed: 0, waiting: 0 });
        this.setState({ stats: totals });
    };

    getWeekRange = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);

        const monday = new Date(date.setDate(diff));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        return {
            startDate: getLocalDateString(monday),
            endDate: getLocalDateString(sunday)
        };
    };

    changeWeek = (direction) => {
        const newDate = new Date(this.state.selectedDate + 'T00:00:00');
        newDate.setDate(newDate.getDate() + (direction * 7));
        this.setState({ selectedDate: getLocalDateString(newDate) });
    };

    goToToday = () => {
        this.setState({ selectedDate: getLocalDateString(new Date()) });
    };

    getStatusBadge = (status) => {
        const statusMap = {
            'waiting_doctor_assignment': { text: 'Chờ gán', class: 'waiting' },
            'waiting_doctor_confirmation': { text: 'Chờ xác nhận', class: 'waiting' },
            'confirmed': { text: 'Đã xác nhận', class: 'confirmed' },
            'completed': { text: 'Hoàn thành', class: 'completed' },
            'cancelled': { text: 'Đã hủy', class: 'cancelled' }
        };
        const info = statusMap[status] || { text: status, class: 'default' };
        return <span className={`${styles.badge} ${styles[info.class]}`}>{info.text}</span>;
    };

    getPatientDisplay = (booking) => {
        const raw = booking.patient_name || booking.patient?.full_name || '';
        if (!raw || raw === 'N/A') return { name: 'Chưa có tên', isWalkIn: false };
        // Walk-in names generated with timestamp prefix
        if (raw.startsWith('WalkIn') || raw.startsWith('Walk-in')) {
            return { name: 'Khách vãng lai', isWalkIn: true };
        }
        return { name: raw, isWalkIn: false };
    };

    render() {
        const { selectedDate, loading, weekData, stats } = this.state;

        const { startDate, endDate } = this.getWeekRange(selectedDate);
        const wStart = new Date(startDate + 'T00:00:00');
        const wEnd = new Date(endDate + 'T00:00:00');
        const weekLabel = `${wStart.getDate()}/${wStart.getMonth() + 1} – ${wEnd.getDate()}/${wEnd.getMonth() + 1}/${wEnd.getFullYear()}`;

        return (
            <div className={styles.container}>
                {/* Top Bar */}
                <div className={styles.topBar}>
                    <div className={styles.topBarLeft}>
                        <h1 className={styles.pageTitle}>📅 Lịch Làm Việc</h1>
                        <span className={styles.weekLabel}>{weekLabel}</span>
                    </div>
                    <div className={styles.topBarRight}>
                        <div className={styles.statsRow}>
                            <div className={styles.statChip} style={{ background: '#e3f2fd', color: '#1565c0', borderColor: '#90caf9' }}>
                                <span className={styles.statNum}>{stats.total}</span>
                                <span className={styles.statTxt}>Lịch hẹn</span>
                            </div>
                            <div className={styles.statChip} style={{ background: '#fff8e1', color: '#f57f17', borderColor: '#ffe082' }}>
                                <span className={styles.statNum}>{stats.waiting}</span>
                                <span className={styles.statTxt}>Chờ xác nhận</span>
                            </div>
                            <div className={styles.statChip} style={{ background: '#e8f5e9', color: '#2e7d32', borderColor: '#a5d6a7' }}>
                                <span className={styles.statNum}>{stats.confirmed}</span>
                                <span className={styles.statTxt}>Đã xác nhận</span>
                            </div>
                            <div className={styles.statChip} style={{ background: '#f3e5f5', color: '#6a1b9a', borderColor: '#ce93d8' }}>
                                <span className={styles.statNum}>{stats.completed}</span>
                                <span className={styles.statTxt}>Hoàn thành</span>
                            </div>
                        </div>
                        <div className={styles.weekNav}>
                            <button onClick={() => this.changeWeek(-1)} className={styles.navBtn}>◀ Trước</button>
                            <button onClick={this.goToToday} className={styles.todayBtn}>Hôm nay</button>
                            <button onClick={() => this.changeWeek(1)} className={styles.navBtn}>Sau ▶</button>
                        </div>
                    </div>
                </div>

                {/* Week Calendar */}
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Đang tải lịch...</p>
                    </div>
                ) : (
                    <div className={styles.weekCalendar}>
                        {weekData.map((day) => (
                            <div
                                key={day.date}
                                className={`${styles.dayColumn} ${day.isToday ? styles.today : ''} ${!day.workSchedule ? styles.dayOff : ''}`}
                            >
                                {/* Day Header */}
                                <div className={styles.dayHeader}>
                                    <div className={styles.dayName}>{day.dayName}</div>
                                    <div className={styles.dayDate}>{day.dayNumber}/{day.month}</div>
                                    {day.isToday && <div className={styles.todayTag}>Hôm nay</div>}
                                    {day.bookings.length > 0 && (
                                        <div className={styles.bookingCountBadge}>{day.bookings.length} lịch</div>
                                    )}
                                </div>

                                {/* Work info bar */}
                                <div className={styles.workInfoBar}>
                                    {day.workSchedule ? (
                                        <>
                                            <span className={styles.workHoursBadge}>
                                                ⏰ {day.workSchedule.start_time.slice(0, 5)}–{day.workSchedule.end_time.slice(0, 5)}
                                            </span>
                                            {day.workSchedule.room && (
                                                <span className={styles.roomBadge}>🚪 {day.workSchedule.room}</span>
                                            )}
                                        </>
                                    ) : (
                                        <span className={styles.dayOffLabel}>🏖️ Nghỉ</span>
                                    )}
                                </div>

                                {/* Bookings */}
                                <div className={styles.bookingsList}>
                                    {day.bookings.length === 0 ? (
                                        <div className={styles.noBookings}>
                                            <span className={styles.noBookingsIcon}>📭</span>
                                            <span>Không có lịch hẹn</span>
                                        </div>
                                    ) : (
                                        day.bookings.map((booking) => {
                                            const { name, isWalkIn } = this.getPatientDisplay(booking);
                                            const statusInfo = {
                                                'waiting_doctor_assignment': { color: '#f57f17', bg: '#fffde7', border: '#ffe082' },
                                                'waiting_doctor_confirmation': { color: '#e65100', bg: '#fff3e0', border: '#ffcc80' },
                                                'confirmed': { color: '#2e7d32', bg: '#e8f5e9', border: '#a5d6a7' },
                                                'completed': { color: '#4a148c', bg: '#f3e5f5', border: '#ce93d8' },
                                                'cancelled': { color: '#b71c1c', bg: '#ffebee', border: '#ef9a9a' },
                                            }[booking.status] || { color: '#546e7a', bg: '#f5f5f5', border: '#cfd8dc' };

                                            return (
                                                <div
                                                    key={booking.id}
                                                    className={styles.bookingCard}
                                                    style={{ borderLeftColor: statusInfo.border, background: statusInfo.bg }}
                                                >
                                                    <div className={styles.bookingCardTop}>
                                                        <span className={styles.bookingTime}>
                                                            🕐 {booking.appointment_time?.substring(0, 5) || '--:--'}
                                                        </span>
                                                        {this.getStatusBadge(booking.status)}
                                                    </div>
                                                    <div className={styles.bookingPatient}>
                                                        {isWalkIn
                                                            ? <><span className={styles.walkInTag}>Vãng lai</span></>
                                                            : <span className={styles.patientName}>{name}</span>
                                                        }
                                                    </div>
                                                    {(booking.service?.name || booking.specialty?.name) && (
                                                        <div className={styles.bookingService}>
                                                            {booking.service?.name || booking.specialty?.name}
                                                        </div>
                                                    )}
                                                    {booking.symptoms && (
                                                        <div className={styles.bookingSymptoms}>
                                                            💬 {booking.symptoms.substring(0, 40)}{booking.symptoms.length > 40 ? '…' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
}

export default DoctorScheduleView;
