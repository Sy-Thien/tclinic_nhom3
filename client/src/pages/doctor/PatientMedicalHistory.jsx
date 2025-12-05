import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import api from '../../utils/api';
import styles from './PatientMedicalHistory.module.css';
import PrintMedicalRecord from './PrintMedicalRecord';

export default function PatientMedicalHistory() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [histories, setHistories] = useState([]);
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
    const printRef = useRef(null);

    // Print handler
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `BenhAn_${patient?.full_name || 'Patient'}_${selectedHistory?.visit_date || 'Date'}`,
        pageStyle: `
            @page {
                size: A4;
                margin: 5mm;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `
    });

    useEffect(() => {
        fetchPatientHistory();
    }, [patientId]);

    const fetchPatientHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/medical-history/patient/${patientId}`);

            if (response.data.success) {
                setPatient(response.data.patient);
                setHistories(response.data.histories || []);
                // Auto-select first history if available
                if (response.data.histories?.length > 0) {
                    setSelectedHistory(response.data.histories[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching patient history:', error);
            // ✅ Xử lý trường hợp bác sĩ không có quyền xem
            if (error.response?.status === 403) {
                alert('⚠️ ' + (error.response.data.message || 'Bạn không có quyền xem hồ sơ bệnh nhân này'));
                navigate(-1);
                return;
            }
            alert('Không thể tải lịch sử khám bệnh');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateShort = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('vi-VN');
    };

    const formatTime = (time) => {
        return time ? time.substring(0, 5) : '';
    };

    const calculateAge = (birthday) => {
        if (!birthday) return '';
        const birthDate = new Date(birthday);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        return `${age} tuổi`;
    };

    const selectHistory = (history) => {
        setSelectedHistory(history);
        if (window.innerWidth < 1024) {
            setViewMode('detail');
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Đang tải hồ sơ bệnh án...</p>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorIcon}>❌</div>
                <h2>Không tìm thấy bệnh nhân</h2>
                <button onClick={() => navigate(-1)} className={styles.backBtn}>
                    ← Quay lại
                </button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button onClick={() => navigate(-1)} className={styles.backBtn}>
                    ← Quay lại
                </button>
                <h1>Hồ Sơ Bệnh Án</h1>
            </div>

            {/* Patient Info Card */}
            <div className={styles.patientCard}>
                <div className={styles.patientMain}>
                    <div className={styles.avatar}>
                        <span>{patient.full_name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className={styles.patientDetails}>
                        <h2>{patient.full_name}</h2>
                        <div className={styles.patientMeta}>
                            <span>
                                {patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : 'Khác'}
                            </span>
                            <span>{calculateAge(patient.birthday)}</span>
                            <span>{patient.phone}</span>
                            {patient.email && <span>{patient.email}</span>}
                        </div>
                        {patient.address && (
                            <div className={styles.patientAddress}>{patient.address}</div>
                        )}
                    </div>
                </div>
                <div className={styles.patientStats}>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>{histories.length}</span>
                        <span className={styles.statLabel}>Lần khám</span>
                    </div>
                </div>
            </div>

            {/* Mobile View Toggle */}
            <div className={styles.mobileToggle}>
                <button
                    className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
                    onClick={() => setViewMode('list')}
                >
                    Danh sách
                </button>
                <button
                    className={`${styles.toggleBtn} ${viewMode === 'detail' ? styles.active : ''}`}
                    onClick={() => setViewMode('detail')}
                >
                    Chi tiết
                </button>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                {/* History List */}
                <div className={`${styles.historyList} ${viewMode === 'detail' ? styles.hideOnMobile : ''}`}>
                    <div className={styles.listHeader}>
                        <h3>Lịch sử khám bệnh</h3>
                    </div>

                    {histories.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📭</div>
                            <p>Chưa có lịch sử khám bệnh</p>
                        </div>
                    ) : (
                        <div className={styles.historyItems}>
                            {histories.map((history, index) => (
                                <div
                                    key={history.id}
                                    className={`${styles.historyItem} ${selectedHistory?.id === history.id ? styles.selected : ''}`}
                                    onClick={() => selectHistory(history)}
                                >
                                    <div className={styles.historyIndex}>#{histories.length - index}</div>
                                    <div className={styles.historyInfo}>
                                        <div className={styles.historyDate}>
                                            {formatDateShort(history.visit_date)}
                                            <span className={styles.historyTime}>
                                                {formatTime(history.visit_time)}
                                            </span>
                                        </div>
                                        <div className={styles.historyDoctor}>
                                            BS. {history.doctor?.full_name || 'N/A'}
                                        </div>
                                        <div className={styles.historyDiagnosis}>
                                            {history.diagnosis?.substring(0, 50) || 'Chưa có chẩn đoán'}
                                            {history.diagnosis?.length > 50 && '...'}
                                        </div>
                                        {history.prescription && (
                                            <div className={styles.hasPrescription}>
                                                Có đơn thuốc
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* History Detail */}
                <div className={`${styles.historyDetail} ${viewMode === 'list' ? styles.hideOnMobile : ''}`}>
                    {selectedHistory ? (
                        <>
                            <div className={styles.detailHeader}>
                                <h3>Chi tiết lần khám</h3>
                                <span className={styles.visitNumber}>
                                    Lần #{histories.length - histories.findIndex(h => h.id === selectedHistory.id)}
                                </span>
                            </div>

                            <div className={styles.detailContent}>
                                {/* Visit Info */}
                                <div className={styles.visitInfo}>
                                    <div className={styles.visitDate}>
                                        {formatDate(selectedHistory.visit_date)}
                                        {selectedHistory.visit_time && (
                                            <span className={styles.visitTime}>
                                                lúc {formatTime(selectedHistory.visit_time)}
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.visitDoctor}>
                                        Bác sĩ: <strong>{selectedHistory.doctor?.full_name}</strong>
                                        {selectedHistory.doctor?.specialty && (
                                            <span className={styles.specialty}>
                                                ({selectedHistory.doctor.specialty.name})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Medical Info Sections */}
                                <div className={styles.medicalSections}>
                                    {/* Symptoms */}
                                    <div className={styles.section}>
                                        <div className={styles.sectionHeader}>
                                            <h4>Triệu chứng</h4>
                                        </div>
                                        <div className={styles.sectionContent}>
                                            {selectedHistory.symptoms || 'Không có thông tin'}
                                        </div>
                                    </div>

                                    {/* Diagnosis */}
                                    <div className={styles.section}>
                                        <div className={styles.sectionHeader}>
                                            <h4>Chẩn đoán</h4>
                                        </div>
                                        <div className={`${styles.sectionContent} ${styles.diagnosis}`}>
                                            {selectedHistory.diagnosis || 'Chưa có chẩn đoán'}
                                        </div>
                                    </div>

                                    {/* Conclusion */}
                                    {selectedHistory.conclusion && (
                                        <div className={styles.section}>
                                            <div className={styles.sectionHeader}>
                                                <h4>Kết luận</h4>
                                            </div>
                                            <div className={styles.sectionContent}>
                                                {selectedHistory.conclusion}
                                            </div>
                                        </div>
                                    )}

                                    {/* Treatment Plan */}
                                    {selectedHistory.treatment_plan && (
                                        <div className={styles.section}>
                                            <div className={styles.sectionHeader}>
                                                <h4>Phương pháp điều trị</h4>
                                            </div>
                                            <div className={styles.sectionContent}>
                                                {selectedHistory.treatment_plan}
                                            </div>
                                        </div>
                                    )}

                                    {/* Note */}
                                    {selectedHistory.note && (
                                        <div className={styles.section}>
                                            <div className={styles.sectionHeader}>
                                                <h4>Ghi chú</h4>
                                            </div>
                                            <div className={styles.sectionContent}>
                                                {selectedHistory.note}
                                            </div>
                                        </div>
                                    )}

                                    {/* Prescription */}
                                    <div className={styles.section}>
                                        <div className={styles.sectionHeader}>
                                            <h4>Đơn thuốc</h4>
                                            {selectedHistory.prescription && (
                                                <span className={styles.prescriptionCode}>
                                                    #{selectedHistory.prescription.prescription_code}
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.sectionContent}>
                                            {selectedHistory.prescription && selectedHistory.prescription.details?.length > 0 ? (
                                                <div className={styles.prescriptionBox}>
                                                    <table className={styles.prescriptionTable}>
                                                        <thead>
                                                            <tr>
                                                                <th>STT</th>
                                                                <th>Tên thuốc</th>
                                                                <th>Liều dùng</th>
                                                                <th>Số lượng</th>
                                                                <th>Ghi chú</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedHistory.prescription.details.map((detail, idx) => (
                                                                <tr key={idx}>
                                                                    <td className={styles.stt}>{idx + 1}</td>
                                                                    <td className={styles.drugName}>
                                                                        <strong>{detail.drug?.name || 'N/A'}</strong>
                                                                        {detail.drug?.ingredient && (
                                                                            <small className={styles.ingredient}>
                                                                                {detail.drug.ingredient}
                                                                            </small>
                                                                        )}
                                                                    </td>
                                                                    <td className={styles.dosage}>
                                                                        {detail.dosage || '-'}
                                                                        {detail.duration && (
                                                                            <small className={styles.duration}>
                                                                                ({detail.duration})
                                                                            </small>
                                                                        )}
                                                                    </td>
                                                                    <td className={styles.quantity}>
                                                                        <strong>{detail.quantity}</strong> {detail.unit || detail.drug?.unit || 'viên'}
                                                                    </td>
                                                                    <td className={styles.drugNote}>
                                                                        {detail.note || '-'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>

                                                    {selectedHistory.prescription.note && (
                                                        <div className={styles.prescriptionNote}>
                                                            <strong>Lời dặn:</strong> {selectedHistory.prescription.note}
                                                        </div>
                                                    )}

                                                    {selectedHistory.prescription.re_exam_date && (
                                                        <div className={styles.reExamDate}>
                                                            <strong>Ngày tái khám:</strong>{' '}
                                                            {formatDateShort(selectedHistory.prescription.re_exam_date)}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className={styles.noPrescription}>
                                                    Không có đơn thuốc cho lần khám này
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className={styles.detailActions}>
                                    <button className={styles.printBtn} onClick={handlePrint}>
                                        In bệnh án & Toa thuốc
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.noSelection}>
                            <div className={styles.noSelectionIcon}>👈</div>
                            <p>Chọn một lần khám để xem chi tiết</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden Print Component */}
            <div style={{ display: 'none' }}>
                <PrintMedicalRecord
                    ref={printRef}
                    patient={patient}
                    history={selectedHistory}
                />
            </div>
        </div>
    );
}
