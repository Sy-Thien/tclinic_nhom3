import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './MyAppointments.module.css';

export default function MyAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            navigate('/login');
            return;
        }
        fetchAppointments();
    }, [navigate]);

    const fetchAppointments = async () => {
        try {
            const response = await api.get('/api/customer/appointments');
            // Backend returns { bookings }, not { data: [...] }
            const appointmentData = response.data.bookings || response.data.data || [];
            setAppointments(appointmentData);
        } catch (error) {
            console.error('Error:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAppointment = async (id) => {
        if (!window.confirm('Bạn có chắc muốn hủy lịch hẹn này?')) {
            return;
        }

        try {
            const response = await api.put(`/api/customer/appointments/${id}/cancel`);

            if (response.data.success) {
                alert('✅ Hủy lịch thành công!');
                fetchAppointments(); // Refresh list
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || '❌ Không thể hủy lịch hẹn!');
        }
    };

    const handleReschedule = (appointmentId) => {
        navigate(`/booking?reschedule=${appointmentId}`);
    };

    const handleViewDetail = (appointment) => {
        setSelectedDetail(appointment);
        setShowDetailModal(true);
    };

    const handleSetReminder = (appointmentDate, appointmentTime) => {
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

    const getStatusBadge = (status) => {
        const badges = {
            'pending': { text: 'Chờ xác nhận', color: '#f59e0b' },
            'confirmed': { text: 'Đã xác nhận', color: '#3b82f6' },
            'in_progress': { text: 'Đang khám', color: '#8b5cf6' },
            'completed': { text: 'Hoàn thành', color: '#10b981' },
            'cancelled': { text: 'Đã hủy', color: '#ef4444' }
        };

        const badge = badges[status] || badges['pending'];

        return (
            <span className={styles.badge} style={{ background: badge.color }}>
                {badge.text}
            </span>
        );
    };

    const filteredAppointments = appointments.filter(app => {
        if (filter === 'all') return true;
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
                    onClick={() => setFilter('all')}
                >
                    Tất cả ({appointments.length})
                </button>
                <button
                    className={filter === 'pending' ? styles.filterActive : styles.filterBtn}
                    onClick={() => setFilter('pending')}
                >
                    Chờ xác nhận
                </button>
                <button
                    className={filter === 'confirmed' ? styles.filterActive : styles.filterBtn}
                    onClick={() => setFilter('confirmed')}
                >
                    Đã xác nhận
                </button>
                <button
                    className={filter === 'completed' ? styles.filterActive : styles.filterBtn}
                    onClick={() => setFilter('completed')}
                >
                    Hoàn thành
                </button>
                <button
                    className={filter === 'cancelled' ? styles.filterActive : styles.filterBtn}
                    onClick={() => setFilter('cancelled')}
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
                                {getStatusBadge(appointment.status)}
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>📅 Ngày khám:</span>
                                    <span className={styles.value}>
                                        {new Date(appointment.date).toLocaleDateString('vi-VN')}
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
                                {appointment.status === 'pending' && (
                                    <>
                                        <button
                                            className={styles.btnReschedule}
                                            onClick={() => handleReschedule(appointment.id)}
                                        >
                                            📅 Đổi lịch
                                        </button>
                                        <button
                                            className={styles.btnReminder}
                                            onClick={() => handleSetReminder(appointment.date, appointment.appointment_time)}
                                        >
                                            🔔 Nhắc lịch
                                        </button>
                                        <button
                                            className={styles.btnCancel}
                                            onClick={() => handleCancelAppointment(appointment.id)}
                                        >
                                            🚫 Hủy
                                        </button>
                                    </>
                                )}

                                {appointment.status === 'confirmed' && (
                                    <>
                                        <button
                                            className={styles.btnReminder}
                                            onClick={() => handleSetReminder(appointment.date, appointment.appointment_time)}
                                        >
                                            🔔 Nhắc lịch
                                        </button>
                                        <button
                                            className={styles.btnCancel}
                                            onClick={() => handleCancelAppointment(appointment.id)}
                                        >
                                            🚫 Hủy
                                        </button>
                                    </>
                                )}

                                {appointment.status === 'completed' && (
                                    <button
                                        className={styles.btnViewDetail}
                                        onClick={() => handleViewDetail(appointment)}
                                    >
                                        📄 Xem kết quả khám
                                    </button>
                                )}

                                <button
                                    className={styles.btnInfo}
                                    onClick={() => handleViewDetail(appointment)}
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
                                onClick={() => setShowDetailModal(false)}
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
                                    <span>{getStatusBadge(selectedDetail.status)}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Chuyên khoa:</span>
                                    <span>{selectedDetail.specialty_name}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Ngày khám:</span>
                                    <span>{new Date(selectedDetail.date).toLocaleDateString('vi-VN')}</span>
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
                                onClick={() => setShowDetailModal(false)}
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
        </div>
    );
}