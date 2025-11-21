import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './PrescriptionView.module.css';
import generatePrescriptionPDF from '../../utils/generatePrescriptionPDF';

const PrescriptionView = ({ bookingId, appointment, doctor }) => {
    const [prescription, setPrescription] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchPrescription();
    }, [bookingId]);

    const fetchPrescription = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/doctor/prescriptions/booking/${bookingId}`);
            if (response.data.success) {
                setPrescription(response.data.data);
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                setError('Không thể tải đơn thuốc');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        if (!prescription) return;
        setExporting(true);
        try {
            generatePrescriptionPDF(prescription, appointment, doctor);
        } catch (err) {
            console.error('Lỗi khi xuất PDF:', err);
            alert('Lỗi khi xuất PDF');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return <div className={styles.loading}>⏳ Đang tải...</div>;
    }

    if (!prescription) {
        return null;
    }

    return (
        <section className={styles.container}>
            <div className={styles.header}>
                <h3>💊 Đơn Thuốc</h3>
                <div className={styles.headerActions}>
                    <span className={styles.prescriptionCode}>{prescription.prescription_code}</span>
                    <button
                        className={styles.exportBtn}
                        onClick={handleExportPDF}
                        disabled={exporting}
                        title="Xuất PDF toa thuốc"
                    >
                        {exporting ? '⏳ Đang xuất...' : '📄 Xuất PDF'}
                    </button>
                </div>
            </div>

            <div className={styles.drugsList}>
                <div className={styles.tableHeader}>
                    <div className={styles.col_name}>Tên Thuốc</div>
                    <div className={styles.col_ingredient}>Hoạt Chất</div>
                    <div className={styles.col_quantity}>Số Lượng</div>
                    <div className={styles.col_dosage}>Liều Lượng</div>
                    <div className={styles.col_duration}>Thời Gian</div>
                    <div className={styles.col_note}>Ghi Chú</div>
                </div>

                {prescription.PrescriptionDetails && prescription.PrescriptionDetails.map((detail, index) => (
                    <div key={index} className={styles.tableRow}>
                        <div className={styles.col_name}>{detail.Drug?.name}</div>
                        <div className={styles.col_ingredient}>{detail.Drug?.ingredient}</div>
                        <div className={styles.col_quantity}>
                            {detail.quantity} {detail.unit}
                        </div>
                        <div className={styles.col_dosage}>{detail.dosage || '-'}</div>
                        <div className={styles.col_duration}>{detail.duration || '-'}</div>
                        <div className={styles.col_note}>{detail.note || '-'}</div>
                    </div>
                ))}
            </div>

            {prescription.note && (
                <div className={styles.generalNote}>
                    <strong>Ghi Chú Chung:</strong>
                    <p>{prescription.note}</p>
                </div>
            )}
        </section>
    );
};

export default PrescriptionView;
