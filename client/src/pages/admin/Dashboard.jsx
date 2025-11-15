import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Dashboard.module.css';

export default function Dashboard() {
    const [stats, setStats] = useState({
        todayTotal: 0,
        todayCompleted: 0,
        totalAppointments: 0,
        totalPatients: 0,
        pendingAppointments: 0
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/admin/appointments/stats');
            setStats(response.data.data);
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
                        <div className={styles.statValue}>{stats.todayTotal}</div>
                        <div className={styles.statLabel}>Lịch hẹn hôm nay</div>
                    </div>
                </div>

                <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.todayCompleted}</div>
                        <div className={styles.statLabel}>Đã hoàn thành hôm nay</div>
                    </div>
                </div>

                <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                    <div className={styles.statIcon}>⏳</div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.pendingAppointments}</div>
                        <div className={styles.statLabel}>Chờ xác nhận</div>
                    </div>
                </div>

                <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                    <div className={styles.statIcon}>👥</div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.totalPatients}</div>
                        <div className={styles.statLabel}>Tổng bệnh nhân</div>
                    </div>
                </div>

                <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                    <div className={styles.statIcon}>📋</div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.totalAppointments}</div>
                        <div className={styles.statLabel}>Tổng lịch hẹn</div>
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