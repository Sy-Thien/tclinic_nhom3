import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './ScheduleApproval.module.css';

export default function ScheduleApproval() {
    const [pendingSchedules, setPendingSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchPendingSchedules();
    }, []);

    const fetchPendingSchedules = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/pending-schedules');
            if (response.data.success) {
                setPendingSchedules(response.data.schedules);
            }
        } catch (error) {
            console.error('Lỗi lấy lịch chờ duyệt:', error);
            alert('Không thể tải lịch chờ duyệt: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (scheduleId) => {
        if (!window.confirm('Bạn có chắc muốn phê duyệt lịch làm việc này?')) return;

        try {
            const response = await api.post(`/api/admin/schedules/${scheduleId}/approve`);
            if (response.data.success) {
                alert(response.data.message);
                fetchPendingSchedules(); // Refresh list
            }
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleRejectClick = (schedule) => {
        setSelectedSchedule(schedule);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async () => {
        if (!rejectionReason.trim()) {
            alert('Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            const response = await api.post(`/api/admin/schedules/${selectedSchedule.id}/reject`, {
                rejection_reason: rejectionReason
            });
            if (response.data.success) {
                alert(response.data.message);
                setShowRejectModal(false);
                setSelectedSchedule(null);
                fetchPendingSchedules(); // Refresh list
            }
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleCancelReject = () => {
        setShowRejectModal(false);
        setSelectedSchedule(null);
        setRejectionReason('');
    };

    const dayOrder = {
        'Thứ 2': 1,
        'Thứ 3': 2,
        'Thứ 4': 3,
        'Thứ 5': 4,
        'Thứ 6': 5,
        'Thứ 7': 6,
        'Chủ nhật': 7
    };

    // Nhóm lịch theo bác sĩ
    const groupedSchedules = {};
    pendingSchedules.forEach(schedule => {
        const doctorId = schedule.doctor?.id;
        if (!groupedSchedules[doctorId]) {
            groupedSchedules[doctorId] = {
                doctor: schedule.doctor,
                schedules: []
            };
        }
        groupedSchedules[doctorId].schedules.push(schedule);
    });

    // Sắp xếp lịch trong mỗi group theo thứ tự ngày
    Object.values(groupedSchedules).forEach(group => {
        group.schedules.sort((a, b) => dayOrder[a.day_of_week] - dayOrder[b.day_of_week]);
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>⏳ Phê Duyệt Lịch Làm Việc</h1>
                <p>Duyệt các lịch làm việc mới được đăng ký bởi bác sĩ</p>
            </div>

            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <h3>{pendingSchedules.length}</h3>
                    <p>Lịch chờ duyệt</p>
                </div>
                <div className={styles.statCard}>
                    <h3>{Object.keys(groupedSchedules).length}</h3>
                    <p>Bác sĩ</p>
                </div>
            </div>

            {loading ? (
                <div className={styles.loading}>Đang tải...</div>
            ) : pendingSchedules.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>✅</div>
                    <h2>Tất cả lịch đã được duyệt</h2>
                    <p>Không có lịch làm việc nào đang chờ phê duyệt</p>
                </div>
            ) : (
                <div className={styles.content}>
                    {Object.values(groupedSchedules).map(({ doctor, schedules }) => (
                        <div key={doctor.id} className={styles.doctorGroup}>
                            <div className={styles.doctorHeader}>
                                <div className={styles.doctorInfo}>
                                    <h2>👨‍⚕️ {doctor.full_name}</h2>
                                    {doctor.specialty && (
                                        <span className={styles.specialty}>{doctor.specialty.name}</span>
                                    )}
                                </div>
                                <div className={styles.contact}>
                                    <p>📧 {doctor.email}</p>
                                    <p>📞 {doctor.phone}</p>
                                </div>
                            </div>

                            <div className={styles.scheduleList}>
                                {schedules.map(schedule => (
                                    <div key={schedule.id} className={styles.scheduleCard}>
                                        <div className={styles.scheduleInfo}>
                                            <h3 className={styles.dayOfWeek}>{schedule.day_of_week}</h3>
                                            <div className={styles.scheduleDetails}>
                                                <p>🕐 <strong>Giờ làm việc:</strong> {schedule.start_time?.substring(0, 5)} - {schedule.end_time?.substring(0, 5)}</p>
                                                {schedule.break_start && schedule.break_end && (
                                                    <p>☕ <strong>Nghỉ trưa:</strong> {schedule.break_start?.substring(0, 5)} - {schedule.break_end?.substring(0, 5)}</p>
                                                )}
                                                {schedule.room && (
                                                    <p>🚪 <strong>Phòng:</strong> {schedule.room}</p>
                                                )}
                                                <p className={styles.createdAt}>
                                                    📅 <strong>Đăng ký lúc:</strong> {new Date(schedule.createdAt).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className={styles.actionButtons}>
                                            <button
                                                onClick={() => handleApprove(schedule.id)}
                                                className={styles.approveBtn}
                                            >
                                                ✅ Phê duyệt
                                            </button>
                                            <button
                                                onClick={() => handleRejectClick(schedule)}
                                                className={styles.rejectBtn}
                                            >
                                                ❌ Từ chối
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal từ chối */}
            {showRejectModal && selectedSchedule && (
                <div className={styles.modalOverlay} onClick={handleCancelReject}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2>Từ chối lịch làm việc</h2>
                        <p>Bác sĩ: <strong>{selectedSchedule.doctor?.full_name}</strong></p>
                        <p>Ngày: <strong>{selectedSchedule.day_of_week}</strong></p>
                        <p>Giờ: <strong>{selectedSchedule.start_time?.substring(0, 5)} - {selectedSchedule.end_time?.substring(0, 5)}</strong></p>

                        <div className={styles.formGroup}>
                            <label>Lý do từ chối <span className={styles.required}>*</span></label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Vui lòng nhập lý do từ chối (bác sĩ sẽ nhìn thấy này)"
                                rows={4}
                                className={styles.textarea}
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button onClick={handleRejectConfirm} className={styles.confirmBtn}>
                                Xác nhận từ chối
                            </button>
                            <button onClick={handleCancelReject} className={styles.cancelBtn}>
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
