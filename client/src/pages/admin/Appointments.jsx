import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Appointments.module.css';

export default function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        status: '',
        date: '',
        doctor_id: ''
    });
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchDoctors();
        fetchAppointments();
    }, [filter]);

    const fetchAppointments = async () => {
        try {
            const params = new URLSearchParams();
            if (filter.status) params.append('status', filter.status);
            if (filter.date) params.append('date', filter.date);
            if (filter.doctor_id) params.append('doctor_id', filter.doctor_id);

            const response = await api.get(`/api/admin/appointments?${params}`);
            setAppointments(response.data.data || []);
        } catch (error) {
            console.error('Error:', error);
            if (error.response?.status === 403) {
                alert('Bạn không có quyền truy cập!');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const response = await api.get('/api/public/doctors');
            setDoctors(response.data || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const handleConfirm = async () => {
        try {
            await api.put(`/api/admin/appointments/${selectedAppointment.id}/confirm`, {
                doctor_id: selectedDoctor || null
            });
            alert('✅ Xác nhận lịch hẹn thành công!');
            setShowConfirmModal(false);
            setSelectedDoctor('');
            fetchAppointments();
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || '❌ Lỗi khi xác nhận!');
        }
    };

    const handleCancel = async () => {
        try {
            await api.put(`/api/admin/appointments/${selectedAppointment.id}/cancel`, {
                reason: cancelReason
            });
            alert('✅ Hủy lịch hẹn thành công!');
            setShowCancelModal(false);
            setCancelReason('');
            fetchAppointments();
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || '❌ Lỗi khi hủy!');
        }
    };

    const handleAssignDoctor = async () => {
        try {
            await api.put(`/api/admin/appointments/${selectedAppointment.id}/assign-doctor`, {
                doctor_id: selectedDoctor
            });
            alert('✅ Gán bác sĩ thành công!');
            setShowAssignModal(false);
            setSelectedDoctor('');
            fetchAppointments();
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || '❌ Lỗi khi gán bác sĩ!');
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        if (!window.confirm(`Chuyển trạng thái sang "${newStatus}"?`)) return;

        try {
            await api.put(`/api/admin/appointments/${id}/status`, { status: newStatus });
            alert('✅ Cập nhật thành công!');
            fetchAppointments();
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Lỗi khi cập nhật!');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'pending': { text: 'Chờ xác nhận', color: '#f59e0b' },
            'confirmed': { text: 'Đã xác nhận', color: '#3b82f6' },
            'in_progress': { text: 'Đang khám', color: '#8b5cf6' },
            'completed': { text: 'Hoàn thành', color: '#10b981' },
            'cancelled': { text: 'Đã hủy', color: '#ef4444' }
        };
        const badge = badges[status] || badges['pending'];
        return <span className={styles.badge} style={{ background: badge.color }}>{badge.text}</span>;
    };

    const getStatusOptions = (currentStatus) => {
        const allStatuses = [
            { value: 'pending', label: 'Chờ xác nhận' },
            { value: 'confirmed', label: 'Đã xác nhận' },
            { value: 'in_progress', label: 'Đang khám' },
            { value: 'completed', label: 'Hoàn thành' },
            { value: 'cancelled', label: 'Đã hủy' }
        ];
        return allStatuses.filter(s => s.value !== currentStatus);
    };

    if (loading) {
        return <div className={styles.loading}>Đang tải...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>📅 Quản Lý Lịch Hẹn</h1>
                    <p>Tổng số: {appointments.length} lịch hẹn</p>
                </div>
            </div>

            {/* FILTERS */}
            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <label>🔍 Trạng thái:</label>
                    <select
                        value={filter.status}
                        onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    >
                        <option value="">Tất cả</option>
                        <option value="pending">Chờ xác nhận</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="in_progress">Đang khám</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>📅 Ngày:</label>
                    <input
                        type="date"
                        value={filter.date}
                        onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <label>👨‍⚕️ Bác sĩ:</label>
                    <select
                        value={filter.doctor_id}
                        onChange={(e) => setFilter({ ...filter, doctor_id: e.target.value })}
                    >
                        <option value="">Tất cả</option>
                        {doctors.map(doc => (
                            <option key={doc.id} value={doc.id}>{doc.full_name}</option>
                        ))}
                    </select>
                </div>

                <button
                    className={styles.btnReset}
                    onClick={() => setFilter({ status: '', date: '', doctor_id: '' })}
                >
                    🔄 Reset
                </button>
            </div>

            {/* TABLE */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Mã</th>
                            <th>Bệnh nhân</th>
                            <th>SĐT</th>
                            <th>Dịch vụ</th>
                            <th>Bác sĩ</th>
                            <th>Ngày khám</th>
                            <th>Giờ</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.length === 0 ? (
                            <tr>
                                <td colSpan="9" className={styles.empty}>
                                    Không có lịch hẹn nào
                                </td>
                            </tr>
                        ) : (
                            appointments.map(app => (
                                <tr key={app.id}>
                                    <td className={styles.code}>{app.booking_code}</td>
                                    <td>
                                        <div className={styles.patientInfo}>
                                            <div className={styles.patientName}>{app.patient_name}</div>
                                            {app.patient_email && (
                                                <div className={styles.patientEmail}>{app.patient_email}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td>{app.patient_phone}</td>
                                    <td>
                                        <div className={styles.serviceInfo}>
                                            <div>{app.service_name}</div>
                                            <div className={styles.specialty}>{app.specialty_name}</div>
                                        </div>
                                    </td>
                                    <td>
                                        {app.doctor_name ? (
                                            app.doctor_name
                                        ) : (
                                            <button
                                                className={styles.btnAssign}
                                                onClick={() => {
                                                    setSelectedAppointment(app);
                                                    setShowAssignModal(true);
                                                }}
                                            >
                                                ➕ Gán bác sĩ
                                            </button>
                                        )}
                                    </td>
                                    <td>{new Date(app.date).toLocaleDateString('vi-VN')}</td>
                                    <td>{app.appointment_time}</td>
                                    <td>{getStatusBadge(app.status)}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            {app.status === 'pending' && (
                                                <button
                                                    className={styles.btnConfirm}
                                                    onClick={() => {
                                                        setSelectedAppointment(app);
                                                        setShowConfirmModal(true);
                                                    }}
                                                >
                                                    ✅ Duyệt
                                                </button>
                                            )}

                                            {app.status !== 'cancelled' && app.status !== 'completed' && (
                                                <button
                                                    className={styles.btnCancel}
                                                    onClick={() => {
                                                        setSelectedAppointment(app);
                                                        setShowCancelModal(true);
                                                    }}
                                                >
                                                    🚫 Hủy
                                                </button>
                                            )}

                                            <select
                                                className={styles.statusSelect}
                                                value={app.status}
                                                onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                            >
                                                <option value={app.status}>Đổi trạng thái</option>
                                                {getStatusOptions(app.status).map(opt => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* CONFIRM MODAL */}
            {showConfirmModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>✅ Xác nhận lịch hẹn</h2>
                        <div className={styles.modalBody}>
                            <p><strong>Bệnh nhân:</strong> {selectedAppointment.patient_name}</p>
                            <p><strong>Dịch vụ:</strong> {selectedAppointment.service_name}</p>
                            <p><strong>Ngày:</strong> {new Date(selectedAppointment.date).toLocaleDateString('vi-VN')}</p>

                            <div className={styles.formGroup}>
                                <label>Gán bác sĩ (tùy chọn):</label>
                                <select
                                    value={selectedDoctor}
                                    onChange={(e) => setSelectedDoctor(e.target.value)}
                                >
                                    <option value="">-- Chọn bác sĩ --</option>
                                    {doctors.map(doc => (
                                        <option key={doc.id} value={doc.id}>{doc.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.btnModalCancel} onClick={() => setShowConfirmModal(false)}>
                                Đóng
                            </button>
                            <button className={styles.btnModalConfirm} onClick={handleConfirm}>
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CANCEL MODAL */}
            {showCancelModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>🚫 Hủy lịch hẹn</h2>
                        <div className={styles.modalBody}>
                            <p><strong>Bệnh nhân:</strong> {selectedAppointment.patient_name}</p>
                            <p><strong>Mã lịch:</strong> {selectedAppointment.booking_code}</p>

                            <div className={styles.formGroup}>
                                <label>Lý do hủy:</label>
                                <textarea
                                    rows={4}
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Nhập lý do hủy lịch..."
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.btnModalCancel} onClick={() => setShowCancelModal(false)}>
                                Đóng
                            </button>
                            <button className={styles.btnModalConfirm} onClick={handleCancel}>
                                Xác nhận hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ASSIGN DOCTOR MODAL */}
            {showAssignModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>👨‍⚕️ Gán bác sĩ</h2>
                        <div className={styles.modalBody}>
                            <p><strong>Bệnh nhân:</strong> {selectedAppointment.patient_name}</p>

                            <div className={styles.formGroup}>
                                <label>Chọn bác sĩ:</label>
                                <select
                                    value={selectedDoctor}
                                    onChange={(e) => setSelectedDoctor(e.target.value)}
                                >
                                    <option value="">-- Chọn bác sĩ --</option>
                                    {doctors.map(doc => (
                                        <option key={doc.id} value={doc.id}>
                                            {doc.full_name} - {doc.specialty_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.btnModalCancel} onClick={() => setShowAssignModal(false)}>
                                Đóng
                            </button>
                            <button
                                className={styles.btnModalConfirm}
                                onClick={handleAssignDoctor}
                                disabled={!selectedDoctor}
                            >
                                Gán bác sĩ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}