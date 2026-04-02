import React, { Component } from 'react';
import api from '../../utils/api';
import { generatePrescriptionPDF } from '../../utils/generatePrescriptionPDF';
import styles from './MedicalHistory.module.css';

class MedicalHistory extends Component {
    constructor(props) {
        super(props);
        this.state = {
            records: [],
            loading: true,
            selectedRecord: null,
            showDetailModal: false
        };
    }

    componentDidMount() {
        this.fetchMedicalHistory();
    }

    fetchMedicalHistory = async () => {
        try {
            const response = await api.get('/api/patient/medical-records/my-history');
            this.setState({ records: response.data.data || response.data });
        } catch (error) {
            console.error('Error fetching medical history:', error);
            alert('Không thể tải lịch sử khám bệnh');
        } finally {
            this.setState({ loading: false });
        }
    };

    handleViewDetail = async (recordId) => {
        try {
            const response = await api.get(`/api/patient/medical-records/my-history/${recordId}`);
            this.setState({
                selectedRecord: response.data.data || response.data,
                showDetailModal: true
            });
        } catch (error) {
            console.error('Error fetching record detail:', error);
            alert('Không thể tải chi tiết khám bệnh');
        }
    };

    handleDownloadPDF = (record) => {
        if (!record || !record.prescription) {
            alert('Không có đơn thuốc để tải');
            return;
        }

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            const appointmentData = {
                patient_name: user.full_name || user.name,
                patient_dob: user.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : '',
                patient_gender: user.gender,
                patient_phone: user.phone,
                patient_email: user.email,
                patient_address: user.address,
                appointment_date: record.appointment_date ? new Date(record.appointment_date).toLocaleDateString('vi-VN') : '',
                appointment_time: record.appointment_time,
                symptoms: record.symptoms,
                diagnosis: record.diagnosis,
                conclusion: record.conclusion,
                specialty: record.doctor?.specialty || record.specialty,
                doctor_name: record.doctor?.full_name
            };

            const prescriptionData = {
                prescription_code: record.prescription.prescription_code,
                note: record.prescription.note,
                PrescriptionDetails: record.prescription.details?.map(detail => ({
                    Drug: detail.drug,
                    quantity: detail.quantity,
                    unit: detail.unit || detail.drug?.unit || 'viên',
                    dosage: detail.dosage,
                    duration: detail.duration,
                    note: detail.note
                })) || []
            };

            const doctorData = {
                full_name: record.doctor?.full_name
            };

            console.log('📄 Generating PDF with data:', { prescriptionData, appointmentData, doctorData });
            generatePrescriptionPDF(prescriptionData, appointmentData, doctorData);
        } catch (error) {
            console.error('❌ Error generating PDF:', error);
            alert('Có lỗi xảy ra khi tải đơn thuốc. Vui lòng thử lại!');
        }
    };

    formatDate = (dateString, timeString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const formattedDate = date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        if (timeString) {
            const timeParts = timeString.split(':');
            const formattedTime = timeParts.length >= 2 ? `${timeParts[0]}:${timeParts[1]}` : timeString;
            return `${formattedTime} ${formattedDate}`;
        }
        return formattedDate;
    };

    render() {
        const { records, loading, selectedRecord, showDetailModal } = this.state;

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
                                        <span className={styles.date}>{this.formatDate(record.appointment_date, record.appointment_time)}</span>
                                    </div>
                                    <div className={styles.statusBadge}>Đã khám</div>
                                </div>

                                <div className={styles.recordBody}>
                                    {record.booking_code && (
                                        <div className={styles.infoRow}>
                                            <span className={styles.label}>Mã phiếu:</span>
                                            <span className={styles.value}>{record.booking_code}</span>
                                        </div>
                                    )}
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Bác sĩ:</span>
                                        <span className={styles.value}>{record.doctor?.full_name || 'N/A'}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Chuyên khoa:</span>
                                        <span className={styles.value}>{record.doctor?.specialty?.name || record.specialty?.name || 'N/A'}</span>
                                    </div>
                                    {record.service && (
                                        <div className={styles.infoRow}>
                                            <span className={styles.label}>Dịch vụ:</span>
                                            <span className={styles.value}>{record.service.name}</span>
                                        </div>
                                    )}
                                    <div className={styles.infoRow}>
                                        <span className={styles.label}>Triệu chứng:</span>
                                        <span className={styles.value}>{record.symptoms || 'Không có'}</span>
                                    </div>
                                    {record.diagnosis && (
                                        <div className={styles.infoRow}>
                                            <span className={styles.label}>Chẩn đoán:</span>
                                            <span className={styles.value}>{record.diagnosis}</span>
                                        </div>
                                    )}
                                    {record.prescription && (
                                        <div className={styles.infoRow}>
                                            <span className={styles.label}>Đơn thuốc:</span>
                                            <span className={styles.value} style={{ color: '#27ae60', fontWeight: 600 }}>✓ Có đơn thuốc</span>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.recordFooter}>
                                    <button
                                        className={styles.btnView}
                                        onClick={() => this.handleViewDetail(record.id)}
                                    >
                                        Xem chi tiết
                                    </button>
                                    {record.prescription && (
                                        <button
                                            className={styles.btnDownload}
                                            onClick={() => this.handleDownloadPDF(record)}
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
                    <div className={styles.modalOverlay} onClick={() => this.setState({ showDetailModal: false })}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>Chi Tiết Khám Bệnh</h2>
                                <button
                                    className={styles.btnClose}
                                    onClick={() => this.setState({ showDetailModal: false })}
                                >
                                    ×
                                </button>
                            </div>

                            <div className={styles.modalBody}>
                                <div className={styles.section}>
                                    <h3>Thông tin khám</h3>
                                    <div className={styles.detailInfo}>
                                        {selectedRecord.booking_code && (
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Mã phiếu khám:</span>
                                                <span>{selectedRecord.booking_code}</span>
                                            </div>
                                        )}
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Ngày khám:</span>
                                            <span>{this.formatDate(selectedRecord.appointment_date, selectedRecord.appointment_time)}</span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Bác sĩ:</span>
                                            <span>{selectedRecord.doctor?.full_name}</span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Chuyên khoa:</span>
                                            <span>{selectedRecord.doctor?.specialty?.name || selectedRecord.specialty?.name}</span>
                                        </div>
                                        {selectedRecord.service && (
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Dịch vụ:</span>
                                                <span>{selectedRecord.service.name}</span>
                                            </div>
                                        )}
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Triệu chứng:</span>
                                            <span>{selectedRecord.symptoms || 'Không có'}</span>
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

                                {selectedRecord.note && (
                                    <div className={styles.section}>
                                        <h3>📝 Ghi chú của bác sĩ</h3>
                                        <div className={styles.textContent}>
                                            {selectedRecord.note}
                                        </div>
                                    </div>
                                )}

                                {selectedRecord.prescription && (
                                    <div className={styles.section}>
                                        <h3>💊 Đơn thuốc - Hướng dẫn sử dụng</h3>
                                        <div className={styles.prescriptionCode}>
                                            Mã đơn: <strong>{selectedRecord.prescription.prescription_code}</strong>
                                        </div>
                                        <table className={styles.prescriptionTable}>
                                            <thead>
                                                <tr>
                                                    <th>STT</th>
                                                    <th>Tên thuốc</th>
                                                    <th>Hoạt chất</th>
                                                    <th>Số lượng</th>
                                                    <th>Cách dùng</th>
                                                    <th>Thời gian</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedRecord.prescription.details?.map((detail, index) => (
                                                    <tr key={index}>
                                                        <td className={styles.centerText}>{index + 1}</td>
                                                        <td><strong>{detail.drug?.name || 'N/A'}</strong></td>
                                                        <td className={styles.ingredient}>{detail.drug?.ingredient || 'N/A'}</td>
                                                        <td className={styles.centerText}>{detail.quantity} {detail.unit}</td>
                                                        <td className={styles.dosage}>
                                                            <div className={styles.dosageInstruction}>
                                                                {detail.dosage || 'Theo chỉ dẫn bác sĩ'}
                                                            </div>
                                                            {detail.note && (
                                                                <div className={styles.drugNote}>📌 {detail.note}</div>
                                                            )}
                                                        </td>
                                                        <td className={styles.centerText}>{detail.duration || 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {selectedRecord.prescription.note && (
                                            <div className={styles.prescriptionNote}>
                                                <strong>📝 Lưu ý từ bác sĩ:</strong>
                                                <p>{selectedRecord.prescription.note}</p>
                                            </div>
                                        )}
                                        <div className={styles.importantNotes}>
                                            <h4>⚠️ Lưu ý quan trọng khi dùng thuốc:</h4>
                                            <ul>
                                                <li>Uống thuốc đúng giờ, đúng liều lượng theo chỉ định</li>
                                                <li>Không tự ý ngừng thuốc hoặc thay đổi liều lượng</li>
                                                <li>Uống thuốc cùng nước lọc, tránh uống với trà, cà phê, sữa</li>
                                                <li>Nếu có phản ứng phụ bất thường, liên hệ ngay bác sĩ</li>
                                                <li>Bảo quản thuốc nơi khô ráo, thoáng mát, tránh ánh sáng</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.modalFooter}>
                                {selectedRecord.prescription && (
                                    <button
                                        className={styles.btnDownloadModal}
                                        onClick={() => this.handleDownloadPDF(selectedRecord)}
                                    >
                                        📄 Tải đơn thuốc PDF
                                    </button>
                                )}
                                <button
                                    className={styles.btnCloseModal}
                                    onClick={() => this.setState({ showDetailModal: false })}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default MedicalHistory;
