import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import styles from './ExaminationPage.module.css';

export default function ExaminationPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const appointment = location.state?.appointment;

    const [formData, setFormData] = useState({
        diagnosis: '',
        conclusion: '',
        note: ''
    });
    const [saving, setSaving] = useState(false);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [medicalHistories, setMedicalHistories] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (!appointment) {
            alert('Không tìm thấy thông tin lịch hẹn!');
            navigate('/doctor-portal/appointments');
            return;
        }

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
            // Save examination first
            await api.put(`/api/doctor/appointments/${appointment.id}/exam`, formData);
            // Mark as completed
            await api.put(`/api/doctor/appointments/${appointment.id}/complete`);
            alert('Đã hoàn thành khám bệnh!');
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
                                onClick={() => navigate(`/doctor/patient-history/${appointment.patient_id}`)}
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
                        className={styles.btnPrescription}
                        onClick={handleOpenPrescription}
                    >
                        <i className="fas fa-prescription"></i>
                        Kê Đơn Thuốc
                    </button>
                    <button
                        className={styles.btnComplete}
                        onClick={handleComplete}
                    >
                        <i className="fas fa-check-circle"></i>
                        Hoàn Thành
                    </button>
                </div>
            </div>

            {/* Prescription Modal */}
            {showPrescriptionModal && (
                <PrescriptionModal
                    appointment={appointment}
                    onClose={() => setShowPrescriptionModal(false)}
                />
            )}
        </div>
    );
}

// Prescription Modal Component
function PrescriptionModal({ appointment, onClose }) {
    const navigate = useNavigate();
    const [drugs, setDrugs] = useState([]);
    const [prescriptionItems, setPrescriptionItems] = useState([{
        drug_id: '',
        quantity: 1,
        dosage: '',
        usage_instructions: ''
    }]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchDrugs();
    }, []);

    const fetchDrugs = async () => {
        try {
            const response = await api.get('/api/public/drugs');
            setDrugs(response.data.drugs || []);
        } catch (error) {
            console.error('Error fetching drugs:', error);
        }
    };

    const addItem = () => {
        setPrescriptionItems([...prescriptionItems, {
            drug_id: '',
            quantity: 1,
            dosage: '',
            usage_instructions: ''
        }]);
    };

    const removeItem = (index) => {
        setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        const updated = [...prescriptionItems];
        updated[index][field] = value;
        setPrescriptionItems(updated);
    };

    const handleSavePrescription = async () => {
        // Validate
        const validItems = prescriptionItems.filter(item => item.drug_id && item.quantity > 0);
        if (validItems.length === 0) {
            alert('Vui lòng chọn ít nhất một loại thuốc!');
            return;
        }

        try {
            setSaving(true);
            // Format data theo API backend
            const payload = {
                booking_id: appointment.id,
                patient_id: appointment.patient_id,
                drugs: validItems.map(item => ({
                    drug_id: parseInt(item.drug_id),
                    quantity: item.quantity,
                    unit: 'viên',
                    dosage: item.dosage || null,
                    note: item.usage_instructions || null
                }))
            };

            await api.post('/api/doctor/prescriptions', payload);
            alert('Đã kê đơn thuốc thành công!');
            onClose();
        } catch (error) {
            console.error('Error saving prescription:', error);
            alert(error.response?.data?.message || 'Có lỗi xảy ra khi kê đơn!');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2><i className="fas fa-prescription-bottle"></i> Kê Đơn Thuốc</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {prescriptionItems.map((item, index) => (
                        <div key={index} className={styles.prescriptionItem}>
                            <div className={styles.itemHeader}>
                                <h4>Thuốc #{index + 1}</h4>
                                {prescriptionItems.length > 1 && (
                                    <button
                                        className={styles.removeBtn}
                                        onClick={() => removeItem(index)}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                )}
                            </div>

                            <div className={styles.itemForm}>
                                <div className={styles.formGroup}>
                                    <label>Tên thuốc *</label>
                                    <select
                                        value={item.drug_id}
                                        onChange={(e) => updateItem(index, 'drug_id', e.target.value)}
                                        className={styles.select}
                                    >
                                        <option value="">-- Chọn thuốc --</option>
                                        {drugs.map(drug => (
                                            <option key={drug.id} value={drug.id}>
                                                {drug.name} ({drug.unit}) - Còn: {drug.stock_quantity}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Số lượng *</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Liều lượng</label>
                                        <input
                                            type="text"
                                            value={item.dosage}
                                            onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                                            placeholder="VD: 1 viên/lần"
                                            className={styles.input}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Cách dùng</label>
                                    <input
                                        type="text"
                                        value={item.usage_instructions}
                                        onChange={(e) => updateItem(index, 'usage_instructions', e.target.value)}
                                        placeholder="VD: Uống sau ăn, ngày 2 lần"
                                        className={styles.input}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    <button className={styles.btnAddItem} onClick={addItem}>
                        <i className="fas fa-plus"></i>
                        Thêm Thuốc
                    </button>
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.btnCancel} onClick={onClose}>
                        Hủy
                    </button>
                    <button
                        className={styles.btnSavePrescription}
                        onClick={handleSavePrescription}
                        disabled={saving}
                    >
                        <i className="fas fa-save"></i>
                        {saving ? 'Đang lưu...' : 'Lưu Đơn Thuốc'}
                    </button>
                </div>
            </div>
        </div>
    );
}
