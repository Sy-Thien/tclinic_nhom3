import React, { Component } from 'react';
import styles from './PrintMedicalRecord.module.css';

class PrintMedicalRecordInner extends Component {
    formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('vi-VN');
    };

    formatDateFull = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return `ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
    };

    calculateAge = (birthday) => {
        if (!birthday) return '';
        const birth = new Date(birthday);
        return new Date().getFullYear() - birth.getFullYear();
    };

    getGenderText = (gender) => {
        if (gender === 'male') return 'Nam';
        if (gender === 'female') return 'Nữ';
        return '';
    };

    render() {
        const { forwardedRef, patient, history, clinic } = this.props;

        const clinicInfo = clinic || {
            name: 'PHÒNG KHÁM ĐA KHOA TCLINIC',
            address: '123 Đường ABC, Phường XYZ, TP. Hồ Chí Minh',
            phone: '028 1234 5678',
            hotline: '1900 1234'
        };

        const prescription = history?.prescription;
        const doctor = history?.doctor;

        return (
            <div ref={forwardedRef} className={styles.printContainer}>
                {/* Header - Thông tin phòng khám */}
                <div className={styles.header}>
                    <div className={styles.logoSection}>
                        <img src="/logo.png" alt="TClinic Logo" className={styles.logo} />
                    </div>
                    <div className={styles.headerCenter}>
                        <div className={styles.clinicName}>{clinicInfo.name}</div>
                        <div className={styles.clinicInfo}>
                            <div>Địa chỉ: {clinicInfo.address}</div>
                            <div>ĐT: {clinicInfo.phone} - Hotline: {clinicInfo.hotline}</div>
                        </div>
                    </div>
                    <div className={styles.headerRight}>
                        <div className={styles.formCode}>Mã BN: {patient?.id || 'N/A'}</div>
                        <div className={styles.visitCode}>Số: {history?.id || 'N/A'}</div>
                    </div>
                </div>

                {/* Title */}
                <div className={styles.title}>
                    <h1>PHIẾU KHÁM BỆNH & ĐƠN THUỐC</h1>
                </div>

                {/* Patient Info */}
                <div className={styles.patientSection}>
                    <div className={styles.patientRow}>
                        <div className={styles.patientField}>
                            <span className={styles.label}>Họ và tên:</span>
                            <span className={styles.value}>{patient?.full_name || 'N/A'}</span>
                        </div>
                        <div className={styles.patientField}>
                            <span className={styles.label}>Tuổi:</span>
                            <span className={styles.value}>{this.calculateAge(patient?.birthday)}</span>
                        </div>
                        <div className={styles.patientField}>
                            <span className={styles.label}>Giới tính:</span>
                            <span className={styles.value}>{this.getGenderText(patient?.gender)}</span>
                        </div>
                    </div>
                    <div className={styles.patientRow}>
                        <div className={styles.patientField}>
                            <span className={styles.label}>Địa chỉ:</span>
                            <span className={styles.value}>{patient?.address || '.......................................'}</span>
                        </div>
                    </div>
                    <div className={styles.patientRow}>
                        <div className={styles.patientField}>
                            <span className={styles.label}>Số điện thoại:</span>
                            <span className={styles.value}>{patient?.phone || 'N/A'}</span>
                        </div>
                        <div className={styles.patientField}>
                            <span className={styles.label}>Ngày khám:</span>
                            <span className={styles.value}>{this.formatDate(history?.visit_date)}</span>
                        </div>
                    </div>
                </div>

                {/* Diagnosis Section */}
                <div className={styles.diagnosisSection}>
                    <div className={styles.sectionTitle}>I. KHÁM BỆNH</div>
                    <div className={styles.fieldGroup}>
                        <div className={styles.fieldLabel}>1. Triệu chứng:</div>
                        <div className={styles.fieldContent}>{history?.symptoms || '...'}</div>
                    </div>
                    <div className={styles.fieldGroup}>
                        <div className={styles.fieldLabel}>2. Chẩn đoán:</div>
                        <div className={styles.fieldContent + ' ' + styles.bold}>{history?.diagnosis || '...'}</div>
                    </div>
                    {history?.conclusion && (
                        <div className={styles.fieldGroup}>
                            <div className={styles.fieldLabel}>3. Kết luận:</div>
                            <div className={styles.fieldContent}>{history.conclusion}</div>
                        </div>
                    )}
                </div>

                {/* Prescription Section */}
                <div className={styles.prescriptionSection}>
                    <div className={styles.sectionTitle}>II. ĐƠN THUỐC</div>

                    {prescription && prescription.details?.length > 0 ? (
                        <>
                            <table className={styles.drugTable}>
                                <thead>
                                    <tr>
                                        <th className={styles.thStt}>STT</th>
                                        <th className={styles.thName}>Tên thuốc</th>
                                        <th className={styles.thQuantity}>SL</th>
                                        <th className={styles.thPrice}>Đơn giá</th>
                                        <th className={styles.thTotal}>Thành tiền</th>
                                        <th className={styles.thDosage}>Cách dùng</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prescription.details.map((item, idx) => {
                                        const unitPrice = parseFloat(item.drug?.price) || 0;
                                        const itemTotal = unitPrice * (item.quantity || 0);
                                        return (
                                            <tr key={idx}>
                                                <td className={styles.tdStt}>{idx + 1}</td>
                                                <td className={styles.tdName}>
                                                    <div className={styles.drugName}>{item.drug?.name || 'N/A'}</div>
                                                    {item.drug?.ingredient && (
                                                        <div className={styles.drugIngredient}>({item.drug.ingredient})</div>
                                                    )}
                                                </td>
                                                <td className={styles.tdQuantity}>
                                                    {item.quantity} {item.unit || item.drug?.unit || 'viên'}
                                                </td>
                                                <td className={styles.tdPrice}>
                                                    {unitPrice.toLocaleString('vi-VN')}đ
                                                </td>
                                                <td className={styles.tdTotal}>
                                                    {itemTotal.toLocaleString('vi-VN')}đ
                                                </td>
                                                <td className={styles.tdDosage}>
                                                    {item.dosage || '-'}
                                                    {item.duration && <span> - {item.duration}</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Lời dặn */}
                            {prescription.note && (
                                <div className={styles.noteSection}>
                                    <span className={styles.noteLabel}>Lời dặn:</span>
                                    <span className={styles.noteContent}>{prescription.note}</span>
                                </div>
                            )}

                            {/* Tái khám */}
                            {prescription.re_exam_date && (
                                <div className={styles.reExamSection}>
                                    <span className={styles.reExamLabel}>Tái khám:</span>
                                    <span className={styles.reExamContent}>{this.formatDate(prescription.re_exam_date)}</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.noPrescription}>Không kê đơn thuốc</div>
                    )}
                </div>

                {/* Payment Section - Tổng tiền */}
                <div className={styles.paymentSection}>
                    <div className={styles.sectionTitle}>III. THANH TOÁN</div>
                    <div className={styles.paymentTable}>
                        <div className={styles.paymentRow}>
                            <span className={styles.paymentLabel}>Tiền dịch vụ khám:</span>
                            <span className={styles.paymentValue}>
                                {(parseFloat(history?.service?.price) || parseFloat(history?.booking?.service?.price) || 0).toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                        <div className={styles.paymentRow}>
                            <span className={styles.paymentLabel}>Tiền thuốc:</span>
                            <span className={styles.paymentValue}>
                                {(prescription?.details?.reduce((sum, item) => {
                                    const price = parseFloat(item.drug?.price) || 0;
                                    return sum + (price * (item.quantity || 0));
                                }, 0) || 0).toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                        <div className={`${styles.paymentRow} ${styles.paymentTotal}`}>
                            <span className={styles.paymentLabel}>TỔNG CỘNG:</span>
                            <span className={styles.paymentValue}>
                                {(() => {
                                    const servicePrice = parseFloat(history?.service?.price) || parseFloat(history?.booking?.service?.price) || 0;
                                    const drugTotal = prescription?.details?.reduce((sum, item) => {
                                        const price = parseFloat(item.drug?.price) || 0;
                                        return sum + (price * (item.quantity || 0));
                                    }, 0) || 0;
                                    return (servicePrice + drugTotal).toLocaleString('vi-VN');
                                })()}đ
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer - Signature */}
                <div className={styles.footer}>
                    <div className={styles.footerLeft}>
                        <div className={styles.footerNote}>
                            <em>* Đơn thuốc có giá trị 3 ngày kể từ ngày kê</em>
                        </div>
                    </div>
                    <div className={styles.footerRight}>
                        <div className={styles.signatureDate}>
                            TP.HCM, {this.formatDateFull(history?.visit_date)}
                        </div>
                        <div className={styles.signatureTitle}>BÁC SĨ KHÁM BỆNH</div>
                        <div className={styles.signatureSpace}></div>
                        <div className={styles.doctorName}>{doctor?.full_name || 'N/A'}</div>
                    </div>
                </div>

                {/* Tear line */}
                <div className={styles.tearLine}></div>

                {/* Patient copy (optional mini version) */}
                <div className={styles.patientCopy}>
                    <div className={styles.copyHeader}>
                        <strong>PHIẾU HƯỚNG DẪN SỬ DỤNG THUỐC</strong> - Lưu bệnh nhân
                    </div>
                    <div className={styles.copyContent}>
                        <div><strong>BN:</strong> {patient?.full_name} | <strong>Ngày:</strong> {this.formatDate(history?.visit_date)}</div>
                        <div><strong>Chẩn đoán:</strong> {history?.diagnosis}</div>
                        {prescription?.details?.length > 0 && (
                            <div className={styles.copyDrugs}>
                                {prescription.details.map((item, idx) => (
                                    <div key={idx} className={styles.copyDrugItem}>
                                        <span className={styles.copyDrugNum}>{idx + 1}.</span>
                                        <span className={styles.copyDrugName}>{item.drug?.name}</span>
                                        <span className={styles.copyDrugDosage}>- {item.dosage}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {prescription?.re_exam_date && (
                            <div className={styles.copyReExam}>
                                <strong>Tái khám:</strong> {this.formatDate(prescription.re_exam_date)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

const PrintMedicalRecord = React.forwardRef((props, ref) => (
    <PrintMedicalRecordInner {...props} forwardedRef={ref} />
));

PrintMedicalRecord.displayName = 'PrintMedicalRecord';

export default PrintMedicalRecord;
