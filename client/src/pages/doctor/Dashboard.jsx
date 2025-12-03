import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './Dashboard.module.css';

export default function Dashboard() {
    const [stats, setStats] = useState({
        todayAppointments: 0,
        completedToday: 0,
        totalPatients: 0,
        upcomingAppointments: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/doctor/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error:', error);
            // Fake data for demo
            setStats({
                todayAppointments: 8,
                completedToday: 5,
                totalPatients: 42,
                upcomingAppointments: 3
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Đang tải...</div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Tổng Quan</h1>

            <div className={styles.statsGrid}>
                <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <div className={styles.statIcon}></div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.todayAppointments}</div>
                        <div className={styles.statLabel}>Lịch hẹn hôm nay</div>
                    </div>
                </div>

                <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                    <div className={styles.statIcon}></div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.completedToday}</div>
                        <div className={styles.statLabel}>Đã khám hôm nay</div>
                    </div>
                </div>

                <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                    <div className={styles.statIcon}></div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.upcomingAppointments}</div>
                        <div className={styles.statLabel}>Lịch sắp tới</div>
                    </div>
                </div>

                <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                    <div className={styles.statIcon}></div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.totalPatients}</div>
                        <div className={styles.statLabel}>Tổng bệnh nhân</div>
                    </div>
                </div>
            </div>

            <div className={styles.welcomeCard}>
                <h2>Chào mừng trở lại!</h2>
                <p>Hôm nay bạn có {stats.todayAppointments} lịch hẹn. Chúc bạn làm việc hiệu quả!</p>
            </div>
        </div>
    );
}