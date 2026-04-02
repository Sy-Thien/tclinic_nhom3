import React, { Component } from 'react';
import withRouter from '../../utils/withRouter';
import api from '../../utils/api';
import styles from './Dashboard.module.css';

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            stats: {
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
                cancelledBookings: 0
            },
            recentBookings: [],
            doctorStatus: { doctors: [], summary: { total: 0, busy: 0, available: 0 } },
            loading: true
        };
        this.interval = null;
    }

    componentDidMount() {
        this.fetchStats();
        this.fetchRecentBookings();
        this.fetchDoctorStatus();
        this.interval = setInterval(() => this.fetchDoctorStatus(), 30000);
    }

    componentWillUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    fetchStats = async () => {
        try {
            const response = await api.get('/api/admin/dashboard/stats');
            this.setState({ stats: response.data });
        } catch (error) {
            console.error('Error:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                alert('Bạn không có quyền truy cập!');
                this.props.navigate('/login');
            }
        } finally {
            this.setState({ loading: false });
        }
    };

    fetchRecentBookings = async () => {
        try {
            const response = await api.get('/api/admin/bookings?limit=5&sort=created_at&order=DESC');
            this.setState({ recentBookings: response.data.bookings || [] });
        } catch (error) {
            console.error('Error fetching recent bookings:', error);
        }
    };

    fetchDoctorStatus = async () => {
        try {
            const response = await api.get('/api/admin/dashboard/doctor-status');
            this.setState({ doctorStatus: response.data });
        } catch (error) {
            console.error('Error fetching doctor status:', error);
        }
    };

    getStatusLabel = (status) => {
        const labels = {
            'pending': 'Chờ xử lý',
            'confirmed': 'Đã xác nhận',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy',
            'waiting_doctor_confirmation': 'Chờ bác sĩ',
            'waiting_doctor_assignment': 'Chờ phân công'
        };
        return labels[status] || status;
    };

    getStatusClass = (status) => {
        const classes = {
            'pending': styles.statusPending,
            'confirmed': styles.statusConfirmed,
            'completed': styles.statusCompleted,
            'cancelled': styles.statusCancelled,
            'waiting_doctor_confirmation': styles.statusPending,
            'waiting_doctor_assignment': styles.statusPending
        };
        return classes[status] || '';
    };

    render() {
        const { stats, recentBookings, doctorStatus, loading } = this.state;
        const { navigate } = this.props;

        if (loading) {
            return (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            );
        }

        return (
            <div className={styles.dashboard}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1>Tổng Quan Hệ Thống</h1>
                        <p className={styles.date}>
                            {new Date().toLocaleDateString('vi-VN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>

                {/* Section: Thống kê hôm nay */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Thống kê hôm nay</h2>
                    <div className={styles.statsRow}>
                        <div className={`${styles.statCard} ${styles.cardPurple}`}>
                            <div className={styles.statNumber}>{stats.todayBookings}</div>
                            <div className={styles.statLabel}>Lịch khám hôm nay</div>
                        </div>
                        <div className={`${styles.statCard} ${styles.cardGreen}`}>
                            <div className={styles.statNumber}>{stats.todayCompleted}</div>
                            <div className={styles.statLabel}>Đã hoàn thành</div>
                        </div>
                        <div className={`${styles.statCard} ${styles.cardOrange}`}>
                            <div className={styles.statNumber}>{stats.pendingBookings}</div>
                            <div className={styles.statLabel}>Chờ xử lý</div>
                        </div>
                        <div className={`${styles.statCard} ${styles.cardBlue}`}>
                            <div className={styles.statNumber}>{stats.confirmedBookings}</div>
                            <div className={styles.statLabel}>Đã xác nhận</div>
                        </div>
                    </div>
                </div>

                {/* Section: Tổng quan hệ thống */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Tổng quan hệ thống</h2>
                    <div className={styles.statsRow}>
                        <div className={`${styles.statCard} ${styles.cardCyan}`}>
                            <div className={styles.statNumber}>{stats.totalBookings}</div>
                            <div className={styles.statLabel}>Tổng lịch khám</div>
                        </div>
                        <div className={`${styles.statCard} ${styles.cardTeal}`}>
                            <div className={styles.statNumber}>{stats.totalPatients}</div>
                            <div className={styles.statLabel}>Tổng bệnh nhân</div>
                        </div>
                        <div className={`${styles.statCard} ${styles.cardIndigo}`}>
                            <div className={styles.statNumber}>{stats.totalDoctors}</div>
                            <div className={styles.statLabel}>Tổng bác sĩ</div>
                        </div>
                        <div className={`${styles.statCard} ${styles.cardPink}`}>
                            <div className={styles.statNumber}>{stats.upcomingBookings}</div>
                            <div className={styles.statLabel}>Lịch 7 ngày tới</div>
                        </div>
                    </div>
                </div>

                {/* Section: Tình trạng bác sĩ */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Tình trạng bác sĩ</h2>
                        <div className={styles.doctorSummary}>
                            <span className={styles.summaryBusy}>{doctorStatus.summary.busy} đang khám</span>
                            <span className={styles.summaryAvailable}>{doctorStatus.summary.available} rảnh</span>
                        </div>
                    </div>
                    <div className={styles.doctorGrid}>
                        {doctorStatus.doctors.slice(0, 8).map((doctor) => (
                            <div
                                key={doctor.id}
                                className={`${styles.doctorCard} ${doctor.status === 'busy' ? styles.doctorBusy : styles.doctorAvailable}`}
                            >
                                <div className={styles.doctorAvatar}>
                                    {doctor.full_name?.charAt(0) || 'B'}
                                </div>
                                <div className={styles.doctorInfo}>
                                    <div className={styles.doctorName}>{doctor.full_name}</div>
                                    <div className={styles.doctorSpecialty}>{doctor.specialty}</div>
                                    {doctor.status === 'busy' ? (
                                        <div className={styles.doctorPatient}>
                                            Đang khám: {doctor.current_patient}
                                        </div>
                                    ) : (
                                        <div className={styles.doctorFree}>Sẵn sàng khám</div>
                                    )}
                                </div>
                                <div className={`${styles.doctorStatusDot} ${doctor.status === 'busy' ? styles.dotBusy : styles.dotAvailable}`}></div>
                            </div>
                        ))}
                    </div>
                    {doctorStatus.doctors.length > 8 && (
                        <button className={styles.viewMoreBtn} onClick={() => navigate('/admin/doctors')}>
                            Xem thêm {doctorStatus.doctors.length - 8} bác sĩ
                        </button>
                    )}
                </div>

                {/* Two columns layout */}
                <div className={styles.twoColumns}>
                    {/* Lịch hẹn gần đây */}
                    <div className={styles.recentSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Lịch hẹn gần đây</h2>
                            <button className={styles.viewAllBtn} onClick={() => navigate('/admin/appointments')}>
                                Xem tất cả
                            </button>
                        </div>
                        <div className={styles.recentList}>
                            {recentBookings.length > 0 ? (
                                recentBookings.map((booking, index) => (
                                    <div key={booking.id || index} className={styles.recentItem}>
                                        <div className={styles.recentInfo}>
                                            <div className={styles.patientName}>
                                                {booking.patient_name || booking.patient?.full_name || 'Không rõ'}
                                            </div>
                                            <div className={styles.bookingDetails}>
                                                {booking.appointment_date} - {booking.appointment_time?.substring(0, 5) || 'Chưa có'}
                                            </div>
                                        </div>
                                        <span className={`${styles.statusBadge} ${this.getStatusClass(booking.status)}`}>
                                            {this.getStatusLabel(booking.status)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.emptyState}>
                                    <p>Chưa có lịch hẹn nào</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Thao tác nhanh */}
                    <div className={styles.quickSection}>
                        <h2 className={styles.sectionTitle}>Thao tác nhanh</h2>
                        <div className={styles.quickGrid}>
                            <button className={`${styles.quickBtn} ${styles.btnPurple}`} onClick={() => navigate('/admin/appointments')}>
                                Quản lý lịch hẹn
                            </button>
                            <button className={`${styles.quickBtn} ${styles.btnBlue}`} onClick={() => navigate('/admin/doctors')}>
                                Quản lý bác sĩ
                            </button>
                            <button className={`${styles.quickBtn} ${styles.btnGreen}`} onClick={() => navigate('/admin/patients')}>
                                Quản lý bệnh nhân
                            </button>
                            <button className={`${styles.quickBtn} ${styles.btnOrange}`} onClick={() => navigate('/admin/services')}>
                                Quản lý dịch vụ
                            </button>
                            <button className={`${styles.quickBtn} ${styles.btnTeal}`} onClick={() => navigate('/admin/specialties')}>
                                Chuyên khoa
                            </button>
                            <button className={`${styles.quickBtn} ${styles.btnPink}`} onClick={() => navigate('/admin/reports')}>
                                Báo cáo thống kê
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(Dashboard);