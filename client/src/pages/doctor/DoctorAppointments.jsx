import { useState, useEffect } from 'react';
import api from '../../utils/api';
import PrescriptionForm from './PrescriptionForm';
import PrescriptionView from './PrescriptionView';
import styles from './DoctorAppointments.module.css';

export default function DoctorAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [filter, setFilter] = useState({
        date: new Date().toISOString().split('T')[0],
        status: 'all'
    });
    const [diagnosisForm, setDiagnosisForm] = useState({
        diagnosis: '',
        conclusion: '',
        prescription: ''
    });
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchAppointments();
    }, [filter]);

    const fetchAppointments = async () => {
        try {
            const params = new URLSearchParams();
            if (filter.date) params.append('date', filter.date);
            if (filter.status !== 'all') params.append('status', filter.status);

            const token = localStorage.getItem('token');
            const response = await api.get(`/api/doctor/appointments/appointments?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setAppointments(response.data.bookings || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            alert('Lỗi khi tải danh sách lịch hẹn');
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilter(prev => ({ ...prev, [name]: value }));
    };

    const handleViewDetail = async (appointmentId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get(`/api/doctor/appointments/appointments/${appointmentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSelectedAppointment(response.data.booking);
            setShowModal(true);
        } catch (error) {
            console.error('Error fetching appointment detail:', error);
            alert('Lỗi khi tải chi tiết lịch hẹn');
        }
    };

    const handleConfirmAppointment = async (appointmentId) => {
        if (!window.confirm('Xác nhận tiếp nhận bệnh nhân này?')) return;

        try {
            const token = localStorage.getItem('token');
            await api.put(`/api/doctor/appointments/appointments/${appointmentId}/confirm`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('✅ Đã xác nhận tiếp nhận bệnh nhân');
            fetchAppointments();
            if (selectedAppointment?.id === appointmentId) {
                handleViewDetail(appointmentId);
            }
        } catch (error) {
            console.error('Error confirming appointment:', error);
            alert('Lỗi khi xác nhận');
        }
    };

    // Xác nhận booking mới (từ waiting_doctor_confirmation → confirmed)
    const handleConfirmBooking = async (appointmentId) => {
        setShowConfirmModal(false);
        try {
            const token = localStorage.getItem('token');
            await api.put(`/api/doctor/appointments/appointments/${appointmentId}/confirm-booking`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('✅ Đã xác nhận lịch khám!');
            fetchAppointments();
            if (selectedAppointment?.id === appointmentId) {
                setShowModal(false);
            }
        } catch (error) {
            console.error('Error confirming booking:', error);
            alert(error.response?.data?.message || 'Lỗi khi xác nhận lịch khám');
        }
    };

    // Từ chối booking
    const handleRejectBooking = async () => {
        if (!rejectReason.trim()) {
            alert('Vui lòng nhập lý do từ chối!');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await api.put(
                `/api/doctor/appointments/appointments/${selectedAppointment.id}/reject-booking`,
                { reject_reason: rejectReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('✅ Đã từ chối lịch khám');
            setShowRejectModal(false);
            setShowModal(false);
            setRejectReason('');
            fetchAppointments();
        } catch (error) {
            console.error('Error rejecting booking:', error);
            alert(error.response?.data?.message || 'Lỗi khi từ chối lịch khám');
        }
    };

    const handleDiagnosisChange = (e) => {
        const { name, value } = e.target;
        setDiagnosisForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitDiagnosis = async (e) => {
        e.preventDefault();

        if (!diagnosisForm.diagnosis.trim() || !diagnosisForm.conclusion.trim()) {
            alert('Vui lòng nhập chẩn đoán và kết luận');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            await api.put(
                `/api/doctor/appointments/appointments/${selectedAppointment.id}/complete`,
                diagnosisForm,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            alert('✅ Hoàn thành khám bệnh');
            setShowModal(false);
            setDiagnosisForm({ diagnosis: '', conclusion: '', prescription: '' });
            fetchAppointments();
        } catch (error) {
            console.error('Error submitting diagnosis:', error);
            alert('Lỗi khi lưu thông tin khám');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            pending: { text: 'Chờ xác nhận', className: styles.statusPending },
            waiting_doctor_confirmation: { text: 'Chờ bạn xác nhận', className: styles.statusWaitingConfirm },
            confirmed: { text: 'Đã xác nhận', className: styles.statusConfirmed },
            completed: { text: 'Hoàn thành', className: styles.statusCompleted },
            cancelled: { text: 'Đã hủy', className: styles.statusCancelled },
            doctor_rejected: { text: 'Đã từ chối', className: styles.statusRejected }
        };

        const statusInfo = statusMap[status] || { text: status, className: '' };
        return <span className={`${styles.statusBadge} ${statusInfo.className}`}>{statusInfo.text}</span>;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>🩺 Quản Lý Lịch Khám</h1>
                <p>Tiếp nhận và khám bệnh cho bệnh nhân</p>
            </div>

            {/* FILTER */}
            <div className={styles.filterSection}>
                <div className={styles.filterGroup}>
                    <label>Ngày khám:</label>
                    <input
                        type="date"
                        name="date"
                        value={filter.date}
                        onChange={handleFilterChange}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <label>Trạng thái:</label>
                    <select name="status" value={filter.status} onChange={handleFilterChange}>
                        <option value="all">Tất cả</option>
                        <option value="pending">Chờ xác nhận</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="completed">Hoàn thành</option>
                    </select>
                </div>

                <button className={styles.btnRefresh} onClick={fetchAppointments}>
                    🔄 Làm mới
                </button>
            </div>

            {/* APPOINTMENTS LIST */}
            <div className={styles.appointmentsList}>
                <div className={styles.statsBar}>
                    <span>Tổng số lịch hẹn: <strong>{appointments.length}</strong></span>
                    <span>Chờ xác nhận: <strong>{appointments.filter(a => a.status === 'pending').length}</strong></span>
                    <span>Đã xác nhận: <strong>{appointments.filter(a => a.status === 'confirmed').length}</strong></span>
                </div>

                {appointments.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>📭 Không có lịch hẹn nào</p>
                    </div>
                ) : (
                    <div className={styles.cardsGrid}>
                        {appointments.map(appointment => (
                            <div key={appointment.id} className={styles.appointmentCard}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.bookingCode}>#{appointment.booking_code}</span>
                                    {getStatusBadge(appointment.status)}
                                </div>

                                <div className={styles.cardBody}>
                                    <div className={styles.infoRow}>
                                        <strong>👤 Bệnh nhân:</strong>
                                        <span>{appointment.patient_name}</span>
                                    </div>

                                    <div className={styles.infoRow}>
                                        <strong>📞 SĐT:</strong>
                                        <span>{appointment.patient_phone}</span>
                                    </div>

                                    <div className={styles.infoRow}>
                                        <strong>📅 Ngày giờ:</strong>
                                        <span>{appointment.appointment_date} - {appointment.appointment_time}</span>
                                    </div>

                                    <div className={styles.infoRow}>
                                        <strong>🏥 Chuyên khoa:</strong>
                                        <span>{appointment.specialty?.name}</span>
                                    </div>

                                    <div className={styles.symptomsBox}>
                                        <strong>💬 Triệu chứng:</strong>
                                        <p>{appointment.symptoms}</p>
                                    </div>
                                </div>

                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.btnView}
                                        onClick={() => handleViewDetail(appointment.id)}
                                    >
                                        👁️ Xem chi tiết
                                    </button>

                                    {appointment.status === 'waiting_doctor_confirmation' && (
                                        <>
                                            <button
                                                className={styles.btnConfirmBooking}
                                                onClick={() => {
                                                    setSelectedAppointment(appointment);
                                                    setShowConfirmModal(true);
                                                }}
                                            >
                                                ✅ Xác nhận
                                            </button>
                                            <button
                                                className={styles.btnReject}
                                                onClick={() => {
                                                    setSelectedAppointment(appointment);
                                                    setShowRejectModal(true);
                                                }}
                                            >
                                                ❌ Từ chối
                                            </button>
                                        </>
                                    )}

                                    {appointment.status === 'pending' && (
                                        <button
                                            className={styles.btnConfirm}
                                            onClick={() => handleConfirmAppointment(appointment.id)}
                                        >
                                            ✅ Xác nhận tiếp nhận
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL - Chi tiết và chẩn đoán */}
            {showModal && selectedAppointment && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>📋 Chi Tiết Lịch Khám</h2>
                            <button className={styles.btnClose} onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* THÔNG TIN BỆNH NHÂN */}
                            <section className={styles.modalSection}>
                                <h3>👤 Thông tin bệnh nhân</h3>
                                <div className={styles.detailGrid}>
                                    <div>
                                        <strong>Họ tên:</strong>
                                        <span>{selectedAppointment.patient_name}</span>
                                    </div>
                                    <div>
                                        <strong>Số điện thoại:</strong>
                                        <span>{selectedAppointment.patient_phone}</span>
                                    </div>
                                    <div>
                                        <strong>Email:</strong>
                                        <span>{selectedAppointment.patient_email || 'Không có'}</span>
                                    </div>
                                    <div>
                                        <strong>Ngày sinh:</strong>
                                        <span>{selectedAppointment.patient_dob || 'Không có'}</span>
                                    </div>
                                    <div>
                                        <strong>Giới tính:</strong>
                                        <span>
                                            {selectedAppointment.patient_gender === 'male' ? 'Nam' :
                                                selectedAppointment.patient_gender === 'female' ? 'Nữ' : 'Khác'}
                                        </span>
                                    </div>
                                    <div>
                                        <strong>Địa chỉ:</strong>
                                        <span>{selectedAppointment.patient_address || 'Không có'}</span>
                                    </div>
                                </div>
                            </section>

                            {/* TRIỆU CHỨNG BAN ĐẦU */}
                            <section className={styles.modalSection}>
                                <h3>💬 Triệu chứng ban đầu</h3>
                                <div className={styles.symptomsDetail}>
                                    <p>{selectedAppointment.symptoms}</p>
                                    {selectedAppointment.note && (
                                        <>
                                            <strong>Ghi chú:</strong>
                                            <p>{selectedAppointment.note}</p>
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* FORM CHẨN ĐOÁN */}
                            {selectedAppointment.status === 'confirmed' && (
                                <section className={styles.modalSection}>
                                    <h3>📝 Chẩn đoán và kết luận</h3>
                                    <form onSubmit={handleSubmitDiagnosis}>
                                        <div className={styles.formGroup}>
                                            <label>Chẩn đoán <span className={styles.required}>*</span></label>
                                            <textarea
                                                name="diagnosis"
                                                value={diagnosisForm.diagnosis}
                                                onChange={handleDiagnosisChange}
                                                placeholder="Nhập chẩn đoán bệnh..."
                                                rows={4}
                                                required
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label>Kết luận <span className={styles.required}>*</span></label>
                                            <textarea
                                                name="conclusion"
                                                value={diagnosisForm.conclusion}
                                                onChange={handleDiagnosisChange}
                                                placeholder="Nhập kết luận khám..."
                                                rows={3}
                                                required
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            className={styles.btnPrescription}
                                            onClick={() => setShowPrescriptionForm(true)}
                                        >
                                            💊 Kê Đơn Thuốc
                                        </button>

                                        <button
                                            type="submit"
                                            className={styles.btnSubmit}
                                            disabled={loading}
                                        >
                                            {loading ? '⏳ Đang lưu...' : '✅ Hoàn thành khám'}
                                        </button>
                                    </form>
                                </section>
                            )}

                            {selectedAppointment.status === 'completed' && (
                                <section className={styles.modalSection}>
                                    <h3>✅ Đã hoàn thành khám</h3>
                                    <div className={styles.completedInfo}>
                                        <p>Lịch khám này đã được hoàn thành.</p>
                                    </div>
                                    <PrescriptionView
                                        bookingId={selectedAppointment.id}
                                        appointment={selectedAppointment}
                                        doctor={selectedAppointment.doctor || { full_name: 'N/A' }}
                                    />
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* PRESCRIPTION FORM MODAL */}
            {showPrescriptionForm && selectedAppointment && (
                <PrescriptionForm
                    bookingId={selectedAppointment.id}
                    appointment={selectedAppointment}
                    onClose={() => setShowPrescriptionForm(false)}
                    onSuccess={() => {
                        alert('✅ Đơn thuốc đã được lưu thành công');
                        setShowPrescriptionForm(false);
                    }}
                />
            )}

            {/* CONFIRM BOOKING MODAL */}
            {showConfirmModal && selectedAppointment && (
                <div className={styles.modalOverlay} onClick={() => setShowConfirmModal(false)}>
                    <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
                        <h3>✅ Xác nhận lịch khám</h3>
                        <div className={styles.modalBody}>
                            <p><strong>Bệnh nhân:</strong> {selectedAppointment.patient_name}</p>
                            <p><strong>Ngày giờ:</strong> {selectedAppointment.appointment_date} - {selectedAppointment.appointment_time}</p>
                            <p><strong>Triệu chứng:</strong> {selectedAppointment.symptoms}</p>
                            <p style={{ marginTop: '1rem', color: '#3b82f6' }}>
                                Bạn xác nhận sẽ khám cho bệnh nhân này?
                            </p>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                className={styles.btnCancel}
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Hủy
                            </button>
                            <button
                                className={styles.btnConfirmBooking}
                                onClick={() => handleConfirmBooking(selectedAppointment.id)}
                            >
                                ✅ Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REJECT BOOKING MODAL */}
            {showRejectModal && selectedAppointment && (
                <div className={styles.modalOverlay} onClick={() => setShowRejectModal(false)}>
                    <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
                        <h3>❌ Từ chối lịch khám</h3>
                        <div className={styles.modalBody}>
                            <p><strong>Bệnh nhân:</strong> {selectedAppointment.patient_name}</p>
                            <p><strong>Ngày giờ:</strong> {selectedAppointment.appointment_date} - {selectedAppointment.appointment_time}</p>

                            <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
                                <label>Lý do từ chối <span className={styles.required}>*</span></label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Vui lòng nhập lý do từ chối (bị trùng lịch, bận việc đột xuất...)"
                                    rows={4}
                                    className={styles.textarea}
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                className={styles.btnCancel}
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                className={styles.btnReject}
                                onClick={handleRejectBooking}
                                disabled={!rejectReason.trim()}
                            >
                                ❌ Từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
