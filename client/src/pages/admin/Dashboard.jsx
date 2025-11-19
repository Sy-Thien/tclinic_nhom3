import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Dashboard.module.css';

export default function Dashboard() {
    const [stats, setStats] = useState({
        todayBookings: 0,
        todayCompleted: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        totalBookings: 0,
        totalPatients: 0,
        totalDoctors: 0,
        activeDoctors: 0,
        totalSpecialties: 0,
        upcomingBookings: 0,
        statusCounts: {}
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/admin/dashboard/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                alert('Bạn không có quyền truy cập!');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Đang tải...</div>;
    }

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <h1>📊 Tổng Quan Hệ Thống</h1>
                <p className={styles.date}>
                    {new Date().toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <div className={styles.statIcon}>📅</div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.todayBookings}</div>
                        <div className={styles.statLabel}>Lịch khám hôm nay</div>
                    </div>
                </div>

                <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.todayCompleted}</div>
                        <div className={styles.statLabel}>Hoàn thành hôm nay</div>
                    </div>
                </div>

                <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    <div className={styles.statIcon}>⏳</div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.pendingBookings}</div>
                        <div className={styles.statLabel}>Chờ xác nhận</div>
                    </div>
                </div>

                <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                    <div className={styles.statIcon}>✔️</div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.confirmedBookings}</div>
                        <div className={styles.statLabel}>Đã xác nhận</div>
                    </div>
                </div>

                <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                    <div className={styles.statIcon}>📆</div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.upcomingBookings}</div>
                        <div className={styles.statLabel}>Lịch 7 ngày tới</div>
                    </div>
                </div>

                <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }}>
                    <div className={styles.statIcon}>📋</div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.totalBookings}</div>
                        <div className={styles.statLabel}>Tổng lịch khám</div>
                    </div>
                </div>

                <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
                    <div className={styles.statIcon}>👥</div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.totalPatients}</div>
                        <div className={styles.statLabel}>Tổng bệnh nhân</div>
                    </div>
                </div>

                <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
                    <div className={styles.statIcon}>👨‍⚕️</div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.activeDoctors}/{stats.totalDoctors}</div>
                        <div className={styles.statLabel}>Bác sĩ hoạt động</div>
                    </div>
                </div>
            </div>

            <div className={styles.quickActions}>
                <h2>⚡ Thao tác nhanh</h2>
                <div className={styles.actionGrid}>
                    <button
                        className={styles.actionBtn}
                        onClick={() => navigate('/admin/appointments')}
                        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    >
                        <span className={styles.actionIcon}>📅</span>
                        <span className={styles.actionText}>Quản lý lịch hẹn</span>
                    </button>

                    <button
                        className={styles.actionBtn}
                        onClick={() => navigate('/admin/doctors')}
                        style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
                    >
                        <span className={styles.actionIcon}>👨‍⚕️</span>
                        <span className={styles.actionText}>Quản lý bác sĩ</span>
                    </button>

                    <button
                        className={styles.actionBtn}
                        onClick={() => navigate('/admin/patients')}
                        style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
                    >
                        <span className={styles.actionIcon}>👥</span>
                        <span className={styles.actionText}>Quản lý bệnh nhân</span>
                    </button>

                    <button
                        className={styles.actionBtn}
                        onClick={() => navigate('/admin/services')}
                        style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
                    >
                        <span className={styles.actionIcon}>💊</span>
                        <span className={styles.actionText}>Quản lý dịch vụ</span>
                    </button>
                </div>
            </div>
        </div>
    );
}