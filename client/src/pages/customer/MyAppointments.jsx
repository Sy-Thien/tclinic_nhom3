import React, { Component } from 'react';
import api from '../../utils/api';
import withRouter from '../../utils/withRouter';
import ReviewModal from '../../components/customer/ReviewModal';
import styles from './MyAppointments.module.css';

class MyAppointments extends Component {
    constructor(props) {
        super(props);
        this.state = {
            appointments: [],
            loading: true,
            filter: 'all',
            selectedDetail: null,
            showDetailModal: false,
            showRescheduleModal: false,
            showReviewModal: false,
            selectedAppointment: null,
            rescheduleData: { id: null, newDate: '', newTime: '' },
            availableSlots: []
        };
    }

    componentDidMount() {
        const { navigate } = this.props;

        // ✅ Auto-redirect if role changes in another tab (inline useStorageSync)
        this.handleStorageChange = (e) => {
            if (e.key !== 'user' && e.key !== 'token' && e.key !== null) return;
            console.log('🔄 Storage changed in another tab:', e.key);
            const userStr = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            if (!userStr || !token) {
                window.location.href = '/login';
                return;
            }
            try {
                const user = JSON.parse(userStr);
                if (user.role !== 'patient') {
                    if (user.role === 'admin') window.location.href = '/admin';
                    else if (user.role === 'doctor') window.location.href = '/doctor-portal';
                    else window.location.href = '/login';
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                window.location.href = '/login';
            }
        };
        window.addEventListener('storage', this.handleStorageChange);

        // ✅ Kiểm tra đăng nhập
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (!token || !userStr) {
            navigate('/login', { state: { from: '/my-appointments' } });
            return;
        }

        this.fetchAppointments();
    }

    componentWillUnmount() {
        window.removeEventListener('storage', this.handleStorageChange);
    }

    fetchAppointments = async () => {
        try {
            const response = await api.get('/api/patient/bookings/appointments');
            const appointmentData = response.data?.bookings || response.data || [];
            this.setState({ appointments: appointmentData });
        } catch (error) {
            console.error('Error:', error);
        } finally {
            this.setState({ loading: false });
        }
    };

    handleCancelAppointment = async (id) => {
        if (!window.confirm('Bạn có chắc muốn hủy lịch hẹn này?')) return;

        try {
            await api.put(`/api/patient/my-appointments/${id}/cancel`);
            alert('✅ Hủy lịch thành công! Email thông báo đã được gửi.');
            this.fetchAppointments();
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || '❌ Không thể hủy lịch hẹn!');
        }
    };

    handleOpenRescheduleModal = async (appointment) => {
        this.setState({
            rescheduleData: {
                id: appointment.id,
                newDate: appointment.appointment_date,
                newTime: appointment.appointment_time || '08:00'
            }
        });

        if (appointment.doctor_id && appointment.appointment_date) {
            try {
                const response = await api.get('/api/patient/bookings/available-slots', {
                    params: {
                        doctor_id: appointment.doctor_id,
                        date: appointment.appointment_date
                    }
                });
                this.setState({ availableSlots: response.data.availableSlots || [] });
            } catch (error) {
                console.error('Error fetching slots:', error);
                const defaultSlots = [];
                for (let hour = 8; hour < 17; hour++) {
                    defaultSlots.push(`${hour.toString().padStart(2, '0')}:00`);
                    defaultSlots.push(`${hour.toString().padStart(2, '0')}:30`);
                }
                this.setState({ availableSlots: defaultSlots });
            }
        } else {
            const defaultSlots = [];
            for (let hour = 8; hour < 17; hour++) {
                defaultSlots.push(`${hour.toString().padStart(2, '0')}:00`);
                defaultSlots.push(`${hour.toString().padStart(2, '0')}:30`);
            }
            this.setState({ availableSlots: defaultSlots });
        }

        this.setState({ showRescheduleModal: true });
    };

    handleSubmitReschedule = async () => {
        const { rescheduleData } = this.state;
        if (!rescheduleData.newDate || !rescheduleData.newTime) {
            alert('Vui lòng chọn ngày và giờ mới!');
            return;
        }

        try {
            const response = await api.put(
                `/api/patient/my-appointments/${rescheduleData.id}/reschedule`,
                {
                    new_date: rescheduleData.newDate,
                    new_time: rescheduleData.newTime
                }
            );

            if (response.data.success) {
                alert('✅ Đổi lịch thành công! Email xác nhận đã được gửi.');
                this.setState({ showRescheduleModal: false });
                this.fetchAppointments();
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || '❌ Không thể đổi lịch hẹn!');
        }
    };

    handleReschedule = (appointmentId) => {
        this.props.navigate(`/booking?reschedule=${appointmentId}`);
    };

    handleOpenReviewModal = (appointment) => {
        this.setState({ selectedAppointment: appointment, showReviewModal: true });
    };

    handleReviewSuccess = () => {
        this.fetchAppointments();
    };

    handleViewDetail = (appointment) => {
        this.setState({ selectedDetail: appointment, showDetailModal: true });
    };

    handleSetReminder = (appointmentDate, appointmentTime) => {
        const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
        const reminderDate = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);

        if (Notification.permission === 'granted') {
            const timeout = reminderDate.getTime() - Date.now();
            if (timeout > 0) {
                setTimeout(() => {
                    new Notification('📅 Nhắc lịch khám', {
                        body: `Bạn có lịch khám ngày mai lúc ${appointmentTime}`,
                    });
                }, timeout);
                alert('✅ Đã bật thông báo nhắc lịch trước 24 giờ');
            }
        } else {
            Notification.requestPermission();
        }
    };

    getStatusBadge = (status) => {
        const badges = {
            'pending': { text: 'Chờ xử lý', color: '#f59e0b', icon: '⏳' },
            'waiting_doctor_assignment': { text: 'Chờ phân bác sĩ', color: '#f59e0b', icon: '⏳' },
            'waiting_doctor_confirmation': { text: 'Chờ bác sĩ', color: '#3b82f6', icon: '👀' },
            'confirmed': { text: 'Đã xác nhận', color: '#0ea5e9', icon: '✅' },
            'completed': { text: 'Hoàn thành', color: '#10b981', icon: '🎉' },
            'cancelled': { text: 'Đã hủy', color: '#ef4444', icon: '❌' },
            'doctor_rejected': { text: 'Bác sĩ từ chối', color: '#dc2626', icon: '⛔' }
        };
        const badge = badges[status] || badges['pending'];
        return (
            <span className={styles.badge} style={{ background: badge.color }}>
                {badge.icon} {badge.text}
            </span>
        );
    };

    render() {
        const { navigate } = this.props;
        const {
            appointments, loading, filter, selectedDetail, showDetailModal,
            showRescheduleModal, showReviewModal, selectedAppointment,
            rescheduleData, availableSlots
        } = this.state;

        const filteredAppointments = appointments.filter(app => {
            if (filter === 'all') return true;
            if (filter === 'waiting') {
                return app.status === 'waiting_doctor_assignment' || app.status === 'waiting_doctor_confirmation';
            }
            return app.status === filter;
        });

        if (loading) {
            return (
                <div className={styles.container}>
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Đang tải...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1>📋 Lịch Hẹn Của Tôi</h1>
                        <p>Quản lý tất cả lịch khám bệnh</p>
                    </div>
                    <button
                        className={styles.btnNewBooking}
                        onClick={() => navigate('/booking')}
                    >
                        ➕ Đặt lịch mới
                    </button>
                </div>

                {/* FILTER */}
                <div className={styles.filterBar}>
                    <button
                        className={filter === 'all' ? styles.filterActive : styles.filterBtn}
                        onClick={() => this.setState({ filter: 'all' })}
                    >
                        Tất cả ({appointments.length})
                    </button>
                    <button
                        className={filter === 'waiting' ? styles.filterActive : styles.filterBtn}
                        onClick={() => this.setState({ filter: 'waiting' })}
                    >
                        Chờ xác nhận
                    </button>
                    <button
                        className={filter === 'confirmed' ? styles.filterActive : styles.filterBtn}
                        onClick={() => this.setState({ filter: 'confirmed' })}
                    >
                        Đã xác nhận
                    </button>
                    <button
                        className={filter === 'completed' ? styles.filterActive : styles.filterBtn}
                        onClick={() => this.setState({ filter: 'completed' })}
                    >
                        Hoàn thành
                    </button>
                    <button
                        className={filter === 'cancelled' ? styles.filterActive : styles.filterBtn}
                        onClick={() => this.setState({ filter: 'cancelled' })}
                    >
                        Đã hủy
                    </button>
                </div>

                {/* APPOINTMENTS LIST */}
                {filteredAppointments.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>📭</span>
                        <h3>Chưa có lịch hẹn nào</h3>
                        <p>Nhấn "Đặt lịch mới" để tạo lịch khám</p>
                    </div>
                ) : (
                    <div className={styles.appointmentsList}>
                        {filteredAppointments.map(appointment => (
                            <div key={appointment.id} className={styles.appointmentCard}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h3>{appointment.service_name}</h3>
                                        <p className={styles.specialty}>{appointment.specialty_name}</p>
                                    </div>
                                    {this.getStatusBadge(appointment.status)}
                                </div>

                                <div className={styles.cardBody}>
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>📅 Ngày khám:</span>
                                        <span className={styles.value}>
                                            {new Date(appointment.appointment_date).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>🕐 Giờ khám:</span>
                                        <span className={styles.value}>{appointment.appointment_time}</span>
                                    </div>
                                    {appointment.doctor_name && (
                                        <div className={styles.infoRow}>
                                            <span className={styles.label}>👨‍⚕️ Bác sĩ:</span>
                                            <span className={styles.value}>{appointment.doctor_name}</span>
                                        </div>
                                    )}
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>💰 Chi phí:</span>
                                        <span className={styles.value}>
                                            {appointment.service_price?.toLocaleString('vi-VN')}đ
                                        </span>
                                    </div>
                                    {appointment.booking_code && (
                                        <div className={styles.infoRow}>
                                            <span className={styles.label}>🔖 Mã lịch:</span>
                                            <span className={styles.value}>{appointment.booking_code}</span>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.cardFooter}>
                                    {(appointment.status === 'waiting_doctor_assignment' ||
                                        appointment.status === 'waiting_doctor_confirmation' ||
                                        appointment.status === 'confirmed') && (
                                            <>
                                                <button
                                                    className={styles.btnReschedule}
                                                    onClick={() => this.handleOpenRescheduleModal(appointment)}
                                                >
                                                    🔄 Đổi lịch
                                                </button>
                                                <button
                                                    className={styles.btnCancel}
                                                    onClick={() => this.handleCancelAppointment(appointment.id)}
                                                >
                                                    🚫 Hủy
                                                </button>
                                            </>
                                        )}

                                    {appointment.status === 'completed' && (
                                        <>
                                            <button
                                                className={styles.btnViewDetail}
                                                onClick={() => this.handleViewDetail(appointment)}
                                            >
                                                📄 Xem kết quả khám
                                            </button>
                                            <button
                                                className={styles.btnReview}
                                                onClick={() => this.handleOpenReviewModal(appointment)}
                                            >
                                                ⭐ Đánh giá
                                            </button>
                                        </>
                                    )}

                                    <button
                                        className={styles.btnInfo}
                                        onClick={() => this.handleViewDetail(appointment)}
                                    >
                                        ℹ️ Chi tiết
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* DETAIL MODAL */}
                {showDetailModal && selectedDetail && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <div className={styles.modalHeader}>
                                <h2>📋 Chi tiết lịch hẹn</h2>
                                <button
                                    className={styles.btnClose}
                                    onClick={() => this.setState({ showDetailModal: false })}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className={styles.modalBody}>
                                <div className={styles.detailSection}>
                                    <h3>Thông tin chung</h3>
                                    <div className={styles.detailRow}>
                                        <span>Mã lịch:</span>
                                        <span className={styles.code}>{selectedDetail.booking_code}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span>Trạng thái:</span>
                                        <span>{this.getStatusBadge(selectedDetail.status)}</span>
                                    </div>
                                    {selectedDetail.service_name && (
                                        <div className={styles.detailRow}>
                                            <span>Dịch vụ:</span>
                                            <span className={styles.serviceName}>{selectedDetail.service_name}</span>
                                        </div>
                                    )}
                                    <div className={styles.detailRow}>
                                        <span>Chuyên khoa:</span>
                                        <span>{selectedDetail.specialty_name}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span>Ngày khám:</span>
                                        <span>{new Date(selectedDetail.appointment_date).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span>Giờ khám:</span>
                                        <span>{selectedDetail.appointment_time || 'Chưa xác định'}</span>
                                    </div>
                                    {selectedDetail.doctor_name && (
                                        <div className={styles.detailRow}>
                                            <span>Bác sĩ:</span>
                                            <span>{selectedDetail.doctor_name}</span>
                                        </div>
                                    )}
                                </div>

                                {selectedDetail.status === 'completed' && (
                                    <div className={styles.detailSection}>
                                        <h3>💰 Chi phí khám</h3>
                                        <div className={styles.costSummary}>
                                            <div className={styles.costRow}>
                                                <span>Phí dịch vụ ({selectedDetail.service_name || 'Khám bệnh'}):</span>
                                                <span>{(selectedDetail.service_price || selectedDetail.price || 0).toLocaleString('vi-VN')}đ</span>
                                            </div>
                                            <div className={styles.costTotal}>
                                                <span>Tổng cộng:</span>
                                                <span className={styles.totalPrice}>
                                                    {(selectedDetail.service_price || selectedDetail.price || 0).toLocaleString('vi-VN')}đ
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedDetail.status === 'completed' && (
                                    <>
                                        {selectedDetail.diagnosis && (
                                            <div className={styles.detailSection}>
                                                <h3>📋 Chẩn đoán</h3>
                                                <p className={styles.detailText}>{selectedDetail.diagnosis}</p>
                                            </div>
                                        )}
                                        {selectedDetail.prescription && (
                                            <div className={styles.detailSection}>
                                                <h3>💊 Đơn thuốc</h3>
                                                <p className={styles.detailText}>{selectedDetail.prescription}</p>
                                            </div>
                                        )}
                                        {selectedDetail.note && (
                                            <div className={styles.detailSection}>
                                                <h3>📝 Ghi chú</h3>
                                                <p className={styles.detailText}>{selectedDetail.note}</p>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className={styles.detailSection}>
                                    <h3>Triệu chứng/Lý do khám</h3>
                                    <p className={styles.detailText}>{selectedDetail.symptoms}</p>
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    className={styles.btnClose}
                                    onClick={() => this.setState({ showDetailModal: false })}
                                >
                                    Đóng
                                </button>
                                {selectedDetail.status === 'completed' && (
                                    <button
                                        className={styles.btnPrint}
                                        onClick={() => window.print()}
                                    >
                                        🖨️ In kết quả
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* RESCHEDULE MODAL */}
                {showRescheduleModal && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <div className={styles.modalHeader}>
                                <h2>🔄 Đổi thời gian lịch hẹn</h2>
                                <button
                                    className={styles.btnClose}
                                    onClick={() => this.setState({ showRescheduleModal: false })}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label>📅 Chọn ngày mới:</label>
                                    <input
                                        type="date"
                                        className={styles.dateInput}
                                        value={rescheduleData.newDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => this.setState({
                                            rescheduleData: { ...rescheduleData, newDate: e.target.value }
                                        })}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>⏰ Chọn giờ mới:</label>
                                    <select
                                        className={styles.timeSelect}
                                        value={rescheduleData.newTime}
                                        onChange={(e) => this.setState({
                                            rescheduleData: { ...rescheduleData, newTime: e.target.value }
                                        })}
                                    >
                                        <option value="">-- Chọn giờ --</option>
                                        {availableSlots.map(slot => (
                                            <option key={slot} value={slot}>
                                                {slot}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.noteBox}>
                                    <p><strong>⚠️ Lưu ý:</strong></p>
                                    <ul>
                                        <li>Lịch hẹn mới sẽ chờ bác sĩ xác nhận lại</li>
                                        <li>Bạn sẽ nhận email thông báo khi được xác nhận</li>
                                        <li>Nếu không thể đến, vui lòng hủy trước 2 giờ</li>
                                    </ul>
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    className={styles.btnClose}
                                    onClick={() => this.setState({ showRescheduleModal: false })}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    className={styles.btnSubmit}
                                    onClick={this.handleSubmitReschedule}
                                >
                                    ✅ Xác nhận đổi lịch
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* REVIEW MODAL */}
                {showReviewModal && selectedAppointment && (
                    <ReviewModal
                        appointment={selectedAppointment}
                        onClose={() => this.setState({ showReviewModal: false })}
                        onSuccess={this.handleReviewSuccess}
                    />
                )}

            </div>
        );
    }
}

export default withRouter(MyAppointments);
