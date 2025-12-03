import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useStorageSync } from '../../hooks/useStorageSync';
import ReviewModal from '../../components/customer/ReviewModal';
import styles from './MyAppointments.module.css';

export default function MyAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [rescheduleData, setRescheduleData] = useState({ id: null, newDate: '', newTime: '' });
    const [availableSlots, setAvailableSlots] = useState([]);
    const navigate = useNavigate();

    // ✅ Auto-redirect if role changes in another tab
    useStorageSync('patient');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            navigate('/login');
            return;
        }

        fetchAppointments();
    }, [navigate]); const fetchAppointments = async () => {
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
            const response = await api.put(`/api/patient/my-appointments/${id}/cancel`);

            alert('✅ Hủy lịch thành công! Email thông báo đã được gửi.');
            fetchAppointments(); // Refresh list
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || '❌ Không thể hủy lịch hẹn!');
        }
    };

    const handleOpenRescheduleModal = async (appointment) => {
        setRescheduleData({
            id: appointment.id,
            newDate: appointment.appointment_date,
            newTime: appointment.appointment_time || '08:00'
        });

        // Fetch available slots if doctor is assigned
        if (appointment.doctor_id && appointment.appointment_date) {
            try {
                const response = await api.get('/api/customer/available-slots', {
                    params: {
                        doctor_id: appointment.doctor_id,
                        date: appointment.appointment_date
                    }
                });
                setAvailableSlots(response.data.availableSlots || []);
            } catch (error) {
                console.error('Error fetching slots:', error);
                // Generate default slots if API fails
                const defaultSlots = [];
                for (let hour = 8; hour < 17; hour++) {
                    defaultSlots.push(`${hour.toString().padStart(2, '0')}:00`);
                    defaultSlots.push(`${hour.toString().padStart(2, '0')}:30`);
                }
                setAvailableSlots(defaultSlots);
            }
        } else {
            // Generate default slots
            const defaultSlots = [];
            for (let hour = 8; hour < 17; hour++) {
                defaultSlots.push(`${hour.toString().padStart(2, '0')}:00`);
                defaultSlots.push(`${hour.toString().padStart(2, '0')}:30`);
            }
            setAvailableSlots(defaultSlots);
        }

        setShowRescheduleModal(true);
    };

    const handleSubmitReschedule = async () => {
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
                setShowRescheduleModal(false);
                fetchAppointments(); // Refresh list
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || '❌ Không thể đổi lịch hẹn!');
        }
    };

    const handleReschedule = (appointmentId) => {
        navigate(`/booking?reschedule=${appointmentId}`);
    };

    const handleOpenReviewModal = (appointment) => {
        setSelectedAppointment(appointment);
        setShowReviewModal(true);
    };

    const handleReviewSuccess = () => {
        fetchAppointments(); // Refresh to update review status
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
            'pending': { text: 'Chờ xử lý', color: '#f59e0b' },
            'waiting_doctor_assignment': { text: 'Chờ xác nhận', color: '#f59e0b' },
            'waiting_doctor_confirmation': { text: 'Chờ bác sĩ xác nhận', color: '#3b82f6' },
            'confirmed': { text: 'Đã xác nhận', color: '#10b981' },
            'completed': { text: 'Hoàn thành', color: '#6366f1' },
            'cancelled': { text: 'Đã hủy', color: '#ef4444' },
            'doctor_rejected': { text: 'Bác sĩ từ chối', color: '#dc2626' }
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
        // Gộp 2 trạng thái chờ vào 1 filter
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
                    onClick={() => setFilter('all')}
                >
                    Tất cả ({appointments.length})
                </button>
                <button
                    className={filter === 'waiting' ? styles.filterActive : styles.filterBtn}
                    onClick={() => setFilter('waiting')}
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
                                                onClick={() => handleOpenRescheduleModal(appointment)}
                                            >
                                                🔄 Đổi lịch
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
                                    <>
                                        <button
                                            className={styles.btnViewDetail}
                                            onClick={() => handleViewDetail(appointment)}
                                        >
                                            📄 Xem kết quả khám
                                        </button>
                                        <button
                                            className={styles.btnReview}
                                            onClick={() => handleOpenReviewModal(appointment)}
                                        >
                                            ⭐ Đánh giá
                                        </button>
                                    </>
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
                                {/* ✅ Hiển thị dịch vụ */}
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

                            {/* ✅ Hiển thị chi phí với styling đặc biệt cho completed */}
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

            {/* RESCHEDULE MODAL */}
            {showRescheduleModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>🔄 Đổi thời gian lịch hẹn</h2>
                            <button
                                className={styles.btnClose}
                                onClick={() => setShowRescheduleModal(false)}
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
                                    onChange={(e) => setRescheduleData({
                                        ...rescheduleData,
                                        newDate: e.target.value
                                    })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>⏰ Chọn giờ mới:</label>
                                <select
                                    className={styles.timeSelect}
                                    value={rescheduleData.newTime}
                                    onChange={(e) => setRescheduleData({
                                        ...rescheduleData,
                                        newTime: e.target.value
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
                                onClick={() => setShowRescheduleModal(false)}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                className={styles.btnSubmit}
                                onClick={handleSubmitReschedule}
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
                    onClose={() => setShowReviewModal(false)}
                    onSuccess={handleReviewSuccess}
                />
            )}
        </div>
    );
}