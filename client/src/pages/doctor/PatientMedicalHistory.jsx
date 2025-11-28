import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './PatientMedicalHistory.module.css';

export default function PatientMedicalHistory() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [histories, setHistories] = useState([]);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        fetchPatientHistory();
    }, [patientId]);

    const fetchPatientHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/medical-history/patient/${patientId}`);

            if (response.data.success) {
                setPatient(response.data.patient);
                setHistories(response.data.histories);
            }
        } catch (error) {
            console.error('Error fetching patient history:', error);
            alert('Không thể tải lịch sử khám bệnh');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('vi-VN');
    };

    const formatTime = (time) => {
        return time ? time.substring(0, 5) : '';
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const calculateAge = (birthday) => {
        if (!birthday) return '';
        const birthDate = new Date(birthday);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        return `${age} tuổi`;
    };

    if (loading) {
        return <div className={styles.loading}>Đang tải...</div>;
    }

    if (!patient) {
        return <div className={styles.error}>Không tìm thấy bệnh nhân</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={() => navigate(-1)} className={styles.backBtn}>
                    ← Quay lại
                </button>
                <h1>Lịch Sử Khám Bệnh</h1>
            </div>

            {/* Thông tin bệnh nhân */}
            <div className={styles.patientCard}>
                <div className={styles.patientInfo}>
                    <div className={styles.avatar}>
                        {patient.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.details}>
                        <h2>{patient.full_name}</h2>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Giới tính:</span>
                                <span>{patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : 'Khác'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Tuổi:</span>
                                <span>{calculateAge(patient.birthday)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>SĐT:</span>
                                <span>{patient.phone}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Email:</span>
                                <span>{patient.email}</span>
                            </div>
                            {patient.address && (
                                <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                                    <span className={styles.label}>Địa chỉ:</span>
                                    <span>{patient.address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className={styles.statsCard}>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>{histories.length}</span>
                        <span className={styles.statLabel}>Lần khám</span>
                    </div>
                </div>
            </div>

            {/* Danh sách lịch sử */}
            <div className={styles.historiesSection}>
                <h3>Lịch sử khám bệnh ({histories.length} lần)</h3>

                {histories.length === 0 ? (
                    <div className={styles.empty}>Chưa có lịch sử khám bệnh</div>
                ) : (
                    <div className={styles.timeline}>
                        {histories.map((history) => (
                            <div key={history.id} className={styles.historyCard}>
                                <div className={styles.historyHeader} onClick={() => toggleExpand(history.id)}>
                                    <div className={styles.visitInfo}>
                                        <span className={styles.visitDate}>
                                            📅 {formatDate(history.visit_date)} - {formatTime(history.visit_time)}
                                        </span>
                                        <span className={styles.doctorName}>
                                            👨‍⚕️ BS. {history.doctor?.full_name}
                                            {history.doctor?.specialty && ` - ${history.doctor.specialty.name}`}
                                        </span>
                                    </div>
                                    <button className={styles.expandBtn}>
                                        {expandedId === history.id ? '▼' : '▶'}
                                    </button>
                                </div>

                                {expandedId === history.id && (
                                    <div className={styles.historyContent}>
                                        <div className={styles.section}>
                                            <h4>Triệu chứng:</h4>
                                            <p>{history.symptoms || 'Không có thông tin'}</p>
                                        </div>

                                        {history.diagnosis && (
                                            <div className={styles.section}>
                                                <h4>Chẩn đoán:</h4>
                                                <p>{history.diagnosis}</p>
                                            </div>
                                        )}

                                        {history.conclusion && (
                                            <div className={styles.section}>
                                                <h4>Kết luận:</h4>
                                                <p>{history.conclusion}</p>
                                            </div>
                                        )}

                                        {history.treatment_plan && (
                                            <div className={styles.section}>
                                                <h4>Phương pháp điều trị:</h4>
                                                <p>{history.treatment_plan}</p>
                                            </div>
                                        )}

                                        {history.note && (
                                            <div className={styles.section}>
                                                <h4>Ghi chú bác sĩ:</h4>
                                                <p>{history.note}</p>
                                            </div>
                                        )}

                                        {/* Đơn thuốc */}
                                        {history.prescription && history.prescription.details?.length > 0 && (
                                            <div className={styles.section}>
                                                <h4>💊 Đơn thuốc:</h4>
                                                <table className={styles.prescriptionTable}>
                                                    <thead>
                                                        <tr>
                                                            <th>Tên thuốc</th>
                                                            <th>Liều lượng</th>
                                                            <th>Số lượng</th>
                                                            <th>Cách dùng</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {history.prescription.details.map((detail, idx) => (
                                                            <tr key={idx}>
                                                                <td>{detail.drug?.name}</td>
                                                                <td>{detail.dosage}</td>
                                                                <td>{detail.quantity} {detail.drug?.unit}</td>
                                                                <td>{detail.instructions}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {history.prescription.notes && (
                                                    <p className={styles.prescriptionNote}>
                                                        <strong>Lưu ý:</strong> {history.prescription.notes}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
