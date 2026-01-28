import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import styles from './ExaminationPage.module.css';
import PrescriptionFormPro from './PrescriptionFormPro';
import PaymentModal from './PaymentModal';

export default function ExaminationPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Có thể nhận appointment từ state hoặc load từ bookingId trong URL
    const [appointment, setAppointment] = useState(location.state?.appointment || null);
    const [loadingAppointment, setLoadingAppointment] = useState(false);

    const [formData, setFormData] = useState({
        diagnosis: '',
        conclusion: '',
        note: ''
    });
    const [saving, setSaving] = useState(false);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [prescriptionId, setPrescriptionId] = useState(null);
    const [medicalHistories, setMedicalHistories] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Load appointment từ bookingId nếu không có trong state
    useEffect(() => {
        const bookingId = searchParams.get('bookingId');

        if (!appointment && bookingId) {
            loadAppointmentById(bookingId);
        } else if (!appointment && !bookingId) {
            alert('Không tìm thấy thông tin lịch hẹn!');
            navigate('/doctor-portal/appointments');
        }
    }, [searchParams]);

    const loadAppointmentById = async (bookingId) => {
        try {
            setLoadingAppointment(true);
            const response = await api.get(`/api/doctor/bookings/${bookingId}`);
            if (response.data.success) {
                setAppointment(response.data.booking);
            } else {
                alert('Không tìm thấy lịch hẹn!');
                navigate('/doctor-portal/appointments');
            }
        } catch (error) {
            console.error('Error loading appointment:', error);
            alert('Lỗi khi tải thông tin lịch hẹn!');
            navigate('/doctor-portal/appointments');
        } finally {
            setLoadingAppointment(false);
        }
    };

    useEffect(() => {
        if (!appointment) return;

        // Load existing data if any
        if (appointment.diagnosis) setFormData(prev => ({ ...prev, diagnosis: appointment.diagnosis }));
        if (appointment.conclusion) setFormData(prev => ({ ...prev, conclusion: appointment.conclusion }));
        if (appointment.note) setFormData(prev => ({ ...prev, note: appointment.note }));

        // Load medical history
        if (appointment.patient_id) {
            loadMedicalHistory();
        }
    }, [appointment, navigate]);

    const loadMedicalHistory = async () => {
        try {
            setLoadingHistory(true);
            const response = await api.get(`/api/medical-history/patient/${appointment.patient_id}`);
            if (response.data.success) {
                setMedicalHistories(response.data.histories || []);
            }
        } catch (error) {
            console.error('Error loading medical history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveExamination = async () => {
        if (!formData.diagnosis.trim()) {
            alert('Vui lòng nhập chẩn đoán!');
            return;
        }

        try {
            setSaving(true);
            await api.put(`/api/doctor/appointments/${appointment.id}/exam`, formData);
            alert('Đã lưu thông tin khám bệnh!');
        } catch (error) {
            console.error('Error saving examination:', error);
            alert('Có lỗi xảy ra khi lưu!');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenPrescription = () => {
        if (!formData.diagnosis.trim()) {
            alert('Vui lòng nhập chẩn đoán trước khi kê đơn!');
            return;
        }
        setShowPrescriptionModal(true);
    };

    const handleComplete = async () => {
        if (!formData.diagnosis.trim()) {
            alert('Vui lòng nhập chẩn đoán trước khi hoàn thành!');
            return;
        }

        if (!window.confirm('Xác nhận hoàn thành khám bệnh?')) return;

        try {
            // 1. Save examination first
            await api.put(`/api/doctor/appointments/${appointment.id}/exam`, formData);

            // 2. Mark as completed
            await api.put(`/api/doctor/appointments/${appointment.id}/complete`);

            // 3. ✅ Lưu vào lịch sử bệnh án (nếu có patient_id)
            if (appointment.patient_id) {
                try {
                    await api.post('/api/medical-history/save', {
                        booking_id: appointment.id
                    });
                    console.log('✅ Medical history saved');
                } catch (historyError) {
                    // Không block flow nếu lưu history lỗi
                    console.warn('⚠️ Could not save medical history:', historyError.message);
                }
            }

            alert('Đã hoàn thành khám bệnh và lưu hồ sơ bệnh án!');
            navigate('/doctor-portal/appointments');
        } catch (error) {
            console.error('Error completing examination:', error);
            alert('Có lỗi xảy ra!');
        }
    };

    const formatTime = (time) => time ? time.substring(0, 5) : '';
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('vi-VN');
    };

    // Loading state
    if (loadingAppointment) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải thông tin lịch hẹn...</p>
                </div>
            </div>
        );
    }

    if (!appointment) return null;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate('/doctor-portal/appointments')}>
                    <i className="fas fa-arrow-left"></i>
                    Quay lại
                </button>
                <h1>Tiếp Nhận Bệnh Nhân</h1>
            </div>

            <div className={styles.mainContent}>
                {/* Patient Info Card */}
                <div className={styles.patientCard}>
                    <div className={styles.cardHeader}>
                        <h2><i className="fas fa-user-circle"></i> Thông Tin Bệnh Nhân</h2>
                        {appointment.patient_id && medicalHistories.length > 0 && (
                            <button
                                className={styles.historyBtn}
                                onClick={() => navigate(`/doctor-portal/patient-history/${appointment.patient_id}`)}
                            >
                                📋 Xem lịch sử ({medicalHistories.length} lần)
                            </button>
                        )}
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Họ và tên:</span>
                                <span className={styles.value}>{appointment.patient_name}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Số điện thoại:</span>
                                <span className={styles.value}>{appointment.patient_phone}</span>
                            </div>
                            {appointment.patient_email && (
                                <div className={styles.infoItem}>
                                    <span className={styles.label}>Email:</span>
                                    <span className={styles.value}>{appointment.patient_email}</span>
                                </div>
                            )}
                            {appointment.patient_dob && (
                                <div className={styles.infoItem}>
                                    <span className={styles.label}>Ngày sinh:</span>
                                    <span className={styles.value}>{appointment.patient_dob}</span>
                                </div>
                            )}
                            {appointment.patient_gender && (
                                <div className={styles.infoItem}>
                                    <span className={styles.label}>Giới tính:</span>
                                    <span className={styles.value}>
                                        {appointment.patient_gender === 'male' ? 'Nam' : 'Nữ'}
                                    </span>
                                </div>
                            )}
                            {appointment.patient_address && (
                                <div className={styles.infoItem}>
                                    <span className={styles.label}>Địa chỉ:</span>
                                    <span className={styles.value}>{appointment.patient_address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Appointment Info */}
                <div className={styles.appointmentCard}>
                    <div className={styles.cardHeader}>
                        <h2><i className="fas fa-calendar-check"></i> Thông Tin Lịch Hẹn</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.appointmentInfo}>
                            <div className={styles.timeSlot}>
                                <i className="fas fa-clock"></i>
                                <span>{formatTime(appointment.appointment_time)} - {formatDate(appointment.appointment_date)}</span>
                            </div>
                            <div className={styles.bookingCode}>
                                <i className="fas fa-barcode"></i>
                                <span>Mã booking: {appointment.booking_code}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Service Info - NEW */}
                <div className={styles.serviceCard}>
                    <div className={styles.cardHeader}>
                        <h2><i className="fas fa-concierge-bell"></i> Dịch Vụ Khám</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.serviceInfo}>
                            {appointment.service ? (
                                <>
                                    <div className={styles.serviceName}>
                                        <i className="fas fa-stethoscope"></i>
                                        <span>{appointment.service.name}</span>
                                    </div>
                                    <div className={styles.servicePrice}>
                                        <i className="fas fa-money-bill-wave"></i>
                                        <span>Giá dịch vụ: <strong>{Number(appointment.service.price || 0).toLocaleString('vi-VN')}đ</strong></span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={styles.serviceName}>
                                        <i className="fas fa-stethoscope"></i>
                                        <span>Khám tổng quát</span>
                                    </div>
                                    <div className={styles.servicePrice}>
                                        <i className="fas fa-money-bill-wave"></i>
                                        <span>Phí khám mặc định: <strong>200,000đ</strong></span>
                                    </div>
                                </>
                            )}
                            {appointment.specialty && (
                                <div className={styles.specialtyName}>
                                    <i className="fas fa-hospital"></i>
                                    <span>Chuyên khoa: {appointment.specialty.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Symptoms */}
                <div className={styles.symptomsCard}>
                    <div className={styles.cardHeader}>
                        <h2><i className="fas fa-notes-medical"></i> Triệu Chứng</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <p className={styles.symptomsText}>{appointment.symptoms}</p>
                    </div>
                </div>

                {/* Examination Form */}
                <div className={styles.examForm}>
                    <div className={styles.cardHeader}>
                        <h2><i className="fas fa-stethoscope"></i> Khám Bệnh</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.formGroup}>
                            <label htmlFor="diagnosis">
                                <i className="fas fa-diagnoses"></i>
                                Chẩn Đoán <span className={styles.required}>*</span>
                            </label>
                            <textarea
                                id="diagnosis"
                                name="diagnosis"
                                value={formData.diagnosis}
                                onChange={handleChange}
                                placeholder="Nhập chẩn đoán bệnh..."
                                rows="4"
                                className={styles.textarea}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="conclusion">
                                <i className="fas fa-check-double"></i>
                                Kết Luận
                            </label>
                            <textarea
                                id="conclusion"
                                name="conclusion"
                                value={formData.conclusion}
                                onChange={handleChange}
                                placeholder="Nhập kết luận..."
                                rows="3"
                                className={styles.textarea}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="note">
                                <i className="fas fa-sticky-note"></i>
                                Ghi Chú
                            </label>
                            <textarea
                                id="note"
                                name="note"
                                value={formData.note}
                                onChange={handleChange}
                                placeholder="Ghi chú thêm..."
                                rows="3"
                                className={styles.textarea}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button
                        className={styles.btnSave}
                        onClick={handleSaveExamination}
                        disabled={saving}
                    >
                        <i className="fas fa-save"></i>
                        {saving ? 'Đang lưu...' : 'Lưu Thông Tin'}
                    </button>
                    <button
                        className={`${styles.btnPrescription} ${prescriptionId ? styles.btnSuccess : ''}`}
                        onClick={handleOpenPrescription}
                    >
                        <i className="fas fa-prescription"></i>
                        {prescriptionId ? '✓ Đã Kê Đơn' : 'Kê Đơn Thuốc'}
                    </button>
                    <button
                        className={styles.btnPayment}
                        onClick={() => setShowPaymentModal(true)}
                        disabled={!formData.diagnosis.trim()}
                        title={!formData.diagnosis.trim() ? 'Vui lòng nhập chẩn đoán trước' : 'Thanh toán và hoàn thành khám'}
                    >
                        <i className="fas fa-credit-card"></i>
                        Thanh Toán & Hoàn Thành
                    </button>
                </div>

                {/* Flow guide */}
                <div className={styles.flowGuide}>
                    <p>📋 <strong>Quy trình:</strong> Nhập chẩn đoán → Kê đơn thuốc (nếu cần) → Thanh toán → Tự động hoàn thành</p>
                </div>
            </div>

            {/* Prescription Modal - Professional Version */}
            {showPrescriptionModal && (
                <PrescriptionFormPro
                    appointment={{
                        ...appointment,
                        diagnosis: formData.diagnosis // Pass current diagnosis
                    }}
                    onClose={() => setShowPrescriptionModal(false)}
                    onSuccess={(prescriptionData) => {
                        console.log('✅ Prescription saved successfully');
                        if (prescriptionData?.id) {
                            setPrescriptionId(prescriptionData.id);
                        }
                    }}
                />
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    bookingId={appointment.id}
                    prescriptionId={prescriptionId}
                    onPaymentComplete={async () => {
                        console.log('✅ Payment completed');

                        // Lưu lịch sử bệnh án nếu có patient_id
                        if (appointment.patient_id) {
                            try {
                                await api.post('/api/medical-history/save', {
                                    booking_id: appointment.id
                                });
                                console.log('✅ Medical history saved');
                            } catch (historyError) {
                                console.warn('⚠️ Could not save medical history:', historyError.message);
                            }
                        }

                        alert('Thanh toán thành công! Lịch khám đã hoàn thành.');
                        navigate('/doctor-portal/appointments');
                    }}
                />
            )}
        </div>
    );
}
