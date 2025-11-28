import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './DoctorScheduleView.module.css';

export default function DoctorScheduleView() {
    const [viewMode, setViewMode] = useState('day');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [stats, setStats] = useState({ total: 0, confirmed: 0, completed: 0, waiting: 0 });

    useEffect(() => {
        if (viewMode === 'day') {
            fetchDaySchedule();
        } else {
            fetchWeekSchedule();
        }
    }, [selectedDate, viewMode]);

    const fetchDaySchedule = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/doctor/my-schedule?date=${selectedDate}`);
            const data = response.data.bookings || [];
            setSchedules(data);
            calculateStats(data);
        } catch (error) {
            console.error('Error fetching day schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWeekSchedule = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = getWeekRange(selectedDate);
            const response = await api.get(`/api/doctor/schedule-statistics?start_date=${startDate}&end_date=${endDate}`);

            const dailyStats = response.data.dailyStats || {};
            const scheduleData = Object.entries(dailyStats).map(([date, stats]) => ({
                appointment_date: date,
                stats
            }));

            setSchedules(scheduleData);

            const totals = Object.values(dailyStats).reduce((acc, day) => ({
                total: acc.total + day.total,
                confirmed: acc.confirmed + (day.confirmed || 0),
                completed: acc.completed + (day.completed || 0),
                waiting: acc.waiting + (day.pending || 0)
            }), { total: 0, confirmed: 0, completed: 0, waiting: 0 });

            setStats(totals);
        } catch (error) {
            console.error('Error fetching week schedule:', error);
        } finally {
            setLoading(false);
        }
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
        const date = new Date(dateStr);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);

        const monday = new Date(date.setDate(diff));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        return {
            startDate: monday.toISOString().split('T')[0],
            endDate: sunday.toISOString().split('T')[0]
        };
    };

    const changeDate = (days) => {
        const newDate = new Date(selectedDate);
        if (viewMode === 'day') {
            newDate.setDate(newDate.getDate() + days);
        } else {
            newDate.setDate(newDate.getDate() + (days * 7));
        }
        setSelectedDate(newDate.toISOString().split('T')[0]);
    };

    const goToToday = () => {
        setSelectedDate(new Date().toISOString().split('T')[0]);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return {
            weekday: days[date.getDay()],
            date: date.getDate(),
            month: date.getMonth() + 1,
            year: date.getFullYear(),
            full: date.toLocaleDateString('vi-VN')
        };
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'waiting_doctor_assignment': { text: 'Chờ gán BS', class: 'waiting' },
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
                <h1>📅 Lịch làm việc</h1>
                <p>Xem lịch khám theo ngày hoặc tuần</p>
            </div>

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

            <div className={styles.controls}>
                <div className={styles.viewToggle}>
                    <button className={viewMode === 'day' ? styles.active : ''} onClick={() => setViewMode('day')}>📅 Ngày</button>
                    <button className={viewMode === 'week' ? styles.active : ''} onClick={() => setViewMode('week')}>📆 Tuần</button>
                </div>
                <div className={styles.dateNav}>
                    <button onClick={() => changeDate(-1)}>◀</button>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                    <button onClick={() => changeDate(1)}>▶</button>
                    <button onClick={goToToday} className={styles.todayBtn}>Hôm nay</button>
                </div>
            </div>

            <div className={styles.scheduleContent}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Đang tải...</p>
                    </div>
                ) : viewMode === 'day' ? (
                    <div className={styles.dayView}>
                        <div className={styles.dateHeader}>
                            {(() => { const d = formatDate(selectedDate); return `${d.weekday}, ${d.date} tháng ${d.month} năm ${d.year}`; })()}
                        </div>
                        {schedules.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>📭</div>
                                <h3>Không có lịch hẹn</h3>
                                <p>Bạn không có lịch khám nào trong ngày này</p>
                            </div>
                        ) : (
                            <div className={styles.appointmentsList}>
                                {schedules.map((schedule) => (
                                    <div key={schedule.id} className={styles.appointmentCard}>
                                        <div className={styles.timeSlot}>
                                            <div className={styles.time}>{schedule.appointment_time}</div>
                                            {getStatusBadge(schedule.status)}
                                        </div>
                                        <div className={styles.patientInfo}>
                                            <div className={styles.patientName}>👤 {schedule.patient?.full_name || 'N/A'}</div>
                                            <div className={styles.patientDetails}>
                                                📞 {schedule.patient?.phone || 'N/A'} • {schedule.patient?.gender === 'male' ? 'Nam' : 'Nữ'}
                                            </div>
                                            {schedule.symptoms && <div className={styles.symptoms}>💬 {schedule.symptoms}</div>}
                                        </div>
                                        <div className={styles.serviceInfo}>
                                            {schedule.service?.name && <span className={styles.serviceBadge}>🏥 {schedule.service.name}</span>}
                                            {schedule.specialty?.name && <span className={styles.specialtyBadge}>⚕️ {schedule.specialty.name}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.weekView}>
                        <div className={styles.weekHeader}>
                            Tuần từ {formatDate(getWeekRange(selectedDate).startDate).full} đến {formatDate(getWeekRange(selectedDate).endDate).full}
                        </div>
                        {schedules.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>📭</div>
                                <h3>Không có lịch hẹn</h3>
                                <p>Bạn không có lịch khám nào trong tuần này</p>
                            </div>
                        ) : (
                            <div className={styles.weekGrid}>
                                {schedules.map((day) => {
                                    const d = formatDate(day.appointment_date);
                                    return (
                                        <div key={day.appointment_date} className={styles.dayCard}>
                                            <div className={styles.dayHeader}>
                                                <div className={styles.dayName}>{d.weekday}</div>
                                                <div className={styles.dayDate}>{d.date}/{d.month}</div>
                                            </div>
                                            <div className={styles.dayStats}>
                                                <div className={styles.dayStat}>
                                                    <span className={styles.statCount}>{day.stats.total}</span>
                                                    <span className={styles.statText}>Tổng</span>
                                                </div>
                                                <div className={styles.dayStat}>
                                                    <span className={styles.statCount} style={{ color: '#ff9800' }}>{day.stats.pending || 0}</span>
                                                    <span className={styles.statText}>Chờ</span>
                                                </div>
                                                <div className={styles.dayStat}>
                                                    <span className={styles.statCount} style={{ color: '#4caf50' }}>{day.stats.confirmed || 0}</span>
                                                    <span className={styles.statText}>Xác nhận</span>
                                                </div>
                                                <div className={styles.dayStat}>
                                                    <span className={styles.statCount} style={{ color: '#9c27b0' }}>{day.stats.completed || 0}</span>
                                                    <span className={styles.statText}>Hoàn thành</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
