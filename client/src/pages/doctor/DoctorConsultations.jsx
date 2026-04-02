import React, { Component } from 'react';
import api from '../../utils/api';
import styles from './DoctorConsultations.module.css';

class DoctorConsultations extends Component {
    constructor(props) {
        super(props);
        this.state = {
            requests: [],
            loading: true,
            filter: 'assigned',
            showResponseModal: false,
            selectedRequest: null,
            responseText: '',
            responding: false
        };
    }

    componentDidMount() {
        this.fetchRequests();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.filter !== this.state.filter) {
            this.fetchRequests();
        }
    }

    fetchRequests = async () => {
        try {
            this.setState({ loading: true });
            const params = new URLSearchParams();
            if (this.state.filter && this.state.filter !== 'all') params.append('status', this.state.filter);

            const response = await api.get(`/api/doctor/consultations?${params}`);
            this.setState({ requests: response.data.data });
        } catch (error) {
            console.error('Error fetching requests:', error);
            alert('Lỗi khi tải danh sách yêu cầu!');
        } finally {
            this.setState({ loading: false });
        }
    };

    handleOpenResponseModal = (request) => {
        this.setState({
            selectedRequest: request,
            responseText: request.doctor_response || '',
            showResponseModal: true
        });
    };

    handleSubmitResponse = async () => {
        const { responseText, selectedRequest } = this.state;
        if (!responseText.trim()) {
            alert('Vui lòng nhập nội dung phản hồi!');
            return;
        }

        try {
            this.setState({ responding: true });
            await api.post(`/api/doctor/consultations/${selectedRequest.id}/respond`, {
                doctor_response: responseText,
                status: selectedRequest.doctor_response ? selectedRequest.status : 'in_progress'
            });

            alert('Đã gửi phản hồi thành công!');
            this.setState({ showResponseModal: false });
            this.fetchRequests();
        } catch (error) {
            console.error('Error submitting response:', error);
            alert('Lỗi: ' + (error.response?.data?.message || 'Có lỗi xảy ra!'));
        } finally {
            this.setState({ responding: false });
        }
    };

    handleMarkResolved = async (id) => {
        if (!window.confirm('Xác nhận đã giải quyết yêu cầu này?')) return;

        try {
            await api.put(`/api/doctor/consultations/${id}/resolve`);
            alert('Đã đánh dấu hoàn thành!');
            this.fetchRequests();
        } catch (error) {
            console.error('Error marking resolved:', error);
            alert('Có lỗi xảy ra!');
        }
    };

    getStatusBadge = (status) => {
        const badges = {
            pending: { text: 'Chờ xử lý', color: '#ff9800' },
            assigned: { text: 'Mới giao', color: '#2196f3' },
            in_progress: { text: 'Đang tư vấn', color: '#9c27b0' },
            resolved: { text: 'Đã giải quyết', color: '#4caf50' },
            closed: { text: 'Đã đóng', color: '#757575' }
        };
        const badge = badges[status] || { text: status, color: '#999' };
        return (
            <span style={{
                padding: '6px 14px',
                borderRadius: '16px',
                fontSize: '0.85rem',
                fontWeight: '600',
                background: badge.color,
                color: 'white'
            }}>
                {badge.text}
            </span>
        );
    };

    getPriorityBadge = (priority) => {
        const badges = {
            low: { text: 'Thấp', color: '#4caf50' },
            medium: { text: 'Trung bình', color: '#ff9800' },
            high: { text: 'Cao', color: '#f44336' },
            urgent: { text: 'KHẨN CẤP', color: '#d32f2f' }
        };
        const badge = badges[priority] || { text: priority, color: '#999' };
        return (
            <span style={{
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: '700',
                background: badge.color + '20',
                color: badge.color,
                border: `2px solid ${badge.color}`
            }}>
                {badge.text}
            </span>
        );
    };

    getCategoryText = (category) => {
        const texts = {
            general: 'Tổng quát',
            medical_inquiry: 'Tư vấn y tế',
            appointment: 'Đặt lịch khám',
            complaint: 'Khiếu nại',
            other: 'Khác'
        };
        return texts[category] || category;
    };

    formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('vi-VN');
    };

    render() {
        const { requests, loading, filter, showResponseModal, selectedRequest, responseText, responding } = this.state;

        const stats = {
            total: requests.length,
            assigned: requests.filter(r => r.status === 'assigned').length,
            inProgress: requests.filter(r => r.status === 'in_progress').length,
            resolved: requests.filter(r => r.status === 'resolved').length
        };

        return (
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <h1>Yêu cầu Tư vấn của Tôi</h1>
                </div>

                {/* Stats */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard} style={{ background: '#2196f3' }}>
                        <div className={styles.statValue}>{stats.assigned}</div>
                        <div className={styles.statLabel}>Mới giao</div>
                    </div>
                    <div className={styles.statCard} style={{ background: '#9c27b0' }}>
                        <div className={styles.statValue}>{stats.inProgress}</div>
                        <div className={styles.statLabel}>Đang tư vấn</div>
                    </div>
                    <div className={styles.statCard} style={{ background: '#4caf50' }}>
                        <div className={styles.statValue}>{stats.resolved}</div>
                        <div className={styles.statLabel}>Đã giải quyết</div>
                    </div>
                    <div className={styles.statCard} style={{ background: '#45c3d2' }}>
                        <div className={styles.statValue}>{stats.total}</div>
                        <div className={styles.statLabel}>Tổng cộng</div>
                    </div>
                </div>

                {/* Filter */}
                <div className={styles.filters}>
                    <button
                        className={filter === 'assigned' ? styles.filterActive : styles.filterBtn}
                        onClick={() => this.setState({ filter: 'assigned' })}
                    >
                        Mới giao ({stats.assigned})
                    </button>
                    <button
                        className={filter === 'in_progress' ? styles.filterActive : styles.filterBtn}
                        onClick={() => this.setState({ filter: 'in_progress' })}
                    >
                        Đang tư vấn ({stats.inProgress})
                    </button>
                    <button
                        className={filter === 'resolved' ? styles.filterActive : styles.filterBtn}
                        onClick={() => this.setState({ filter: 'resolved' })}
                    >
                        Đã giải quyết ({stats.resolved})
                    </button>
                    <button
                        className={filter === 'all' ? styles.filterActive : styles.filterBtn}
                        onClick={() => this.setState({ filter: 'all' })}
                    >
                        Tất cả ({stats.total})
                    </button>
                </div>

                {/* Requests List */}
                {loading ? (
                    <div className={styles.loading}>Đang tải...</div>
                ) : requests.length === 0 ? (
                    <div className={styles.empty}>
                        {filter === 'assigned' ? 'Không có yêu cầu mới nào' : 'Không có yêu cầu nào'}
                    </div>
                ) : (
                    <div className={styles.requestsList}>
                        {requests.map(request => (
                            <div key={request.id} className={styles.requestCard}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.headerLeft}>
                                        <h3>#{request.id} - {request.subject}</h3>
                                        <div className={styles.badges}>
                                            {this.getStatusBadge(request.status)}
                                            {this.getPriorityBadge(request.priority)}
                                            <span className={styles.categoryBadge}>{this.getCategoryText(request.category)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.cardBody}>
                                    <div className={styles.patientInfo}>
                                        <h4>Thông tin bệnh nhân</h4>
                                        <div className={styles.infoGrid}>
                                            <div><strong>Họ tên:</strong> {request.patient?.full_name || request.guest_name}</div>
                                            <div><strong>Email:</strong> {request.patient?.email || request.guest_email}</div>
                                            <div><strong>SĐT:</strong> {request.patient?.phone || request.guest_phone || 'N/A'}</div>
                                            {request.patient?.birthday && (
                                                <div><strong>Ngày sinh:</strong> {new Date(request.patient.birthday).toLocaleDateString('vi-VN')}</div>
                                            )}
                                            {request.patient?.gender && (
                                                <div><strong>Giới tính:</strong> {request.patient.gender === 'male' ? 'Nam' : 'Nữ'}</div>
                                            )}
                                            {request.patient?.address && (
                                                <div><strong>Địa chỉ:</strong> {request.patient.address}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.message}>
                                        <h4>Nội dung yêu cầu</h4>
                                        <p>{request.message}</p>
                                        <small>Gửi lúc: {this.formatDate(request.created_at)}</small>
                                    </div>

                                    {request.specialty && (
                                        <div className={styles.specialtyInfo}>
                                            <strong>Chuyên khoa:</strong> {request.specialty.name}
                                        </div>
                                    )}

                                    {request.doctor_response && (
                                        <div className={styles.myResponse}>
                                            <h4>Phản hồi của tôi</h4>
                                            <p>{request.doctor_response}</p>
                                            <small>{this.formatDate(request.responded_at)}</small>
                                        </div>
                                    )}

                                    <div className={styles.timestamps}>
                                        <small>Nhận: {this.formatDate(request.assigned_at)}</small>
                                        {request.resolved_at && <small>Hoàn thành: {this.formatDate(request.resolved_at)}</small>}
                                    </div>
                                </div>

                                <div className={styles.cardFooter}>
                                    {(request.status === 'assigned' || request.status === 'in_progress') && (
                                        <>
                                            <button
                                                className={styles.btnRespond}
                                                onClick={() => this.handleOpenResponseModal(request)}
                                            >
                                                {request.doctor_response ? 'Cập nhật phản hồi' : 'Phản hồi'}
                                            </button>
                                            {request.doctor_response && (
                                                <button
                                                    className={styles.btnResolve}
                                                    onClick={() => this.handleMarkResolved(request.id)}
                                                >
                                                    Đánh dấu hoàn thành
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {request.status === 'resolved' && (
                                        <span className={styles.resolvedLabel}>Đã hoàn thành</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Response Modal */}
                {showResponseModal && selectedRequest && (
                    <div className={styles.modalOverlay} onClick={() => this.setState({ showResponseModal: false })}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>Phản hồi Tư vấn</h2>
                                <button className={styles.closeBtn} onClick={() => this.setState({ showResponseModal: false })}>Đóng</button>
                            </div>

                            <div className={styles.modalBody}>
                                <div className={styles.requestInfo}>
                                    <p><strong>Yêu cầu:</strong> {selectedRequest.subject}</p>
                                    <p><strong>Bệnh nhân:</strong> {selectedRequest.patient?.full_name || selectedRequest.guest_name}</p>
                                    <p><strong>Nội dung:</strong></p>
                                    <p style={{ marginTop: '8px', color: '#555' }}>{selectedRequest.message}</p>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Nội dung phản hồi *</label>
                                    <textarea
                                        value={responseText}
                                        onChange={(e) => this.setState({ responseText: e.target.value })}
                                        rows="8"
                                        placeholder="Nhập nội dung tư vấn/phản hồi cho bệnh nhân..."
                                    />
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button className={styles.btnCancel} onClick={() => this.setState({ showResponseModal: false })}>Hủy</button>
                                <button className={styles.btnSend} onClick={this.handleSubmitResponse} disabled={responding}>
                                    {responding ? 'Đang gửi...' : 'Gửi phản hồi'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default DoctorConsultations;
