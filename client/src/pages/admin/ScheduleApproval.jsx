import React, { Component } from 'react';
import api from '../../utils/api';
import styles from './ScheduleApproval.module.css';

class ScheduleApproval extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeTab: 'pending',
            pendingSchedules: [],
            historySchedules: [],
            loading: false,
            showRejectModal: false,
            selectedSchedule: null,
            rejectionReason: '',
            autoLoading: false
        };

        this.dayOrder = {
            'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4,
            'Thứ 6': 5, 'Thứ 7': 6, 'Chủ nhật': 7
        };
    }

    componentDidMount() {
        this.fetchTabData(this.state.activeTab);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.activeTab !== this.state.activeTab) {
            this.fetchTabData(this.state.activeTab);
        }
    }

    fetchTabData = (tab) => {
        if (tab === 'pending') {
            this.fetchPendingSchedules();
        } else {
            this.fetchHistory(tab);
        }
    };

    fetchPendingSchedules = async () => {
        try {
            this.setState({ loading: true });
            const response = await api.get('/api/admin/pending-schedules');
            if (response.data.success) {
                this.setState({ pendingSchedules: response.data.schedules });
            }
        } catch (error) {
            console.error('Lỗi lấy lịch chờ duyệt:', error);
        } finally {
            this.setState({ loading: false });
        }
    };

    fetchHistory = async (status) => {
        try {
            this.setState({ loading: true });
            const response = await api.get(`/api/admin/approval-history?status=${status}`);
            if (response.data.success) {
                this.setState({ historySchedules: response.data.schedules });
            }
        } catch (error) {
            console.error('Lỗi lấy lịch sử:', error);
        } finally {
            this.setState({ loading: false });
        }
    };

    handleApprove = async (scheduleId) => {
        if (!window.confirm('Phê duyệt lịch làm việc này?')) return;
        try {
            const response = await api.post(`/api/admin/schedules/${scheduleId}/approve`);
            if (response.data.success) {
                this.fetchPendingSchedules();
            }
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || error.message));
        }
    };

    handleApproveAll = async (doctorSchedules) => {
        if (!window.confirm(`Phê duyệt tất cả ${doctorSchedules.length} lịch của bác sĩ này?`)) return;
        try {
            await Promise.all(doctorSchedules.map(s => api.post(`/api/admin/schedules/${s.id}/approve`)));
            this.fetchPendingSchedules();
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || error.message));
        }
    };

    handleRejectClick = (schedule) => {
        this.setState({
            selectedSchedule: schedule,
            rejectionReason: '',
            showRejectModal: true
        });
    };

    handleRejectConfirm = async () => {
        const { selectedSchedule, rejectionReason } = this.state;
        if (!rejectionReason.trim()) {
            alert('Vui lòng nhập lý do từ chối');
            return;
        }
        try {
            const response = await api.post(`/api/admin/schedules/${selectedSchedule.id}/reject`, {
                rejection_reason: rejectionReason
            });
            if (response.data.success) {
                this.setState({ showRejectModal: false, selectedSchedule: null });
                this.fetchPendingSchedules();
            }
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || error.message));
        }
    };

    handleAutoApproveUnregistered = async () => {
        if (!window.confirm('Tự động duyệt lịch cả tuần (Thứ 2 – Chủ nhật, 07:00–17:00) cho tất cả bác sĩ chưa đăng ký lịch?')) return;
        try {
            this.setState({ autoLoading: true });
            const res = await api.post('/api/admin/schedules/auto-approve-unregistered');
            if (res.data.success) {
                if (res.data.created === 0) {
                    alert('✅ ' + res.data.message);
                } else {
                    const doctorNames = res.data.doctors.map(d => d.name).join(', ');
                    alert(`✅ ${res.data.message}\n\nCác bác sĩ: ${doctorNames}`);
                }
                this.fetchPendingSchedules();
            }
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || error.message));
        } finally {
            this.setState({ autoLoading: false });
        }
    };

    getGroupedPending = () => {
        const { pendingSchedules } = this.state;
        const grouped = {};
        pendingSchedules.forEach(s => {
            const key = s.doctor?.id;
            if (!grouped[key]) {
                grouped[key] = { doctor: s.doctor, schedules: [] };
            }
            grouped[key].schedules.push(s);
        });
        Object.values(grouped).forEach(g => {
            g.schedules.sort((a, b) => (this.dayOrder[a.day_of_week] || 0) - (this.dayOrder[b.day_of_week] || 0));
        });
        return grouped;
    };

    render() {
        const {
            activeTab, pendingSchedules, historySchedules, loading,
            showRejectModal, selectedSchedule, rejectionReason, autoLoading
        } = this.state;

        const groupedPending = this.getGroupedPending();

        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>⏳ Phê Duyệt Lịch Làm Việc</h1>
                    <p>Xem xét và phê duyệt lịch làm việc do bác sĩ đăng ký</p>
                </div>

                {/* Auto-approve banner */}
                <div className={styles.autoApproveBar}>
                    <div className={styles.autoApproveInfo}>
                        <strong>🤖 Tự động duyệt lịch</strong>
                        <span>Bác sĩ chưa đăng ký lịch sẽ được tự động phê duyệt lịch cả tuần (Thứ 2 – Chủ nhật, 07:00–17:00)</span>
                    </div>
                    <button
                        className={styles.autoApproveBtn}
                        onClick={this.handleAutoApproveUnregistered}
                        disabled={autoLoading}
                    >
                        {autoLoading ? '⏳ Đang xử lý...' : '✅ Tự động duyệt cho bác sĩ chưa đăng ký'}
                    </button>
                </div>

                {/* Stats */}
                <div className={styles.stats}>
                    <div className={`${styles.statCard} ${styles.statPending}`}>
                        <div className={styles.statNum}>{pendingSchedules.length}</div>
                        <div className={styles.statLabel}>⏳ Chờ duyệt</div>
                    </div>
                    <div className={`${styles.statCard} ${styles.statDoctors}`}>
                        <div className={styles.statNum}>{Object.keys(groupedPending).length}</div>
                        <div className={styles.statLabel}>👨‍⚕️ Bác sĩ đang chờ</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className={styles.tabBar}>
                    <button
                        className={`${styles.tab} ${activeTab === 'pending' ? styles.tabActive : ''}`}
                        onClick={() => this.setState({ activeTab: 'pending' })}
                    >
                        ⏳ Chờ duyệt
                        {pendingSchedules.length > 0 && (
                            <span className={styles.tabBadge}>{pendingSchedules.length}</span>
                        )}
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'approved' ? styles.tabActive : ''}`}
                        onClick={() => this.setState({ activeTab: 'approved' })}
                    >
                        ✅ Đã duyệt
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'rejected' ? styles.tabActive : ''}`}
                        onClick={() => this.setState({ activeTab: 'rejected' })}
                    >
                        ❌ Từ chối
                    </button>
                </div>

                {loading ? (
                    <div className={styles.loading}>Đang tải...</div>
                ) : activeTab === 'pending' ? (
                    pendingSchedules.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>✅</div>
                            <h2>Tất cả lịch đã được duyệt</h2>
                            <p>Không có lịch làm việc nào đang chờ phê duyệt</p>
                        </div>
                    ) : (
                        <div className={styles.content}>
                            {Object.values(groupedPending).map(({ doctor, schedules }) => (
                                <div key={doctor?.id} className={styles.doctorGroup}>
                                    <div className={styles.doctorHeader}>
                                        <div className={styles.doctorInfo}>
                                            <h2>👨‍⚕️ {doctor?.full_name}</h2>
                                            {doctor?.specialty && (
                                                <span className={styles.specialtyBadge}>{doctor.specialty.name}</span>
                                            )}
                                            <div className={styles.contactRow}>
                                                {doctor?.email && <span>📧 {doctor.email}</span>}
                                                {doctor?.phone && <span>📞 {doctor.phone}</span>}
                                            </div>
                                        </div>
                                        <button
                                            className={styles.approveAllBtn}
                                            onClick={() => this.handleApproveAll(schedules)}
                                        >
                                            ✅ Duyệt tất cả ({schedules.length})
                                        </button>
                                    </div>

                                    <div className={styles.scheduleList}>
                                        {schedules.map(schedule => (
                                            <div key={schedule.id} className={styles.scheduleCard}>
                                                <div className={styles.cardDay}>{schedule.day_of_week}</div>
                                                <div className={styles.cardDetails}>
                                                    <div className={styles.cardTime}>
                                                        🕐 {schedule.start_time?.substring(0, 5)} – {schedule.end_time?.substring(0, 5)}
                                                    </div>
                                                    {schedule.break_start && schedule.break_end && (
                                                        <div className={styles.cardBreak}>
                                                            ☕ Nghỉ: {schedule.break_start?.substring(0, 5)} – {schedule.break_end?.substring(0, 5)}
                                                        </div>
                                                    )}
                                                    {schedule.room && (
                                                        <div className={styles.cardRoom}>🚪 {schedule.room}</div>
                                                    )}
                                                    <div className={styles.cardMeta}>
                                                        📅 Đăng ký: {new Date(schedule.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    </div>
                                                </div>
                                                <div className={styles.actionButtons}>
                                                    <button
                                                        className={styles.approveBtn}
                                                        onClick={() => this.handleApprove(schedule.id)}
                                                    >
                                                        ✅ Duyệt
                                                    </button>
                                                    <button
                                                        className={styles.rejectBtn}
                                                        onClick={() => this.handleRejectClick(schedule)}
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
                    )
                ) : (
                    // History tab
                    historySchedules.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>{activeTab === 'approved' ? '✅' : '❌'}</div>
                            <h2>Không có dữ liệu</h2>
                            <p>Chưa có lịch nào {activeTab === 'approved' ? 'được phê duyệt' : 'bị từ chối'}</p>
                        </div>
                    ) : (
                        <div className={styles.historyList}>
                            {historySchedules.map(schedule => (
                                <div
                                    key={schedule.id}
                                    className={`${styles.historyCard} ${activeTab === 'rejected' ? styles.historyRejected : styles.historyApproved}`}
                                >
                                    <div className={styles.historyLeft}>
                                        <div className={styles.historyDoctor}>
                                            <strong>{schedule.doctor?.full_name}</strong>
                                            {schedule.doctor?.specialty && (
                                                <span className={styles.specialtyBadge}>{schedule.doctor.specialty.name}</span>
                                            )}
                                        </div>
                                        <div className={styles.historyDay}>{schedule.day_of_week}</div>
                                        <div className={styles.historyTime}>
                                            🕐 {schedule.start_time?.substring(0, 5)} – {schedule.end_time?.substring(0, 5)}
                                        </div>
                                        {schedule.room && (
                                            <div className={styles.historyRoom}>🚪 {schedule.room}</div>
                                        )}
                                        {schedule.rejection_reason && (
                                            <div className={styles.rejectionReason}>
                                                ❌ Lý do từ chối: <em>{schedule.rejection_reason}</em>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.historyRight}>
                                        <span className={`${styles.statusBadge} ${activeTab === 'approved' ? styles.badgeApproved : styles.badgeRejected}`}>
                                            {activeTab === 'approved' ? '✅ Đã duyệt' : '❌ Từ chối'}
                                        </span>
                                        {schedule.approved_at && (
                                            <div className={styles.approvedAt}>
                                                {new Date(schedule.approved_at).toLocaleDateString('vi-VN')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* Reject Modal */}
                {showRejectModal && selectedSchedule && (
                    <div className={styles.modalOverlay} onClick={() => this.setState({ showRejectModal: false })}>
                        <div className={styles.modal} onClick={e => e.stopPropagation()}>
                            <h2>❌ Từ chối lịch làm việc</h2>
                            <div className={styles.modalInfo}>
                                <p>👨‍⚕️ <strong>{selectedSchedule.doctor?.full_name}</strong></p>
                                <p>📅 <strong>{selectedSchedule.day_of_week}</strong> — {selectedSchedule.start_time?.substring(0, 5)} – {selectedSchedule.end_time?.substring(0, 5)}</p>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Lý do từ chối <span className={styles.required}>*</span></label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={e => this.setState({ rejectionReason: e.target.value })}
                                    placeholder="Nhập lý do từ chối (bác sĩ sẽ thấy thông báo này)"
                                    rows={4}
                                    className={styles.textarea}
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button onClick={() => this.setState({ showRejectModal: false })} className={styles.cancelBtn}>Hủy</button>
                                <button onClick={this.handleRejectConfirm} className={styles.confirmBtn}>Xác nhận từ chối</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default ScheduleApproval;
