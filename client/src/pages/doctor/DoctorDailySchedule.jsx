import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './DoctorDailySchedule.module.css';

export default function DoctorDailySchedule() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [scheduleData, setScheduleData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [doctorId, setDoctorId] = useState(null);

    useEffect(() => {
        // Lấy doctor ID từ token
        const fetchDoctorProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/doctor/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDoctorId(response.data.id);
            } catch (error) {
                console.error('Error fetching doctor profile:', error);
            }
        };
        fetchDoctorProfile();
    }, []);

    useEffect(() => {
        if (doctorId) {
            fetchDailySchedule();
        }
    }, [selectedDate, doctorId]);

    const fetchDailySchedule = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/admin/doctor-schedule/doctor-time-slots/${doctorId}`,
                {
                    params: { date: selectedDate },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setScheduleData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching daily schedule:', error);
            alert('Không thể tải lịch làm việc');
        } finally {
            setLoading(false);
        }
    };

    const navigateDate = (days) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const goToToday = () => {
        setSelectedDate(new Date().toISOString().split('T')[0]);
    };

    const getDayName = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    if (loading) {
        return <div className={styles.loading}>Đang tải lịch làm việc...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>📅 Lịch Làm Việc Hàng Ngày</h1>
                <p>Xem các khung giờ làm việc và số lượng bệnh nhân đã đặt</p>
            </div>

            {/* Date Navigation */}
            <div className={styles.dateNav}>
                <button className={styles.navBtn} onClick={() => navigateDate(-1)}>
                    ◀ Hôm qua
                </button>
                <button className={styles.todayBtn} onClick={goToToday}>
                    Hôm nay
                </button>
                <input
                    type="date"
                    className={styles.datePicker}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
                <button className={styles.navBtn} onClick={() => navigateDate(1)}>
                    Ngày mai ▶
                </button>
            </div>

            <div className={styles.selectedDate}>
                {getDayName(selectedDate)}
            </div>

            {/* Schedule Content */}
            {!scheduleData ? (
                <div className={styles.empty}>Chưa có dữ liệu lịch làm việc</div>
            ) : !scheduleData.isWorking ? (
                <div className={styles.notWorking}>
                    <div className={styles.notWorkingIcon}>🏖️</div>
                    <h2>Không có lịch làm việc</h2>
                    <p>Bạn không làm việc vào ngày này</p>
                </div>
            ) : (
                <div className={styles.scheduleContent}>
                    {/* Working Hours Info */}
                    <div className={styles.infoCard}>
                        <h3>⏰ Giờ làm việc</h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Bắt đầu:</span>
                                <span className={styles.infoValue}>{scheduleData.schedule.start_time}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Kết thúc:</span>
                                <span className={styles.infoValue}>{scheduleData.schedule.end_time}</span>
                            </div>
                            {scheduleData.schedule.break_start && (
                                <>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Nghỉ giữa ca:</span>
                                        <span className={styles.infoValue}>
                                            {scheduleData.schedule.break_start} - {scheduleData.schedule.break_end}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Time Slots Grid */}
                    <div className={styles.slotsSection}>
                        <h3>📋 Các Khung Giờ ({scheduleData.slots.length} khung)</h3>
                        <div className={styles.slotsGrid}>
                            {scheduleData.slots.map((slot, index) => (
                                <div
                                    key={index}
                                    className={`${styles.slotCard} ${slot.isBreakTime
                                            ? styles.breakTime
                                            : slot.bookingCount > 0
                                                ? styles.booked
                                                : styles.available
                                        }`}
                                >
                                    <div className={styles.slotTime}>
                                        {slot.startTime} - {slot.endTime}
                                    </div>

                                    {slot.isBreakTime ? (
                                        <div className={styles.slotStatus}>
                                            <span className={styles.breakIcon}>☕</span>
                                            <span>Giờ nghỉ</span>
                                        </div>
                                    ) : (
                                        <div className={styles.slotStatus}>
                                            <span className={styles.bookingCount}>
                                                {slot.bookingCount > 0 ? `${slot.bookingCount} bệnh nhân` : 'Trống'}
                                            </span>
                                            {slot.isAvailable && (
                                                <span className={styles.availableBadge}>✓ Sẵn sàng</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className={styles.statsBar}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Tổng khung giờ</span>
                            <span className={styles.statValue}>{scheduleData.slots.length}</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Đã đặt</span>
                            <span className={styles.statValue}>
                                {scheduleData.slots.filter(s => s.bookingCount > 0 && !s.isBreakTime).length}
                            </span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Còn trống</span>
                            <span className={styles.statValue}>
                                {scheduleData.slots.filter(s => s.isAvailable).length}
                            </span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Giờ nghỉ</span>
                            <span className={styles.statValue}>
                                {scheduleData.slots.filter(s => s.isBreakTime).length}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
