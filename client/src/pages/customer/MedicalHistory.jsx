import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './MedicalHistory.module.css';

const MedicalHistory = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchMedicalHistory();
    }, []);

    const fetchMedicalHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/medical-records/my-history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRecords(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching medical history:', error);
            alert('Không thể tải lịch sử khám bệnh');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (recordId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/medical-records/my-history/${recordId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedRecord(response.data.data || response.data);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Error fetching record detail:', error);
            alert('Không thể tải chi tiết khám bệnh');
        }
    };

    const handleDownloadPDF = (recordId) => {
        const token = localStorage.getItem('token');
        window.open(`http://localhost:5000/api/doctor/prescriptions/download-pdf/${recordId}?token=${token}`, '_blank');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div className={styles.loading}>Đang tải lịch sử khám bệnh...</div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>📋 Lịch Sử Khám Bệnh</h1>

            {records.length === 0 ? (
                <div className={styles.empty}>
                    <p>Bạn chưa có lịch sử khám bệnh nào</p>
                </div>
            ) : (
                <div className={styles.recordsList}>
                    {records.map((record) => (
                        <div key={record.id} className={styles.recordCard}>
                            <div className={styles.recordHeader}>
                                <div className={styles.dateInfo}>
                                    <span className={styles.date}>{formatDate(record.appointment_date)}</span>
                                </div>
                                <div className={styles.statusBadge}>Đã khám</div>
                            </div>

                            <div className={styles.recordBody}>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Bác sĩ:</span>
                                    <span className={styles.value}>{record.doctor?.full_name || 'N/A'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Chuyên khoa:</span>
                                    <span className={styles.value}>{record.doctor?.specialty?.name || 'N/A'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Lý do khám:</span>
                                    <span className={styles.value}>{record.chief_complaint || 'Không có'}</span>
                                </div>
                            </div>

                            <div className={styles.recordFooter}>
                                <button
                                    className={styles.btnView}
                                    onClick={() => handleViewDetail(record.id)}
                                >
                                    Xem chi tiết
                                </button>
                                {record.prescription && (
                                    <button
                                        className={styles.btnDownload}
                                        onClick={() => handleDownloadPDF(record.id)}
                                    >
                                        📄 Tải đơn thuốc
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedRecord && (
                <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Chi Tiết Khám Bệnh</h2>
                            <button
                                className={styles.btnClose}
                                onClick={() => setShowDetailModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.section}>
                                <h3>Thông tin khám</h3>
                                <div className={styles.detailInfo}>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Ngày khám:</span>
                                        <span>{formatDate(selectedRecord.appointment_date)}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Bác sĩ:</span>
                                        <span>{selectedRecord.doctor?.full_name}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Chuyên khoa:</span>
                                        <span>{selectedRecord.doctor?.specialty?.name}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Lý do khám:</span>
                                        <span>{selectedRecord.chief_complaint}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.section}>
                                <h3>Chẩn đoán</h3>
                                <div className={styles.textContent}>
                                    {selectedRecord.diagnosis || 'Chưa có chẩn đoán'}
                                </div>
                            </div>

                            <div className={styles.section}>
                                <h3>Kết luận</h3>
                                <div className={styles.textContent}>
                                    {selectedRecord.conclusion || 'Chưa có kết luận'}
                                </div>
                            </div>

                            {selectedRecord.prescription && (
                                <div className={styles.section}>
                                    <h3>Đơn thuốc</h3>
                                    <table className={styles.prescriptionTable}>
                                        <thead>
                                            <tr>
                                                <th>Tên thuốc</th>
                                                <th>Hoạt chất</th>
                                                <th>Số lượng</th>
                                                <th>Liều dùng</th>
                                                <th>Thời gian</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedRecord.prescription.details?.map((detail, index) => (
                                                <tr key={index}>
                                                    <td>{detail.drug?.name || 'N/A'}</td>
                                                    <td>{detail.drug?.ingredient || 'N/A'}</td>
                                                    <td>{detail.quantity}</td>
                                                    <td>{detail.dosage}</td>
                                                    <td>{detail.duration}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className={styles.prescriptionNote}>
                                        <strong>Ghi chú:</strong> {selectedRecord.prescription.notes || 'Không có'}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            {selectedRecord.prescription && (
                                <button
                                    className={styles.btnDownloadModal}
                                    onClick={() => handleDownloadPDF(selectedRecord.id)}
                                >
                                    📄 Tải đơn thuốc PDF
                                </button>
                            )}
                            <button
                                className={styles.btnCloseModal}
                                onClick={() => setShowDetailModal(false)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicalHistory;
