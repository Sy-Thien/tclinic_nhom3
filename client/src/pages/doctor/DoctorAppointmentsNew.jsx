import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './DoctorAppointmentsNew.module.css';

export default function DoctorAppointmentsNew() {
    const [appointments, setAppointments] = useState([]);
    const [drugs, setDrugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [viewMode, setViewMode] = useState('day'); // day, week
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showExamModal, setShowExamModal] = useState(false);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

    // Form data
    const [examData, setExamData] = useState({
        diagnosis: '',
        conclusion: '',
        note: ''
    });

    const [prescriptionItems, setPrescriptionItems] = useState([{
        drug_id: '',
        quantity: 1,
        dosage: '',
        usage_instructions: ''
    }]);

    const navigate = useNavigate();

    useEffect(() => {
        fetchAppointments();
        fetchDrugs();
    }, [selectedDate, viewMode, filter]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (filter !== 'all') params.append('status', filter);
            params.append('date', selectedDate);
            params.append('view', viewMode);

            const response = await api.get(`/api/doctor/appointments?${params}`);
            setAppointments(response.data.appointments || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDrugs = async () => {
        try {
            // ✅ Dùng API public thay vì admin
            const response = await api.get('/api/public/drugs');
            setDrugs(response.data.drugs || response.data || []);
        } catch (error) {
            console.error('Error fetching drugs:', error);
            // Nếu API không có, set empty array để không crash
            setDrugs([]);
        }
    };

    // Xác nhận tiếp nhận
    const handleConfirm = async (id) => {
        if (!window.confirm('Xác nhận tiếp nhận bệnh nhân này?')) return;

        try {
            await api.put(`/api/doctor/appointments/${id}/confirm`);
            alert('✅ Đã xác nhận tiếp nhận!');
            fetchAppointments();
        } catch (error) {
            alert(error.response?.data?.message || '❌ Lỗi khi xác nhận');
        }
    };

    // Từ chối
    const handleReject = async (id) => {
        const reason = window.prompt('Lý do từ chối:');
        if (!reason) return;

        try {
            await api.put(`/api/doctor/appointments/${id}/reject`, { reason });
            alert('✅ Đã từ chối lịch hẹn');
            fetchAppointments();
        } catch (error) {
            alert(error.response?.data?.message || '❌ Lỗi');
        }
    };

    // Xem chi tiết
    const handleViewDetail = (appointment) => {
        setSelectedAppointment(appointment);
        setShowDetailModal(true);
    };

    // Bắt đầu khám
    const handleStartExam = (appointment) => {
        setSelectedAppointment(appointment);
        setExamData({
            diagnosis: appointment.diagnosis || '',
            conclusion: appointment.conclusion || '',
            note: appointment.note || ''
        });
        setShowExamModal(true);
    };

    // Lưu kết quả khám
    const handleSaveExam = async () => {
        if (!examData.diagnosis.trim()) {
            alert('Vui lòng nhập chẩn đoán!');
            return;
        }

        try {
            await api.put(`/api/doctor/appointments/${selectedAppointment.id}/exam`, examData);
            alert('✅ Đã lưu kết quả khám!');
            setShowExamModal(false);
            fetchAppointments();
        } catch (error) {
            alert(error.response?.data?.message || '❌ Lỗi khi lưu');
        }
    };

    // Hoàn thành khám
    const handleComplete = async (id) => {
        if (!window.confirm('Xác nhận hoàn thành khám bệnh nhân này?')) return;

        try {
            await api.put(`/api/doctor/appointments/${id}/complete`);
            alert('✅ Đã hoàn thành khám!');
            fetchAppointments();
        } catch (error) {
            alert(error.response?.data?.message || '❌ Lỗi');
        }
    };

    // Kê đơn thuốc
    const handleOpenPrescription = (appointment) => {
        setSelectedAppointment(appointment);
        setPrescriptionItems([{
            drug_id: '',
            quantity: 1,
            dosage: '',
            usage_instructions: ''
        }]);
        setShowPrescriptionModal(true);
    };

    const addPrescriptionItem = () => {
        setPrescriptionItems([...prescriptionItems, {
            drug_id: '',
            quantity: 1,
            dosage: '',
            usage_instructions: ''
        }]);
    };

    const removePrescriptionItem = (index) => {
        setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
    };

    const updatePrescriptionItem = (index, field, value) => {
        const updated = [...prescriptionItems];
        updated[index][field] = value;
        setPrescriptionItems(updated);
    };

    const handleSavePrescription = async () => {
        // Validate
        for (let item of prescriptionItems) {
            if (!item.drug_id || !item.quantity || !item.dosage) {
                alert('Vui lòng điền đầy đủ thông tin thuốc!');
                return;
            }
        }

        try {
            const response = await api.post('/api/doctor/prescriptions', {
                booking_id: selectedAppointment.id,
                items: prescriptionItems
            });

            alert('✅ Đã lưu đơn thuốc thành công!');

            // Download PDF nếu có
            if (response.data.pdfUrl) {
                window.open(response.data.pdfUrl, '_blank');
            }

            setShowPrescriptionModal(false);
            fetchAppointments();
        } catch (error) {
            alert(error.response?.data?.message || '❌ Lỗi khi lưu đơn thuốc');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'waiting_doctor_confirmation': { text: 'Chờ xác nhận', color: '#f59e0b' },
            'confirmed': { text: 'Đã xác nhận', color: '#10b981' },
            'completed': { text: 'Hoàn thành', color: '#6366f1' },
            'cancelled': { text: 'Đã hủy', color: '#ef4444' },
            'doctor_rejected': { text: 'Đã từ chối', color: '#dc2626' }
        };

        const badge = badges[status] || { text: status, color: '#6b7280' };
        return (
            <span className={styles.badge} style={{ backgroundColor: badge.color }}>
                {badge.text}
            </span>
        );
    };

    const stats = {
        total: appointments.length,
        waiting: appointments.filter(a => a.status === 'waiting_doctor_confirmation').length,
        confirmed: appointments.filter(a => a.status === 'confirmed').length,
        completed: appointments.filter(a => a.status === 'completed').length
    };

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
            {/* HEADER & STATS */}
            <div className={styles.header}>
                <div>
                    <h1>🩺 Lịch Khám Bệnh</h1>
                    <p>Quản lý lịch khám và tiếp nhận bệnh nhân</p>
                </div>
            </div>

            <div className={styles.statsBar}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{stats.total}</span>
                    <span className={styles.statLabel}>Tổng lịch</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{stats.waiting}</span>
                    <span className={styles.statLabel}>Chờ xác nhận</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{stats.confirmed}</span>
                    <span className={styles.statLabel}>Đã xác nhận</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{stats.completed}</span>
                    <span className={styles.statLabel}>Hoàn thành</span>
                </div>
            </div>

            {/* FILTERS */}
            <div className={styles.filterBar}>
                <div className={styles.viewToggle}>
                    <button
                        className={viewMode === 'day' ? styles.active : ''}
                        onClick={() => setViewMode('day')}
                    >
                        📅 Theo ngày
                    </button>
                    <button
                        className={viewMode === 'week' ? styles.active : ''}
                        onClick={() => setViewMode('week')}
                    >
                        📆 Theo tuần
                    </button>
                </div>

                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={styles.dateInput}
                />

                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className={styles.filterSelect}
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="waiting_doctor_confirmation">Chờ xác nhận</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="completed">Hoàn thành</option>
                </select>
            </div>

            {/* APPOINTMENTS LIST */}
            {appointments.length === 0 ? (
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>📭</span>
                    <h3>Không có lịch hẹn nào</h3>
                    <p>Chọn ngày khác để xem lịch khám</p>
                </div>
            ) : (
                <div className={styles.appointmentsList}>
                    {appointments.map(appointment => (
                        <div key={appointment.id} className={styles.appointmentCard}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3>{appointment.patient_name}</h3>
                                    <p className={styles.specialty}>{appointment.specialty?.name || 'Chuyên khoa'}</p>
                                </div>
                                {getStatusBadge(appointment.status)}
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>📅 Ngày khám:</span>
                                    <span>{new Date(appointment.appointment_date).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>🕐 Giờ:</span>
                                    <span>{appointment.appointment_time || 'Chưa xác định'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>📞 SĐT:</span>
                                    <span>{appointment.patient_phone}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>🩺 Triệu chứng:</span>
                                    <span className={styles.symptoms}>{appointment.symptoms}</span>
                                </div>
                            </div>

                            <div className={styles.cardFooter}>
                                <button
                                    className={styles.btnInfo}
                                    onClick={() => handleViewDetail(appointment)}
                                >
                                    👁️ Chi tiết
                                </button>

                                {appointment.status === 'waiting_doctor_confirmation' && (
                                    <>
                                        <button
                                            className={styles.btnConfirm}
                                            onClick={() => handleConfirm(appointment.id)}
                                        >
                                            ✅ Xác nhận
                                        </button>
                                        <button
                                            className={styles.btnReject}
                                            onClick={() => handleReject(appointment.id)}
                                        >
                                            ❌ Từ chối
                                        </button>
                                    </>
                                )}

                                {appointment.status === 'confirmed' && (
                                    <>
                                        <button
                                            className={styles.btnExam}
                                            onClick={() => handleStartExam(appointment)}
                                        >
                                            🩺 Khám bệnh
                                        </button>
                                        <button
                                            className={styles.btnPrescription}
                                            onClick={() => handleOpenPrescription(appointment)}
                                        >
                                            💊 Kê đơn thuốc
                                        </button>
                                        <button
                                            className={styles.btnComplete}
                                            onClick={() => handleComplete(appointment.id)}
                                        >
                                            ✅ Hoàn thành
                                        </button>
                                    </>
                                )}

                                {appointment.status === 'completed' && (
                                    <button
                                        className={styles.btnPrescription}
                                        onClick={() => handleOpenPrescription(appointment)}
                                    >
                                        💊 Xem đơn thuốc
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL CHI TIẾT */}
            {showDetailModal && selectedAppointment && (
                <div className={styles.modal} onClick={() => setShowDetailModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>📋 Chi tiết lịch khám</h2>
                            <button onClick={() => setShowDetailModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.detailSection}>
                                <h3>Thông tin bệnh nhân</h3>
                                <div className={styles.detailRow}>
                                    <span>Họ tên:</span>
                                    <strong>{selectedAppointment.patient_name}</strong>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Số điện thoại:</span>
                                    <strong>{selectedAppointment.patient_phone}</strong>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Email:</span>
                                    <strong>{selectedAppointment.patient_email || 'Không có'}</strong>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Ngày sinh:</span>
                                    <strong>{selectedAppointment.patient_dob || 'Không có'}</strong>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Địa chỉ:</span>
                                    <strong>{selectedAppointment.patient_address || 'Không có'}</strong>
                                </div>
                            </div>

                            <div className={styles.detailSection}>
                                <h3>Thông tin đặt lịch</h3>
                                <div className={styles.detailRow}>
                                    <span>Mã lịch:</span>
                                    <strong>{selectedAppointment.booking_code}</strong>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Ngày khám:</span>
                                    <strong>{new Date(selectedAppointment.appointment_date).toLocaleDateString('vi-VN')}</strong>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Giờ khám:</span>
                                    <strong>{selectedAppointment.appointment_time}</strong>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Chuyên khoa:</span>
                                    <strong>{selectedAppointment.specialty?.name}</strong>
                                </div>
                            </div>

                            <div className={styles.detailSection}>
                                <h3>Triệu chứng ban đầu</h3>
                                <p className={styles.symptoms}>{selectedAppointment.symptoms}</p>
                            </div>

                            {selectedAppointment.diagnosis && (
                                <div className={styles.detailSection}>
                                    <h3>Chẩn đoán</h3>
                                    <p>{selectedAppointment.diagnosis}</p>
                                </div>
                            )}

                            {selectedAppointment.conclusion && (
                                <div className={styles.detailSection}>
                                    <h3>Kết luận</h3>
                                    <p>{selectedAppointment.conclusion}</p>
                                </div>
                            )}
                        </div>
                        <div className={styles.modalFooter}>
                            <button onClick={() => setShowDetailModal(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KHÁM BỆNH */}
            {showExamModal && selectedAppointment && (
                <div className={styles.modal} onClick={() => setShowExamModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>🩺 Khám bệnh - {selectedAppointment.patient_name}</h2>
                            <button onClick={() => setShowExamModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>Triệu chứng ban đầu:</label>
                                <p className={styles.readOnly}>{selectedAppointment.symptoms}</p>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Chẩn đoán <span className={styles.required}>*</span></label>
                                <textarea
                                    value={examData.diagnosis}
                                    onChange={(e) => setExamData({ ...examData, diagnosis: e.target.value })}
                                    placeholder="Nhập chẩn đoán bệnh..."
                                    rows={4}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Kết luận khám</label>
                                <textarea
                                    value={examData.conclusion}
                                    onChange={(e) => setExamData({ ...examData, conclusion: e.target.value })}
                                    placeholder="Nhập kết luận khám..."
                                    rows={4}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Ghi chú</label>
                                <textarea
                                    value={examData.note}
                                    onChange={(e) => setExamData({ ...examData, note: e.target.value })}
                                    placeholder="Ghi chú thêm (nếu có)..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button onClick={() => setShowExamModal(false)}>Hủy</button>
                            <button className={styles.btnPrimary} onClick={handleSaveExam}>
                                💾 Lưu kết quả khám
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KÊ ĐƠN THUỐC */}
            {showPrescriptionModal && selectedAppointment && (
                <div className={styles.modal} onClick={() => setShowPrescriptionModal(false)}>
                    <div className={`${styles.modalContent} ${styles.large}`} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>💊 Kê đơn thuốc - {selectedAppointment.patient_name}</h2>
                            <button onClick={() => setShowPrescriptionModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            {prescriptionItems.map((item, index) => (
                                <div key={index} className={styles.prescriptionItem}>
                                    <h4>Thuốc #{index + 1}</h4>

                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label>Chọn thuốc *</label>
                                            <select
                                                value={item.drug_id}
                                                onChange={(e) => updatePrescriptionItem(index, 'drug_id', e.target.value)}
                                            >
                                                <option value="">-- Chọn thuốc --</option>
                                                {drugs.map(drug => (
                                                    <option key={drug.id} value={drug.id}>
                                                        {drug.name} ({drug.unit}) - Tồn: {drug.quantity_in_stock}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label>Số lượng *</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updatePrescriptionItem(index, 'quantity', parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Liều lượng *</label>
                                        <input
                                            type="text"
                                            value={item.dosage}
                                            onChange={(e) => updatePrescriptionItem(index, 'dosage', e.target.value)}
                                            placeholder="Ví dụ: 2 viên/lần, ngày 2 lần"
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Hướng dẫn sử dụng</label>
                                        <textarea
                                            value={item.usage_instructions}
                                            onChange={(e) => updatePrescriptionItem(index, 'usage_instructions', e.target.value)}
                                            placeholder="Uống sau ăn, sáng chiều..."
                                            rows={2}
                                        />
                                    </div>

                                    {prescriptionItems.length > 1 && (
                                        <button
                                            className={styles.btnRemove}
                                            onClick={() => removePrescriptionItem(index)}
                                        >
                                            🗑️ Xóa thuốc này
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button className={styles.btnAdd} onClick={addPrescriptionItem}>
                                ➕ Thêm thuốc
                            </button>
                        </div>
                        <div className={styles.modalFooter}>
                            <button onClick={() => setShowPrescriptionModal(false)}>Hủy</button>
                            <button className={styles.btnPrimary} onClick={handleSavePrescription}>
                                💾 Lưu đơn thuốc
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
