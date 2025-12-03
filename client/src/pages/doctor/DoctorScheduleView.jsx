import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './DoctorScheduleView.module.css';

// Hàm lấy ngày theo timezone local (tránh bug UTC)
const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function DoctorScheduleView() {
    const [viewMode, setViewMode] = useState('week');
    const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
    const [loading, setLoading] = useState(false);
    const [weekData, setWeekData] = useState([]);
    const [workSchedule, setWorkSchedule] = useState([]);
    const [workScheduleLoaded, setWorkScheduleLoaded] = useState(false);
    const [stats, setStats] = useState({ total: 0, confirmed: 0, completed: 0, waiting: 0 });

    // Load work schedule một lần khi component mount
    useEffect(() => {
        fetchWorkSchedule();
    }, []);

    // Load week data sau khi work schedule đã load xong
    useEffect(() => {
        if (workScheduleLoaded) {
            fetchWeekData();
        }
    }, [selectedDate, workScheduleLoaded, workSchedule]);

    const fetchWorkSchedule = async () => {
        try {
            // Lấy lịch làm việc định kỳ của bác sĩ
            const response = await api.get('/api/doctor/work-schedule');
            setWorkSchedule(response.data.schedules || []);
        } catch (error) {
            console.error('Error fetching work schedule:', error);
        } finally {
            setWorkScheduleLoaded(true);
        }
    };

    const fetchWeekData = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = getWeekRange(selectedDate);

            // Lấy lịch hẹn trong tuần
            const response = await api.get(`/api/doctor/my-schedule?start_date=${startDate}&end_date=${endDate}`);
            const bookings = response.data.bookings || [];

            // Nhóm theo ngày
            const grouped = groupByDate(bookings, startDate, endDate);
            setWeekData(grouped);

            // Tính stats
            calculateStats(bookings);
        } catch (error) {
            console.error('Error fetching week data:', error);
            // Tạo tuần rỗng nếu lỗi
            const { startDate, endDate } = getWeekRange(selectedDate);
            const empty = groupByDate([], startDate, endDate);
            setWeekData(empty);
        } finally {
            setLoading(false);
        }
    };

    const groupByDate = (bookings, startDate, endDate) => {
        const days = [];
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
        const todayStr = getLocalDateString(new Date());

        // Tạo 7 ngày trong tuần
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = getLocalDateString(d);
            const dayName = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()];

            // Tìm lịch làm việc cho ngày này
            const workDay = workSchedule.find(w => w.day_of_week === dayName);

            // Lấy các booking trong ngày
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

    const calculateStats = (data) => {
        const totals = data.reduce((acc, item) => {
            acc.total++;
            if (item.status === 'confirmed') acc.confirmed++;
            if (item.status === 'completed') acc.completed++;
            if (item.status.includes('waiting')) acc.waiting++;
            return acc;
        }, { total: 0, confirmed: 0, completed: 0, waiting: 0 });
        setStats(totals);
    };

    const getWeekRange = (dateStr) => {
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

    const changeWeek = (direction) => {
        const newDate = new Date(selectedDate + 'T00:00:00');
        newDate.setDate(newDate.getDate() + (direction * 7));
        setSelectedDate(getLocalDateString(newDate));
    };

    const goToToday = () => {
        setSelectedDate(getLocalDateString(new Date()));
    };

    const getStatusBadge = (status) => {
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>📅 Lịch Làm Việc & Lịch Hẹn</h1>
                    <p>Xem lịch làm việc và các lịch hẹn đã đặt theo tuần</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#e3f2fd' }}>📋</div>
                    <div>
                        <div className={styles.statValue}>{stats.total}</div>
                        <div className={styles.statLabel}>Tổng lịch hẹn</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#fff3e0' }}>⏳</div>
                    <div>
                        <div className={styles.statValue}>{stats.waiting}</div>
                        <div className={styles.statLabel}>Chờ xác nhận</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#e8f5e9' }}>✅</div>
                    <div>
                        <div className={styles.statValue}>{stats.confirmed}</div>
                        <div className={styles.statLabel}>Đã xác nhận</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#f3e5f5' }}>🎉</div>
                    <div>
                        <div className={styles.statValue}>{stats.completed}</div>
                        <div className={styles.statLabel}>Hoàn thành</div>
                    </div>
                </div>
            </div>

            {/* Week Navigation */}
            <div className={styles.controls}>
                <div className={styles.weekNav}>
                    <button onClick={() => changeWeek(-1)} className={styles.navBtn}>◀ Tuần trước</button>
                    <button onClick={goToToday} className={styles.todayBtn}>📍 Tuần này</button>
                    <button onClick={() => changeWeek(1)} className={styles.navBtn}>Tuần sau ▶</button>
                </div>
                <div className={styles.weekRange}>
                    {(() => {
                        const { startDate, endDate } = getWeekRange(selectedDate);
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
                    })()}
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
                            </div>

                            {/* Work Schedule Info */}
                            {day.workSchedule ? (
                                <div className={styles.workTime}>
                                    <div className={styles.workLabel}>⏰ Giờ làm việc:</div>
                                    <div className={styles.workHours}>
                                        {day.workSchedule.start_time.slice(0, 5)} - {day.workSchedule.end_time.slice(0, 5)}
                                    </div>
                                    {day.workSchedule.break_start && (
                                        <div className={styles.breakTime}>
                                            ☕ Nghỉ: {day.workSchedule.break_start.slice(0, 5)} - {day.workSchedule.break_end.slice(0, 5)}
                                        </div>
                                    )}
                                    {day.workSchedule.room && (
                                        <div className={styles.roomInfo}>🚪 {day.workSchedule.room}</div>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.dayOffBadge}>
                                    🏖️ Nghỉ
                                </div>
                            )}

                            {/* Bookings List */}
                            <div className={styles.bookingsList}>
                                <div className={styles.bookingsHeader}>
                                    📋 Lịch hẹn ({day.bookings.length})
                                </div>
                                {day.bookings.length === 0 ? (
                                    <div className={styles.noBookings}>Không có lịch</div>
                                ) : (
                                    day.bookings.map((booking) => (
                                        <div key={booking.id} className={styles.bookingItem}>
                                            <div className={styles.bookingTime}>
                                                🕐 {booking.appointment_time || 'Chưa xác định'}
                                            </div>
                                            <div className={styles.bookingPatient}>
                                                👤 {booking.patient?.full_name || 'N/A'}
                                            </div>
                                            <div className={styles.bookingService}>
                                                {booking.service?.name || booking.specialty?.name}
                                            </div>
                                            {getStatusBadge(booking.status)}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Day Stats Summary */}
                            {day.bookings.length > 0 && (
                                <div className={styles.dayStatsSummary}>
                                    <span className={styles.miniStat} style={{ color: '#ff9800' }}>⏳ {day.stats.waiting}</span>
                                    <span className={styles.miniStat} style={{ color: '#4caf50' }}>✅ {day.stats.confirmed}</span>
                                    <span className={styles.miniStat} style={{ color: '#9c27b0' }}>🎉 {day.stats.completed}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
