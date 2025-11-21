import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './PrescriptionForm.module.css';
import generatePrescriptionPDF from '../../utils/generatePrescriptionPDF';

const PrescriptionForm = ({ bookingId, appointment, onClose, onSuccess }) => {
    const [drugs, setDrugs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [prescriptionDetails, setPrescriptionDetails] = useState([
        { drug_id: '', quantity: 1, unit: 'viên', dosage: '', duration: '', note: '' }
    ]);
    const [generalNote, setGeneralNote] = useState('');

    useEffect(() => {
        fetchDrugs();
    }, []);

    const fetchDrugs = async () => {
        try {
            const response = await axios.get('/api/admin/drugs', {
                params: { limit: 1000 }
            });
            if (response.data.success) {
                setDrugs(response.data.data);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách thuốc:', err);
            setError('Không thể tải danh sách thuốc');
        }
    };

    const handleDetailChange = (index, field, value) => {
        const newDetails = [...prescriptionDetails];
        newDetails[index][field] = value;

        // Auto-update unit khi chọn thuốc
        if (field === 'drug_id' && value) {
            const selectedDrug = drugs.find(d => d.id === parseInt(value));
            if (selectedDrug) {
                newDetails[index].unit = selectedDrug.unit || 'viên';
            }
        }

        setPrescriptionDetails(newDetails);
    };

    const addDrugLine = () => {
        setPrescriptionDetails([
            ...prescriptionDetails,
            { drug_id: '', quantity: 1, unit: 'viên', dosage: '', duration: '', note: '' }
        ]);
    };

    const removeDrugLine = (index) => {
        if (prescriptionDetails.length > 1) {
            setPrescriptionDetails(prescriptionDetails.filter((_, i) => i !== index));
        }
    };

    const validateForm = () => {
        // Kiểm tra tất cả dòng thuốc có chọn thuốc chưa
        const emptyDrugs = prescriptionDetails.some(detail => !detail.drug_id);
        if (emptyDrugs) {
            setError('Vui lòng chọn thuốc cho tất cả các dòng');
            return false;
        }

        // Kiểm tra số lượng có hợp lệ không
        const invalidQuantities = prescriptionDetails.some(detail => !detail.quantity || parseInt(detail.quantity) <= 0);
        if (invalidQuantities) {
            setError('Số lượng thuốc phải lớn hơn 0');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            const payload = {
                booking_id: bookingId,
                prescription_details: prescriptionDetails.map(detail => ({
                    drug_id: parseInt(detail.drug_id),
                    quantity: parseInt(detail.quantity),
                    unit: detail.unit,
                    dosage: detail.dosage,
                    duration: detail.duration,
                    note: detail.note
                })),
                note: generalNote
            };

            const response = await axios.post('/api/doctor/prescriptions', payload);

            if (response.data.success) {
                console.log('✅ Lưu đơn thuốc thành công');

                // Xuất PDF toa thuốc
                try {
                    setTimeout(() => {
                        generatePrescriptionPDF(
                            response.data.data,
                            appointment,
                            { full_name: appointment?.doctor_name || 'N/A' }
                        );
                    }, 500);
                } catch (pdfErr) {
                    console.error('Lỗi khi xuất PDF:', pdfErr);
                }

                onSuccess?.();
                onClose();
            } else {
                setError(response.data.message || 'Không thể lưu đơn thuốc');
            }
        } catch (err) {
            console.error('Lỗi lưu đơn thuốc:', err);
            setError(err.response?.data?.message || 'Lỗi khi lưu đơn thuốc');
        } finally {
            setLoading(false);
        }
    };

    const getSelectedDrugDetails = (drugId) => {
        return drugs.find(d => d.id === parseInt(drugId));
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>📝 Tạo Đơn Thuốc</h2>
                    <button className={styles.closeBtn} onClick={onClose} disabled={loading}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.section}>
                        <h3>Thuốc Kê Đơn</h3>
                        <div className={styles.drugsList}>
                            {prescriptionDetails.map((detail, index) => {
                                const selectedDrug = getSelectedDrugDetails(detail.drug_id);
                                return (
                                    <div key={index} className={styles.drugRow}>
                                        <div className={styles.drugSelect}>
                                            <label>Thuốc *</label>
                                            <select
                                                value={detail.drug_id}
                                                onChange={(e) => handleDetailChange(index, 'drug_id', e.target.value)}
                                                disabled={loading}
                                                required
                                            >
                                                <option value="">-- Chọn thuốc --</option>
                                                {drugs.map(drug => (
                                                    <option key={drug.id} value={drug.id}>
                                                        {drug.name} - Tồn kho: {drug.quantity} {drug.unit}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className={styles.quantity}>
                                            <label>Số lượng *</label>
                                            <div className={styles.quantityInput}>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={detail.quantity}
                                                    onChange={(e) => handleDetailChange(index, 'quantity', e.target.value)}
                                                    disabled={loading}
                                                    required
                                                />
                                                <span className={styles.unit}>{detail.unit}</span>
                                            </div>
                                            {selectedDrug && detail.quantity > selectedDrug.quantity && (
                                                <span className={styles.warning}>⚠️ Tồn kho không đủ</span>
                                            )}
                                        </div>

                                        <div className={styles.dosage}>
                                            <label>Liều lượng</label>
                                            <input
                                                type="text"
                                                placeholder="vd: Sáng, trưa, tối"
                                                value={detail.dosage}
                                                onChange={(e) => handleDetailChange(index, 'dosage', e.target.value)}
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className={styles.duration}>
                                            <label>Thời gian</label>
                                            <input
                                                type="text"
                                                placeholder="vd: 7 ngày"
                                                value={detail.duration}
                                                onChange={(e) => handleDetailChange(index, 'duration', e.target.value)}
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className={styles.note}>
                                            <label>Ghi chú</label>
                                            <input
                                                type="text"
                                                placeholder="vd: Uống sau ăn"
                                                value={detail.note}
                                                onChange={(e) => handleDetailChange(index, 'note', e.target.value)}
                                                disabled={loading}
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            className={styles.removeBtn}
                                            onClick={() => removeDrugLine(index)}
                                            disabled={loading || prescriptionDetails.length === 1}
                                            title="Xóa dòng thuốc"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            className={styles.addDrugBtn}
                            onClick={addDrugLine}
                            disabled={loading}
                        >
                            + Thêm Thuốc
                        </button>
                    </div>

                    <div className={styles.section}>
                        <label>Ghi chú chung</label>
                        <textarea
                            value={generalNote}
                            onChange={(e) => setGeneralNote(e.target.value)}
                            placeholder="Ghi chú thêm cho toàn bộ đơn thuốc (nếu có)..."
                            rows="3"
                            disabled={loading}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={onClose}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? '⏳ Đang lưu...' : '💾 Lưu Đơn Thuốc'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PrescriptionForm;
