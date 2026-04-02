import React, { Component } from 'react';
import api from '../../utils/api';
import withRouter from '../../utils/withRouter';
import styles from './DoctorDashboardNew.module.css';

// Hàm lấy ngày theo timezone local (tránh bug UTC)
const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

class DoctorDashboardNew extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            stats: {
                today: { total: 0, waiting: 0, confirmed: 0, completed: 0 },
                thisWeek: { total: 0, completed: 0 },
                thisMonth: { total: 0, completed: 0 },
                rating: { avgRating: 0, totalReviews: 0 }
            },
            upcomingAppointments: [],
            recentPatients: [],
            recentReviews: []
        };
    }

    componentDidMount() {
        this.fetchDashboardData();

        // ✅ Auto-redirect if role changes in another tab (replaces useStorageSync)
        this._storageHandler = (e) => {
            if (e.key === 'user' || e.key === 'token') {
                const userData = localStorage.getItem('user');
                if (userData) {
                    try {
                        const user = JSON.parse(userData);
                        if (user.role !== 'doctor') {
                            window.location.href = '/login';
                        }
                    } catch {
                        window.location.href = '/login';
                    }
                } else {
                    window.location.href = '/login';
                }
            }
        };
        window.addEventListener('storage', this._storageHandler);
    }

    componentWillUnmount() {
        window.removeEventListener('storage', this._storageHandler);
    }

    fetchDashboardData = async () => {
        try {
            this.setState({ loading: true });
            const today = getLocalDateString(new Date());
            console.log('📅 Today (local):', today);

            // Get date ranges
            const weekStart = this.getWeekStart();
            const weekEnd = this.getWeekEnd();
            const monthStart = this.getMonthStart();
            const monthEnd = this.getMonthEnd();
            console.log('📅 Week:', weekStart, '-', weekEnd);
            console.log('📅 Month:', monthStart, '-', monthEnd);

            // Fetch all appointments of the logged-in doctor (filtered by doctor_id on backend)
            const allResponse = await api.get('/api/doctor/appointments');
            // API trả về appointments hoặc bookings
            const allAppts = allResponse.data.appointments || allResponse.data.bookings || [];
            console.log('📋 All appointments:', allAppts.length, allAppts);

            // Filter by date ranges
            const todayAppts = allAppts.filter(a => a.appointment_date === today);
            const weekAppts = allAppts.filter(a => a.appointment_date >= weekStart && a.appointment_date <= weekEnd);
            const monthAppts = allAppts.filter(a => a.appointment_date >= monthStart && a.appointment_date <= monthEnd);
            console.log('📋 Today appointments:', todayAppts.length);
            console.log('📋 Week appointments:', weekAppts.length);
            console.log('📋 Month appointments:', monthAppts.length);

            // Calculate stats
            this.setState({
                stats: {
                    today: {
                        total: todayAppts.length,
                        waiting: todayAppts.filter(a =>
                            a.status === 'waiting_doctor_confirmation' ||
                            a.status === 'waiting_doctor_assignment'
                        ).length,
                        confirmed: todayAppts.filter(a => a.status === 'confirmed').length,
                        completed: todayAppts.filter(a => a.status === 'completed').length
                    },
                    thisWeek: {
                        total: weekAppts.length,
                        completed: weekAppts.filter(a => a.status === 'completed').length
                    },
                    thisMonth: {
                        total: monthAppts.length,
                        completed: monthAppts.filter(a => a.status === 'completed').length
                    },
                    rating: { avgRating: 0, totalReviews: 0 }
                }
            });

            // Get upcoming appointments (today + future, not completed)
            const upcoming = allAppts
                .filter(a => {
                    return a.appointment_date >= today &&
                        a.status !== 'completed' &&
                        a.status !== 'cancelled' &&
                        a.status !== 'doctor_rejected';
                })
                .sort((a, b) => {
                    if (a.appointment_date !== b.appointment_date) {
                        return a.appointment_date.localeCompare(b.appointment_date);
                    }
                    return (a.appointment_time || '').localeCompare(b.appointment_time || '');
                })
                .slice(0, 5);
            this.setState({ upcomingAppointments: upcoming });

            // Get recent patients (completed appointments, sorted by date desc)
            const recent = allAppts
                .filter(a => a.status === 'completed')
                .sort((a, b) => {
                    if (a.appointment_date !== b.appointment_date) {
                        return b.appointment_date.localeCompare(a.appointment_date);
                    }
                    return (b.appointment_time || '').localeCompare(a.appointment_time || '');
                })
                .slice(0, 5);
            this.setState({ recentPatients: recent });

            // Get reviews and rating stats
            const reviewsResponse = await api.get('/api/doctor/reviews?limit=5');
            if (reviewsResponse.data.success) {
                this.setState({ recentReviews: reviewsResponse.data.data || [] });

                // Update stats with rating info
                this.setState(prevState => ({
                    stats: {
                        ...prevState.stats,
                        rating: reviewsResponse.data.stats || { avgRating: 0, totalReviews: 0 }
                    }
                }));
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            this.setState({ loading: false });
        }
    };

    getWeekStart = () => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today);
        monday.setDate(diff);
        return getLocalDateString(monday);
    };

    getWeekEnd = () => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? 0 : 7);
        const sunday = new Date(today);
        sunday.setDate(diff);
        return getLocalDateString(sunday);
    };

    getMonthStart = () => {
        const today = new Date();
        return getLocalDateString(new Date(today.getFullYear(), today.getMonth(), 1));
    };

    getMonthEnd = () => {
        const today = new Date();
        return getLocalDateString(new Date(today.getFullYear(), today.getMonth() + 1, 0));
    };

    formatTime = (time) => {
        return time ? time.substring(0, 5) : '';
    };

    formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('vi-VN');
    };

    getStatusBadge = (status) => {
        const badges = {
            'waiting_doctor_confirmation': { text: 'Chờ xác nhận', class: styles.statusWaiting },
            'confirmed': { text: 'Đã xác nhận', class: styles.statusConfirmed },
            'completed': { text: 'Hoàn thành', class: styles.statusCompleted },
            'cancelled': { text: 'Đã hủy', class: styles.statusCancelled },
            'doctor_rejected': { text: 'Đã từ chối', class: styles.statusRejected }
        };
        const badge = badges[status] || { text: status, class: '' };
        return <span className={`${styles.statusBadge} ${badge.class}`}>{badge.text}</span>;
    };

    renderStars = (rating) => {
        return (
            <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map(star => (
                    <i
                        key={star}
                        className={star <= rating ? 'fas fa-star' : 'far fa-star'}
                        style={{ color: star <= rating ? '#ffc107' : '#ddd' }}
                    ></i>
                ))}
            </div>
        );
    };

    render() {
        const { navigate } = this.props;
        const { loading, stats, upcomingAppointments, recentPatients, recentReviews } = this.state;

        if (loading) {
            return <div className={styles.loading}>Đang tải dữ liệu...</div>;
        }

        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Tổng Quan</h1>
                    <p className={styles.subtitle}>Chào mừng bạn trở lại!</p>
                </div>

                {/* Statistics Cards */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #45c3d2 0%, #2aa6b7 100%)' }}>
                            <i className="fas fa-calendar-day"></i>
                        </div>
                        <div className={styles.statContent}>
                            <h3>{stats.today.total}</h3>
                            <p>Lịch hẹn hôm nay</p>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                            <i className="fas fa-clock"></i>
                        </div>
                        <div className={styles.statContent}>
                            <h3>{stats.today.waiting}</h3>
                            <p>Chờ xác nhận</p>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <div className={styles.statContent}>
                            <h3>{stats.today.confirmed}</h3>
                            <p>Đã xác nhận</p>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                            <i className="fas fa-user-check"></i>
                        </div>
                        <div className={styles.statContent}>
                            <h3>{stats.today.completed}</h3>
                            <p>Đã hoàn thành</p>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #fbc531 0%, #ff9f00 100%)' }}>
                            <i className="fas fa-star"></i>
                        </div>
                        <div className={styles.statContent}>
                            <h3>{stats.rating.avgRating.toFixed(1)} ⭐</h3>
                            <p>{stats.rating.totalReviews} đánh giá</p>
                        </div>
                    </div>
                </div>

                {/* Weekly & Monthly Stats */}
                <div className={styles.weeklyStats}>
                    <div className={styles.weekCard}>
                        <h3>📅 Tuần này</h3>
                        <div className={styles.weekContent}>
                            <div className={styles.weekItem}>
                                <span className={styles.weekLabel}>Tổng lịch hẹn:</span>
                                <span className={styles.weekValue}>{stats.thisWeek.total}</span>
                            </div>
                            <div className={styles.weekItem}>
                                <span className={styles.weekLabel}>Đã hoàn thành:</span>
                                <span className={styles.weekValue}>{stats.thisWeek.completed}</span>
                            </div>
                            <div className={styles.weekItem}>
                                <span className={styles.weekLabel}>Tỷ lệ hoàn thành:</span>
                                <span className={styles.weekValue}>
                                    {stats.thisWeek.total > 0
                                        ? Math.round((stats.thisWeek.completed / stats.thisWeek.total) * 100)
                                        : 0}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.weekCard}>
                        <h3>📊 Tháng này</h3>
                        <div className={styles.weekContent}>
                            <div className={styles.weekItem}>
                                <span className={styles.weekLabel}>Tổng lịch hẹn:</span>
                                <span className={styles.weekValue}>{stats.thisMonth.total}</span>
                            </div>
                            <div className={styles.weekItem}>
                                <span className={styles.weekLabel}>Đã hoàn thành:</span>
                                <span className={styles.weekValue}>{stats.thisMonth.completed}</span>
                            </div>
                            <div className={styles.weekItem}>
                                <span className={styles.weekLabel}>Tỷ lệ hoàn thành:</span>
                                <span className={styles.weekValue}>
                                    {stats.thisMonth.total > 0
                                        ? Math.round((stats.thisMonth.completed / stats.thisMonth.total) * 100)
                                        : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className={styles.mainContent}>
                    {/* Upcoming Appointments */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Lịch Hẹn Sắp Tới</h2>
                            <button
                                className={styles.viewAllBtn}
                                onClick={() => navigate('/doctor-portal/appointments')}
                            >
                                Xem tất cả
                            </button>
                        </div>

                        {upcomingAppointments.length === 0 ? (
                            <div className={styles.emptyState}>
                                <i className="fas fa-calendar-times"></i>
                                <p>Không có lịch hẹn sắp tới</p>
                            </div>
                        ) : (
                            <div className={styles.appointmentsList}>
                                {upcomingAppointments.map(apt => (
                                    <div key={apt.id} className={styles.appointmentCard}>
                                        <div className={styles.appointmentTime}>
                                            <div className={styles.timeIcon}>
                                                <i className="fas fa-clock"></i>
                                            </div>
                                            <div>
                                                <div className={styles.time}>{this.formatTime(apt.appointment_time)}</div>
                                                <div className={styles.date}>{this.formatDate(apt.appointment_date)}</div>
                                            </div>
                                        </div>
                                        <div className={styles.appointmentInfo}>
                                            <h4>{apt.patient_name || apt.patient?.full_name || 'N/A'}</h4>
                                            <p className={styles.symptoms}>{apt.symptoms || apt.specialty?.name || 'Khám tổng quát'}</p>
                                            <div className={styles.phone}>
                                                <i className="fas fa-phone"></i> {apt.patient_phone || apt.patient?.phone || 'N/A'}
                                            </div>
                                        </div>
                                        <div className={styles.appointmentStatus}>
                                            {this.getStatusBadge(apt.status)}
                                        </div>
                                        <button
                                            className={styles.detailBtn}
                                            onClick={() => navigate('/doctor-portal/appointments')}
                                        >
                                            Chi tiết
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Patients */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Bệnh Nhân Đã Khám Gần Đây</h2>
                        </div>
                        {recentPatients.length === 0 ? (
                            <div className={styles.emptyState}>
                                <i className="fas fa-user-friends"></i>
                                <p>Chưa có bệnh nhân nào</p>
                            </div>
                        ) : (
                            <div className={styles.patientsList}>
                                {recentPatients.map(apt => (
                                    <div key={apt.id} className={styles.patientCard}>
                                        <div className={styles.patientAvatar}>
                                            <i className="fas fa-user"></i>
                                        </div>
                                        <div className={styles.patientInfo}>
                                            <h4>{apt.patient_name || apt.patient?.full_name || 'N/A'}</h4>
                                            <p className={styles.diagnosis}>
                                                {apt.diagnosis || apt.specialty?.name || 'Khám tổng quát'}
                                            </p>
                                            <div className={styles.patientMeta}>
                                                <span>
                                                    <i className="fas fa-calendar"></i>
                                                    {this.formatDate(apt.appointment_date)}
                                                </span>
                                                <span>
                                                    <i className="fas fa-clock"></i>
                                                    {this.formatTime(apt.appointment_time)}
                                                </span>
                                            </div>
                                        </div>
                                        {(apt.patient?.id || apt.patient_id) && (
                                            <button
                                                className={styles.viewHistoryBtn}
                                                onClick={() => navigate(`/doctor-portal/patient-history/${apt.patient?.id || apt.patient_id}`)}
                                                title="Xem hồ sơ bệnh án"
                                            >
                                                📋 Hồ sơ
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Patient Reviews */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Phản Hồi Từ Bệnh Nhân</h2>
                        </div>
                        {recentReviews.length === 0 ? (
                            <div className={styles.emptyState}>
                                <i className="fas fa-comment-dots"></i>
                                <p>Chưa có đánh giá nào</p>
                            </div>
                        ) : (
                            <div className={styles.reviewsList}>
                                {recentReviews.map(review => (
                                    <div key={review.id} className={styles.reviewCard}>
                                        <div className={styles.reviewHeader}>
                                            <div className={styles.reviewPatient}>
                                                <div className={styles.reviewAvatar}>
                                                    <i className="fas fa-user-circle"></i>
                                                </div>
                                                <div>
                                                    <h4>{review.patient?.full_name || 'Bệnh nhân'}</h4>
                                                    <p className={styles.reviewDate}>
                                                        {this.formatDate(review.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            {this.renderStars(review.rating)}
                                        </div>
                                        {review.comment && (
                                            <p className={styles.reviewComment}>{review.comment}</p>
                                        )}
                                        {review.booking && (
                                            <p className={styles.reviewBooking}>
                                                Mã đặt lịch: {review.booking.booking_code}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className={styles.quickActions}>
                    <h2>Thao Tác Nhanh</h2>
                    <div className={styles.actionsGrid}>
                        <button
                            className={styles.actionBtn}
                            onClick={() => navigate('/doctor-portal/appointments')}
                        >
                            <i className="fas fa-calendar-check"></i>
                            <span>Xem Lịch Hẹn</span>
                        </button>
                        <button
                            className={styles.actionBtn}
                            onClick={() => navigate('/doctor-portal/patients')}
                        >
                            <i className="fas fa-users"></i>
                            <span>Danh Sách BN</span>
                        </button>
                        <button
                            className={styles.actionBtn}
                            onClick={() => navigate('/doctor-portal/schedule')}
                        >
                            <i className="fas fa-calendar-alt"></i>
                            <span>Lịch Làm Việc</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(DoctorDashboardNew);
