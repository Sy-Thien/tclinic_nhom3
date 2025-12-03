import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Appointments.module.css';

export default function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [availableDoctors, setAvailableDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
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
    const [showAssignNewModal, setShowAssignNewModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [availableDoctorsForAssignment, setAvailableDoctorsForAssignment] = useState([]);
    const [noAvailableDoctor, setNoAvailableDoctor] = useState(false);
    const [bookingDayOfWeek, setBookingDayOfWeek] = useState('');
    const [doctorTimeSlots, setDoctorTimeSlots] = useState(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [formData, setFormData] = useState({
        patient_name: '',
        patient_email: '',
        patient_phone: '',
        patient_gender: 'male',
        patient_dob: '',
        patient_address: '',
        specialty_id: '',
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        symptoms: '',
        note: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchDoctors();
        fetchSpecialties();
        fetchAppointments();
    }, [filter]);

    const fetchAppointments = async () => {
        try {
            const params = new URLSearchParams();
            if (filter.status) params.append('status', filter.status);
            if (filter.date) params.append('date', filter.date);
            if (filter.doctor_id) params.append('doctor_id', filter.doctor_id);

            const response = await api.get(`/api/admin/bookings?${params}`);
            setAppointments(response.data.bookings || []);
        } catch (error) {
            console.error('Error:', error);
            if (error.response?.status === 403) {
                alert('Bạn không có quyền truy cập!');
                navigate('/login');
            } else {
                alert('Lỗi khi tải danh sách lịch khám');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const response = await api.get('/api/admin/doctors');
            setDoctors(response.data || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            setSpecialties(response.data || []);
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    // Lấy danh sách bác sĩ khả dụng cho một booking (cùng chuyên khoa)
    const fetchAvailableDoctorsForBooking = async (bookingId) => {
        try {
            setLoadingDoctors(true);
            const response = await api.get(`/api/admin/bookings/${bookingId}/available-doctors`);
            setAvailableDoctors(response.data.doctors || []);
        } catch (error) {
            console.error('Error fetching available doctors:', error);
            alert(error.response?.data?.message || 'Lỗi khi tải danh sách bác sĩ!');
            setAvailableDoctors([]);
        } finally {
            setLoadingDoctors(false);
        }
    };

    const handleCreateAppointment = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/admin/bookings', formData);
            alert('Thêm lịch khám thành công!');
            setShowCreateModal(false);
            setFormData({
                patient_name: '',
                patient_email: '',
                patient_phone: '',
                patient_gender: 'male',
                patient_dob: '',
                patient_address: '',
                specialty_id: '',
                doctor_id: '',
                appointment_date: '',
                appointment_time: '',
                symptoms: '',
                note: ''
            });
            fetchAppointments();
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || 'Lỗi khi thêm lịch khám!');
        }
    };

    const handleConfirm = async () => {
        try {
            const updateData = {
                status: 'confirmed'
            };
            if (selectedDoctor) {
                updateData.doctor_id = selectedDoctor;
            }
            await api.put(`/api/admin/bookings/${selectedAppointment.id}`, updateData);
            alert('Xác nhận lịch khám thành công!');
            setShowConfirmModal(false);
            setSelectedDoctor('');
            fetchAppointments();
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || 'Lỗi khi xác nhận!');
        }
    };

    const handleCancel = async () => {
        try {
            await api.put(`/api/admin/bookings/${selectedAppointment.id}/cancel`, {
                cancel_reason: cancelReason
            });
            alert('Hủy lịch khám thành công!');
            setShowCancelModal(false);
            setCancelReason('');
            fetchAppointments();
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || 'Lỗi khi hủy!');
        }
    };

    const handleAssignDoctor = async () => {
        try {
            const response = await api.put(`/api/admin/bookings/${selectedAppointment.id}/assign-doctor`, {
                doctor_id: selectedDoctor
            });
            alert('Gán bác sĩ thành công!');
            setShowAssignModal(false);
            setSelectedDoctor('');
            setAvailableDoctors([]);
            fetchAppointments();
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || 'Lỗi khi gán bác sĩ!');
        }
    };

    // Lấy danh sách bác sĩ còn trống để gán cho booking chưa có bác sĩ
    const fetchAvailableDoctorsForAssignment = async (bookingId) => {
        try {
            setLoadingDoctors(true);
            const response = await api.get(`/api/admin/bookings/${bookingId}/available-doctors-for-assignment`);
            setAvailableDoctorsForAssignment(response.data.availableDoctors || []);
            setNoAvailableDoctor(response.data.noAvailableDoctor || false);
            setBookingDayOfWeek(response.data.booking?.dayOfWeek || '');
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || 'Lỗi khi tải danh sách bác sĩ!');
            setAvailableDoctorsForAssignment([]);
            setNoAvailableDoctor(true);
        } finally {
            setLoadingDoctors(false);
        }
    };

    // ✅ NEW: Lấy time slots của bác sĩ theo ngày
    const fetchDoctorTimeSlots = async (doctorId, date) => {
        try {
            const response = await api.get(`/api/admin/doctor-time-slots/${doctorId}`, {
                params: { date }
            });
            if (response.data.success) {
                setDoctorTimeSlots(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching doctor time slots:', error);
            setDoctorTimeSlots(null);
        }
    };

    // Gán bác sĩ cho booking chưa có bác sĩ
    const handleAssignDoctorNew = async () => {
        if (!selectedDoctor) {
            alert('Vui lòng chọn bác sĩ!');
            return;
        }

        // Nếu booking đã có giờ khám thì dùng giờ đó, không cần chọn time slot
        const timeToUse = selectedAppointment.appointment_time || selectedTimeSlot;

        if (!timeToUse) {
            alert('Vui lòng chọn khung giờ!');
            return;
        }

        try {
            await api.put(`/api/admin/bookings/${selectedAppointment.id}/assign-doctor-new`, {
                doctor_id: selectedDoctor,
                time_slot: timeToUse
            });
            alert('Gán bác sĩ thành công! Đang chờ bác sĩ xác nhận.');
            setShowAssignNewModal(false);
            setSelectedDoctor('');
            setSelectedTimeSlot('');
            setAvailableDoctorsForAssignment([]);
            setDoctorTimeSlots(null);
            fetchAppointments();
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || 'Lỗi khi gán bác sĩ!');
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        if (!window.confirm(`Chuyển trạng thái sang "${newStatus}"?`)) return;

        try {
            await api.put(`/api/admin/bookings/${id}`, { status: newStatus });
            alert('Cập nhật thành công!');
            fetchAppointments();
        } catch (error) {
            console.error('Error:', error);
            alert('Lỗi khi cập nhật!');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'pending': { text: 'Chờ xác nhận', color: '#f59e0b' },
            'waiting_doctor_assignment': { text: 'Chờ gán bác sĩ', color: '#ec4899' },
            'waiting_doctor_confirmation': { text: 'Chờ bác sĩ xác nhận', color: '#f59e0b' },
            'confirmed': { text: 'Đã xác nhận', color: '#3b82f6' },
            'in_progress': { text: 'Đang khám', color: '#8b5cf6' },
            'completed': { text: 'Hoàn thành', color: '#10b981' },
            'cancelled': { text: 'Đã hủy', color: '#ef4444' },
            'doctor_rejected': { text: 'Bác sĩ từ chối', color: '#ef4444' }
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
                    <h1>Quản Lý Lịch Khám</h1>
                    <p>Tổng số: {appointments.length} lịch khám</p>
                </div>
                <button
                    className={styles.btnAdd}
                    onClick={() => setShowCreateModal(true)}
                >
                    Thêm lịch khám
                </button>
            </div>

            {/* FILTERS */}
            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <label>Trạng thái:</label>
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
                    <label>Ngày:</label>
                    <input
                        type="date"
                        value={filter.date}
                        onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <label>Bác sĩ:</label>
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
                    Reset
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
                                            <div className={styles.specialty}>{app.specialty?.name || 'Chưa có'}</div>
                                        </div>
                                    </td>
                                    <td>
                                        {app.doctor ? (
                                            app.doctor.full_name
                                        ) : app.status === 'waiting_doctor_assignment' ? (
                                            <button
                                                className={styles.btnAssignPrimary}
                                                onClick={() => {
                                                    setSelectedAppointment(app);
                                                    setSelectedDoctor('');
                                                    fetchAvailableDoctorsForAssignment(app.id);
                                                    setShowAssignNewModal(true);
                                                }}
                                            >
                                                🔔 Gán bác sĩ ngay
                                            </button>
                                        ) : (
                                            <button
                                                className={styles.btnAssign}
                                                onClick={() => {
                                                    setSelectedAppointment(app);
                                                    setSelectedDoctor('');
                                                    fetchAvailableDoctorsForBooking(app.id);
                                                    setShowAssignModal(true);
                                                }}
                                            >
                                                Gán bác sĩ
                                            </button>
                                        )}
                                    </td>
                                    <td>{new Date(app.appointment_date).toLocaleDateString('vi-VN')}</td>
                                    <td>{app.appointment_time || 'Chưa có'}</td>
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
                                                    Duyệt
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
                        <h2>Xác nhận lịch hẹn</h2>
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
                        <h2>Gán bác sĩ</h2>
                        <div className={styles.modalBody}>
                            <p><strong>Bệnh nhân:</strong> {selectedAppointment?.patient_name}</p>
                            <p><strong>Chuyên khoa:</strong> {selectedAppointment?.specialty?.name}</p>

                            <div className={styles.formGroup}>
                                <label>Chọn bác sĩ (cùng chuyên khoa):</label>
                                {loadingDoctors ? (
                                    <p>Đang tải danh sách bác sĩ...</p>
                                ) : availableDoctors.length > 0 ? (
                                    <select
                                        value={selectedDoctor}
                                        onChange={(e) => setSelectedDoctor(e.target.value)}
                                    >
                                        <option value="">-- Chọn bác sĩ --</option>
                                        {availableDoctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.full_name} {doc.experience ? `(${doc.experience})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p style={{ color: '#ef4444' }}>Không có bác sĩ nào trong chuyên khoa này!</p>
                                )}
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.btnModalCancel} onClick={() => {
                                setShowAssignModal(false);
                                setAvailableDoctors([]);
                            }}>
                                Đóng
                            </button>
                            <button
                                className={styles.btnModalConfirm}
                                onClick={handleAssignDoctor}
                                disabled={!selectedDoctor || loadingDoctors}
                            >
                                Gán bác sĩ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE APPOINTMENT MODAL */}
            {showCreateModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent} style={{ maxWidth: '700px' }}>
                        <h2>Thêm lịch khám mới</h2>
                        <form onSubmit={handleCreateAppointment}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}>
                                        <label>Họ tên bệnh nhân <span className={styles.required}>*</span></label>
                                        <input
                                            type="text"
                                            value={formData.patient_name}
                                            onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Số điện thoại <span className={styles.required}>*</span></label>
                                        <input
                                            type="tel"
                                            value={formData.patient_phone}
                                            onChange={(e) => setFormData({ ...formData, patient_phone: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={formData.patient_email}
                                            onChange={(e) => setFormData({ ...formData, patient_email: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Giới tính</label>
                                        <select
                                            value={formData.patient_gender}
                                            onChange={(e) => setFormData({ ...formData, patient_gender: e.target.value })}
                                        >
                                            <option value="male">Nam</option>
                                            <option value="female">Nữ</option>
                                            <option value="other">Khác</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Ngày sinh</label>
                                        <input
                                            type="date"
                                            value={formData.patient_dob}
                                            onChange={(e) => setFormData({ ...formData, patient_dob: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Chuyên khoa <span className={styles.required}>*</span></label>
                                        <select
                                            value={formData.specialty_id}
                                            onChange={(e) => setFormData({ ...formData, specialty_id: e.target.value })}
                                            required
                                        >
                                            <option value="">-- Chọn chuyên khoa --</option>
                                            {specialties.map(sp => (
                                                <option key={sp.id} value={sp.id}>{sp.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Bác sĩ (tùy chọn)</label>
                                        <select
                                            value={formData.doctor_id}
                                            onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                                        >
                                            <option value="">-- Chọn bác sĩ --</option>
                                            {doctors.map(doc => (
                                                <option key={doc.id} value={doc.id}>{doc.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Ngày khám <span className={styles.required}>*</span></label>
                                        <input
                                            type="date"
                                            value={formData.appointment_date}
                                            onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Giờ khám <span className={styles.required}>*</span></label>
                                        <input
                                            type="time"
                                            value={formData.appointment_time}
                                            onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label>Địa chỉ</label>
                                        <input
                                            type="text"
                                            value={formData.patient_address}
                                            onChange={(e) => setFormData({ ...formData, patient_address: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label>Triệu chứng</label>
                                        <textarea
                                            rows={3}
                                            value={formData.symptoms}
                                            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                                            placeholder="Mô tả triệu chứng..."
                                        />
                                    </div>
                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label>Ghi chú</label>
                                        <textarea
                                            rows={2}
                                            value={formData.note}
                                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                            placeholder="Ghi chú thêm..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    className={styles.btnModalCancel}
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Hủy
                                </button>
                                <button type="submit" className={styles.btnModalConfirm}>
                                    Thêm lịch khám
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ASSIGN DOCTOR NEW MODAL - Cho booking chưa có bác sĩ */}
            {showAssignNewModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent} style={{ maxWidth: '900px' }}>
                        <h2>🔔 Gán bác sĩ cho lịch khám</h2>
                        <div className={styles.modalBody}>
                            {selectedAppointment && (
                                <>
                                    <div className={styles.bookingInfo}>
                                        <p><strong>Mã booking:</strong> {selectedAppointment.booking_code}</p>
                                        <p><strong>Bệnh nhân:</strong> {selectedAppointment.patient_name}</p>
                                        <p><strong>Chuyên khoa:</strong> {selectedAppointment.specialty?.name}</p>
                                        <p><strong>Ngày khám:</strong> {new Date(selectedAppointment.appointment_date).toLocaleDateString('vi-VN')} ({bookingDayOfWeek})</p>
                                        <p><strong>Giờ khám:</strong> {selectedAppointment.appointment_time || 'Chưa chọn'}</p>
                                    </div>

                                    {/* Cảnh báo khi không có bác sĩ rảnh */}
                                    {noAvailableDoctor && (
                                        <div className={styles.warningBox}>
                                            <h4>Không có bác sĩ nào rảnh trong khung giờ này!</h4>
                                            <p>Vui lòng liên hệ khách hàng để:</p>
                                            <ul>
                                                <li>Đổi sang ngày/giờ khác có bác sĩ trống</li>
                                                <li>Gửi email thông báo cho khách hàng</li>
                                                <li>Hoặc hủy lịch hẹn nếu không thể sắp xếp</li>
                                            </ul>
                                            <p style={{ marginTop: '1rem' }}>
                                                <strong>SĐT khách:</strong> {selectedAppointment.patient_phone || 'N/A'}<br />
                                                <strong>Email:</strong> {selectedAppointment.patient_email || 'N/A'}
                                            </p>
                                        </div>
                                    )}

                                    <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
                                        <label>Chọn bác sĩ <span className={styles.required}>*</span></label>
                                        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                                            Bác sĩ màu xanh có thể gán, màu đỏ/vàng đã bận hoặc không làm việc
                                        </p>
                                        {loadingDoctors ? (
                                            <p>Đang tải danh sách bác sĩ...</p>
                                        ) : availableDoctorsForAssignment.length > 0 ? (
                                            <div className={styles.doctorGrid}>
                                                {availableDoctorsForAssignment.map(doc => (
                                                    <div
                                                        key={doc.id}
                                                        className={`${styles.doctorCard} ${doc.disabled ? styles.doctorDisabled : ''} ${selectedDoctor === String(doc.id) ? styles.doctorSelected : ''}`}
                                                        onClick={() => {
                                                            if (!doc.disabled) {
                                                                setSelectedDoctor(String(doc.id));
                                                                setSelectedTimeSlot('');
                                                                if (selectedAppointment.appointment_date) {
                                                                    fetchDoctorTimeSlots(doc.id, selectedAppointment.appointment_date);
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <div className={styles.doctorCardHeader}>
                                                            <span className={styles.doctorAvatar}>BS</span>
                                                            <div>
                                                                <strong>{doc.full_name}</strong>
                                                                <span className={`${styles.statusBadge} ${styles[doc.status]}`}>
                                                                    {doc.statusText}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className={styles.doctorCardBody}>
                                                            <p>SĐT: {doc.phone || 'N/A'}</p>
                                                            <p>Ngày làm: {doc.workingDays}</p>
                                                            {doc.scheduleForDay && (
                                                                <p>{bookingDayOfWeek}: {doc.scheduleForDay.start_time?.substring(0, 5)} - {doc.scheduleForDay.end_time?.substring(0, 5)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ color: '#ef4444' }}>Không có bác sĩ nào trong chuyên khoa này</p>
                                        )}
                                    </div>

                                    {/* Time Slots Grid - CHỈ hiển thị nếu booking CHƯA CÓ giờ khám */}
                                    {!selectedAppointment.appointment_time && selectedDoctor && doctorTimeSlots && (
                                        <div className={styles.timeSlotsSection}>
                                            <label>Chọn khung giờ <span className={styles.required}>*</span></label>
                                            {!doctorTimeSlots.isWorking ? (
                                                <p style={{ color: '#ef4444' }}>Bác sĩ không làm việc vào ngày này</p>
                                            ) : (
                                                <div className={styles.timeSlotsGrid}>
                                                    {doctorTimeSlots.slots.map((slot, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            className={`${styles.timeSlotBtn} ${slot.isBreakTime
                                                                ? styles.breakTime
                                                                : slot.bookingCount > 0
                                                                    ? styles.bookedSlot
                                                                    : selectedTimeSlot === slot.time
                                                                        ? styles.selectedSlot
                                                                        : styles.availableSlot
                                                                }`}
                                                            onClick={() => {
                                                                if (!slot.isBreakTime && slot.bookingCount === 0) {
                                                                    setSelectedTimeSlot(slot.time);
                                                                }
                                                            }}
                                                            disabled={slot.isBreakTime || slot.bookingCount > 0}
                                                        >
                                                            <div className={styles.slotTime}>{slot.time}</div>
                                                            {slot.isBreakTime ? (
                                                                <div className={styles.slotStatus}>Nghỉ</div>
                                                            ) : slot.bookingCount > 0 ? (
                                                                <div className={styles.slotStatus}>Đã đặt</div>
                                                            ) : (
                                                                <div className={styles.slotStatus}>✓ Trống</div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                className={styles.btnModalCancel}
                                onClick={() => {
                                    setShowAssignNewModal(false);
                                    setSelectedDoctor('');
                                    setSelectedTimeSlot('');
                                    setAvailableDoctorsForAssignment([]);
                                    setDoctorTimeSlots(null);
                                    setNoAvailableDoctor(false);
                                    setBookingDayOfWeek('');
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                className={styles.btnModalConfirm}
                                onClick={handleAssignDoctorNew}
                                disabled={!selectedDoctor || loadingDoctors}
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