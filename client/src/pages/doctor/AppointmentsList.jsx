import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './AppointmentsList.module.css';

export default function AppointmentsList() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState('list'); // list, week, day
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchAppointments();
    }, [selectedDate, viewMode, filterStatus, searchTerm]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            let url = '/api/doctor/appointments?';

            if (viewMode === 'week') {
                // Fetch all appointments without date filter to get week data
                url += filterStatus !== 'all' ? `status=${filterStatus}` : '';
            } else if (viewMode === 'day') {
                // Day view - filter by specific date
                url += `date=${selectedDate}`;
                if (filterStatus !== 'all') {
                    url += `&status=${filterStatus}`;
                }
            } else {
                // List view - fetch all
                url += filterStatus !== 'all' ? `status=${filterStatus}` : '';
            }

            const response = await api.get(url);
            let fetchedAppointments = response.data.appointments || [];

            // If week view, filter to current week
            if (viewMode === 'week') {
                const weekRange = getWeekRange(selectedDate);
                fetchedAppointments = fetchedAppointments.filter(apt => {
                    const aptDate = apt.appointment_date;
                    return aptDate >= weekRange.start && aptDate <= weekRange.end;
                });
            }

            // Apply search filter
            if (searchTerm) {
                fetchedAppointments = fetchedAppointments.filter(apt =>
                    apt.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    apt.patient_phone?.includes(searchTerm) ||
                    apt.booking_code?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            setAppointments(fetchedAppointments);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (id) => {
        if (!window.confirm('Xác nhận tiếp nhận bệnh nhân này?')) return;

        try {
            await api.put(`/api/doctor/appointments/${id}/confirm`);
            alert('Đã xác nhận lịch hẹn!');
            fetchAppointments();
        } catch (error) {
            console.error('Error confirming appointment:', error);
            alert('Có lỗi xảy ra!');
        }
    };

    const handleReject = async (id) => {
        const reason = prompt('Nhập lý do từ chối:');
        if (!reason) return;

        try {
            await api.put(`/api/doctor/appointments/${id}/reject`, { reject_reason: reason });
            alert('Đã từ chối lịch hẹn!');
            fetchAppointments();
        } catch (error) {
            console.error('Error rejecting appointment:', error);
            alert('Có lỗi xảy ra!');
        }
    };

    const handleStartExam = (appointment) => {
        // Dùng bookingId trong URL để dễ quản lý và share link
        navigate(`/doctor-portal/examination?bookingId=${appointment.id}`);
    };

    const handleViewDetail = (appointment) => {
        setSelectedAppointment(appointment);
        setShowDetailModal(true);
    };

    const formatTime = (time) => time ? time.substring(0, 5) : '';
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('vi-VN');
    };

    const getWeekRange = (dateStr) => {
        const date = new Date(dateStr);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday

        const monday = new Date(date.setDate(diff));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        return {
            start: monday.toISOString().split('T')[0],
            end: sunday.toISOString().split('T')[0]
        };
    };

    const getWeekDays = () => {
        const weekRange = getWeekRange(selectedDate);
        const start = new Date(weekRange.start);
        const days = [];

        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            days.push({
                date: day.toISOString().split('T')[0],
                dayName: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][day.getDay()],
                dayNum: day.getDate()
            });
        }

        return days;
    };

    const getAppointmentsForDate = (dateStr) => {
        return appointments.filter(apt => apt.appointment_date === dateStr);
    };

    const changeWeek = (direction) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + (direction * 7));
        setSelectedDate(newDate.toISOString().split('T')[0]);
    };

    const getStatusBadge = (status) => {
        const badges = {
            'waiting_doctor_assignment': { text: 'Chờ gán BS', class: styles.statusPending },
            'waiting_doctor_confirmation': { text: 'Chờ xác nhận', class: styles.statusWaiting },
            'confirmed': { text: 'Đã xác nhận', class: styles.statusConfirmed },
            'completed': { text: 'Hoàn thành', class: styles.statusCompleted },
            'cancelled': { text: 'Đã hủy', class: styles.statusCancelled },
            'doctor_rejected': { text: 'Đã từ chối', class: styles.statusRejected }
        };
        const badge = badges[status] || { text: status, class: '' };
        return <span className={`${styles.statusBadge} ${badge.class}`}>{badge.text}</span>;
    };

    const getStats = () => {
        return {
            total: appointments.length,
            waiting: appointments.filter(a => a.status === 'waiting_doctor_confirmation').length,
            confirmed: appointments.filter(a => a.status === 'confirmed').length,
            completed: appointments.filter(a => a.status === 'completed').length
        };
    };

    const stats = getStats();

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1>📅 Quản Lý Lịch Hẹn</h1>
                    <p className={styles.subtitle}>Quản lý và theo dõi lịch khám bệnh</p>
                </div>
                <div className={styles.headerActions}>
                    <div className={styles.viewToggle}>
                        <button
                            className={viewMode === 'list' ? styles.active : ''}
                            onClick={() => setViewMode('list')}
                            title="Xem dạng danh sách"
                        >
                            📋 Danh sách
                        </button>
                        <button
                            className={viewMode === 'day' ? styles.active : ''}
                            onClick={() => setViewMode('day')}
                            title="Xem theo ngày"
                        >
                            📆 Ngày
                        </button>
                        <button
                            className={viewMode === 'week' ? styles.active : ''}
                            onClick={() => setViewMode('week')}
                            title="Xem theo tuần"
                        >
                            📊 Tuần
                        </button>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className={styles.controlsBar}>
                <div className={styles.searchBox}>
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Tìm theo tên bệnh nhân, số điện thoại, mã booking..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className={styles.clearBtn}>
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                </div>

                {(viewMode === 'day' || viewMode === 'week') && (
                    <div className={styles.dateControls}>
                        {viewMode === 'week' && (
                            <div className={styles.weekNav}>
                                <button onClick={() => changeWeek(-1)} title="Tuần trước">◀</button>
                                <span>{getWeekRange(selectedDate).start} - {getWeekRange(selectedDate).end}</span>
                                <button onClick={() => changeWeek(1)} title="Tuần sau">▶</button>
                            </div>
                        )}
                        {viewMode === 'day' && (
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className={styles.dateInput}
                            />
                        )}
                        <button
                            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                            className={styles.todayBtn}
                        >
                            Hôm nay
                        </button>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.total}</div>
                    <div className={styles.statLabel}>Tổng số</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.waiting}</div>
                    <div className={styles.statLabel}>Chờ xác nhận</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.confirmed}</div>
                    <div className={styles.statLabel}>Đã xác nhận</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.completed}</div>
                    <div className={styles.statLabel}>Hoàn thành</div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <button
                    className={filterStatus === 'all' ? styles.active : ''}
                    onClick={() => setFilterStatus('all')}
                >
                    Tất cả
                </button>
                <button
                    className={filterStatus === 'waiting_doctor_confirmation' ? styles.active : ''}
                    onClick={() => setFilterStatus('waiting_doctor_confirmation')}
                >
                    Chờ xác nhận
                </button>
                <button
                    className={filterStatus === 'confirmed' ? styles.active : ''}
                    onClick={() => setFilterStatus('confirmed')}
                >
                    Đã xác nhận
                </button>
                <button
                    className={filterStatus === 'completed' ? styles.active : ''}
                    onClick={() => setFilterStatus('completed')}
                >
                    Hoàn thành
                </button>
            </div>

            {/* Appointments List */}
            {loading ? (
                <div className={styles.loading}>⏳ Đang tải...</div>
            ) : appointments.length === 0 ? (
                <div className={styles.emptyState}>
                    <i className="fas fa-calendar-times"></i>
                    <p>Không có lịch hẹn nào</p>
                    {searchTerm && <small>Không tìm thấy kết quả cho "{searchTerm}"</small>}
                </div>
            ) : viewMode === 'list' ? (
                // List View - Table Layout
                <div className={styles.tableContainer}>
                    <table className={styles.appointmentsTable}>
                        <thead>
                            <tr>
                                <th>Mã</th>
                                <th>Ngày & Giờ</th>
                                <th>Bệnh nhân</th>
                                <th>Liên hệ</th>
                                <th>Triệu chứng</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map(apt => (
                                <tr key={apt.id} className={styles.tableRow}>
                                    <td data-label="Mã" className={styles.bookingCode}>{apt.booking_code}</td>
                                    <td data-label="Ngày & Giờ" className={styles.dateTimeCell}>
                                        <div className={styles.date}>{formatDate(apt.appointment_date)}</div>
                                        <div className={styles.time}>{formatTime(apt.appointment_time)}</div>
                                    </td>
                                    <td data-label="Bệnh nhân" className={styles.patientCell}>
                                        <div className={styles.patientName}>{apt.patient_name}</div>
                                        {apt.patient_gender && (
                                            <div className={styles.patientGender}>
                                                {apt.patient_gender === 'male' ? '👨 Nam' : '👩 Nữ'}
                                            </div>
                                        )}
                                    </td>
                                    <td data-label="Liên hệ" className={styles.contactCell}>
                                        <div className={styles.phone}>📞 {apt.patient_phone}</div>
                                        {apt.patient_email && (
                                            <div className={styles.email}>✉️ {apt.patient_email}</div>
                                        )}
                                    </td>
                                    <td data-label="Triệu chứng" className={styles.symptomsCell}>
                                        <div className={styles.symptomsText}>{apt.symptoms || 'Chưa có'}</div>
                                    </td>
                                    <td data-label="Trạng thái">{getStatusBadge(apt.status)}</td>
                                    <td data-label="Thao tác" className={styles.actionsCell}>
                                        <div className={styles.actionButtons}>
                                            <button
                                                className={styles.btnViewSmall}
                                                onClick={() => handleViewDetail(apt)}
                                                title="Xem chi tiết"
                                            >
                                                Xem
                                            </button>
                                            {apt.status === 'waiting_doctor_confirmation' && (
                                                <>
                                                    <button
                                                        onClick={() => handleConfirm(apt.id)}
                                                        className={styles.btnConfirmSmall}
                                                        title="Xác nhận"
                                                    >
                                                        Duyệt
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(apt.id)}
                                                        className={styles.btnRejectSmall}
                                                        title="Từ chối"
                                                    >
                                                        Từ chối
                                                    </button>
                                                </>
                                            )}
                                            {apt.status === 'confirmed' && (
                                                <button
                                                    onClick={() => handleStartExam(apt)}
                                                    className={styles.btnExamSmall}
                                                    title="Bắt đầu khám"
                                                >
                                                    Khám
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : viewMode === 'week' ? (
                // Week View - Grid Layout
                <div className={styles.weekView}>
                    {getWeekDays().map(day => {
                        const dayAppointments = getAppointmentsForDate(day.date);
                        const isToday = day.date === new Date().toISOString().split('T')[0];

                        return (
                            <div key={day.date} className={`${styles.dayColumn} ${isToday ? styles.today : ''}`}>
                                <div className={styles.dayHeader}>
                                    <div className={styles.dayName}>{day.dayName}</div>
                                    <div className={styles.dayDate}>{day.dayNum}</div>
                                    <div className={styles.dayCount}>({dayAppointments.length})</div>
                                </div>
                                <div className={styles.dayAppointments}>
                                    {dayAppointments.length === 0 ? (
                                        <div className={styles.noAppointments}>Không có lịch</div>
                                    ) : (
                                        dayAppointments.map(apt => (
                                            <div key={apt.id} className={styles.weekAppointmentCard}>
                                                <div className={styles.aptTime}>{formatTime(apt.appointment_time)}</div>
                                                <div className={styles.aptPatient}>{apt.patient_name || apt.patient?.full_name || 'N/A'}</div>
                                                <div className={styles.aptStatus}>{getStatusBadge(apt.status)}</div>
                                                <div className={styles.aptActions}>
                                                    {apt.status === 'waiting_doctor_confirmation' && (
                                                        <>
                                                            <button onClick={() => handleConfirm(apt.id)} className={styles.btnConfirm}>Duyệt</button>
                                                            <button onClick={() => handleReject(apt.id)} className={styles.btnReject}>Từ chối</button>
                                                        </>
                                                    )}
                                                    {apt.status === 'confirmed' && (
                                                        <button onClick={() => handleStartExam(apt)} className={styles.btnExam}>Khám</button>
                                                    )}
                                                    <button onClick={() => handleViewDetail(apt)} className={styles.btnDetail}>Xem</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // Day View - List Layout
                <div className={styles.appointmentsList}>
                    {appointments.map(apt => (
                        <div key={apt.id} className={styles.appointmentCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.timeInfo}>
                                    <div className={styles.time}>
                                        <i className="fas fa-clock"></i>
                                        {formatTime(apt.appointment_time)}
                                    </div>
                                    <div className={styles.date}>
                                        {formatDate(apt.appointment_date)}
                                    </div>
                                </div>
                                {getStatusBadge(apt.status)}
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.patientInfo}>
                                    <div className={styles.patientAvatar}>
                                        <i className="fas fa-user"></i>
                                    </div>
                                    <div>
                                        <h3>{apt.patient_name}</h3>
                                        <div className={styles.patientMeta}>
                                            <span><i className="fas fa-phone"></i> {apt.patient_phone}</span>
                                            {apt.patient_gender && (
                                                <span>
                                                    <i className="fas fa-venus-mars"></i>
                                                    {apt.patient_gender === 'male' ? 'Nam' : 'Nữ'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.symptomsSection}>
                                    <h4><i className="fas fa-notes-medical"></i> Triệu chứng</h4>
                                    <p>{apt.symptoms}</p>
                                </div>

                                {apt.diagnosis && (
                                    <div className={styles.diagnosisSection}>
                                        <h4><i className="fas fa-stethoscope"></i> Chẩn đoán</h4>
                                        <p>{apt.diagnosis}</p>
                                    </div>
                                )}
                            </div>

                            <div className={styles.cardActions}>
                                <button
                                    className={styles.btnDetail}
                                    onClick={() => handleViewDetail(apt)}
                                >
                                    <i className="fas fa-info-circle"></i>
                                    Chi tiết
                                </button>

                                {apt.status === 'waiting_doctor_confirmation' && (
                                    <>
                                        <button
                                            className={styles.btnConfirm}
                                            onClick={() => handleConfirm(apt.id)}
                                        >
                                            <i className="fas fa-check"></i>
                                            Xác nhận
                                        </button>
                                        <button
                                            className={styles.btnReject}
                                            onClick={() => handleReject(apt.id)}
                                        >
                                            <i className="fas fa-times"></i>
                                            Từ chối
                                        </button>
                                    </>
                                )}

                                {apt.status === 'confirmed' && (
                                    <button
                                        className={styles.btnExam}
                                        onClick={() => handleStartExam(apt)}
                                    >
                                        <i className="fas fa-user-md"></i>
                                        Khám bệnh
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedAppointment && (
                <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Chi Tiết Lịch Hẹn</h2>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setShowDetailModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.modalSection}>
                                <h3>Thông Tin Bệnh Nhân</h3>
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>Họ tên:</span>
                                        <span className={styles.value}>{selectedAppointment.patient_name}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>Số điện thoại:</span>
                                        <span className={styles.value}>{selectedAppointment.patient_phone}</span>
                                    </div>
                                    {selectedAppointment.patient_email && (
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Email:</span>
                                            <span className={styles.value}>{selectedAppointment.patient_email}</span>
                                        </div>
                                    )}
                                    {selectedAppointment.patient_dob && (
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Ngày sinh:</span>
                                            <span className={styles.value}>{selectedAppointment.patient_dob}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.modalSection}>
                                <h3>Thông Tin Lịch Hẹn</h3>
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>Ngày khám:</span>
                                        <span className={styles.value}>{formatDate(selectedAppointment.appointment_date)}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>Giờ khám:</span>
                                        <span className={styles.value}>{formatTime(selectedAppointment.appointment_time)}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>Trạng thái:</span>
                                        <span className={styles.value}>{getStatusBadge(selectedAppointment.status)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modalSection}>
                                <h3>Triệu Chứng</h3>
                                <p className={styles.textContent}>{selectedAppointment.symptoms}</p>
                            </div>

                            {selectedAppointment.diagnosis && (
                                <div className={styles.modalSection}>
                                    <h3>Chẩn Đoán</h3>
                                    <p className={styles.textContent}>{selectedAppointment.diagnosis}</p>
                                </div>
                            )}

                            {selectedAppointment.conclusion && (
                                <div className={styles.modalSection}>
                                    <h3>Kết Luận</h3>
                                    <p className={styles.textContent}>{selectedAppointment.conclusion}</p>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            {(selectedAppointment.patient?.id || selectedAppointment.patient_id) && (
                                <button
                                    className={styles.btnViewHistory}
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        navigate(`/doctor-portal/patient-history/${selectedAppointment.patient?.id || selectedAppointment.patient_id}`);
                                    }}
                                >
                                    📋 Xem hồ sơ bệnh án
                                </button>
                            )}
                            <button
                                className={styles.btnClose}
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
}
