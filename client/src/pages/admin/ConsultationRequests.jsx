import React, { Component } from 'react';
import api from '../../utils/api';
import styles from './ConsultationRequests.module.css';

class ConsultationRequests extends Component {
    constructor(props) {
        super(props);
        this.state = {
            requests: [],
            stats: null,
            specialties: [],
            doctors: [],
            loading: true,
            filters: {
                status: '',
                priority: '',
                specialty_id: '',
                search: ''
            },
            showAssignModal: false,
            showResponseModal: false,
            selectedRequest: null,
            responseText: '',
            responding: false,
            assignForm: {
                doctor_id: '',
                specialty_id: '',
                priority: '',
                admin_notes: ''
            }
        };
    }

    componentDidMount() {
        this.fetchStats();
        this.fetchSpecialties();
        this.fetchDoctors();
        this.fetchRequests();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.filters !== this.state.filters) {
            this.fetchRequests();
        }
    }

    fetchStats = async () => {
        try {
            const response = await api.get('/api/admin/consultations/stats');
            this.setState({ stats: response.data.data });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            this.setState({ specialties: response.data.specialties || [] });
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    fetchDoctors = async () => {
        try {
            const response = await api.get('/api/public/doctors');
            this.setState({ doctors: response.data.doctors || [] });
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    fetchRequests = async () => {
        try {
            this.setState({ loading: true });
            const { filters } = this.state;
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.specialty_id) params.append('specialty_id', filters.specialty_id);
            if (filters.search) params.append('search', filters.search);

            const response = await api.get(`/api/admin/consultations?${params}`);
            this.setState({ requests: response.data.data });
        } catch (error) {
            console.error('Error fetching requests:', error);
            alert('Lỗi khi tải danh sách yêu cầu!');
        } finally {
            this.setState({ loading: false });
        }
    };

    handleOpenAssignModal = (request) => {
        this.setState({
            selectedRequest: request,
            assignForm: {
                doctor_id: request.assigned_doctor_id || '',
                specialty_id: request.specialty_id || '',
                priority: request.priority,
                admin_notes: request.admin_notes || ''
            },
            showAssignModal: true
        });
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
            await api.post(`/api/admin/consultations/${selectedRequest.id}/respond`, {
                admin_response: responseText,
                status: 'in_progress'
            });

            alert('Đã gửi phản hồi thành công!');
            this.setState({ showResponseModal: false });
            this.fetchStats();
            this.fetchRequests();
        } catch (error) {
            console.error('Error submitting response:', error);
            alert('Lỗi: ' + (error.response?.data?.message || 'Có lỗi xảy ra!'));
        } finally {
            this.setState({ responding: false });
        }
    };

    handleAssignDoctor = async () => {
        const { assignForm, selectedRequest } = this.state;
        if (!assignForm.doctor_id) {
            alert('Vui lòng chọn bác sĩ!');
            return;
        }

        try {
            await api.post(`/api/admin/consultations/${selectedRequest.id}/assign-doctor`, assignForm);
            alert('Đã chỉ định bác sĩ thành công!');
            this.setState({ showAssignModal: false });
            this.fetchStats();
            this.fetchRequests();
        } catch (error) {
            console.error('Error assigning doctor:', error);
            alert('Lỗi: ' + (error.response?.data?.message || 'Có lỗi xảy ra!'));
        }
    };

    handleUpdateStatus = async (id, status) => {
        if (!window.confirm(`Cập nhật trạng thái thành "${this.getStatusText(status)}"?`)) return;

        try {
            await api.put(`/api/admin/consultations/${id}`, { status });
            alert('Cập nhật thành công!');
            this.fetchStats();
            this.fetchRequests();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Có lỗi xảy ra!');
        }
    };

    handleDelete = async (id) => {
        if (!window.confirm('Xác nhận xóa yêu cầu này?')) return;

        try {
            await api.delete(`/api/admin/consultations/${id}`);
            alert('Đã xóa!');
            this.fetchStats();
            this.fetchRequests();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Có lỗi xảy ra!');
        }
    };

    getStatusBadge = (status) => {
        const badges = {
            pending: { text: 'Chờ xử lý', color: '#ff9800' },
            assigned: { text: 'Đã giao', color: '#2196f3' },
            in_progress: { text: 'Đang tư vấn', color: '#9c27b0' },
            resolved: { text: 'Đã giải quyết', color: '#4caf50' },
            closed: { text: 'Đã đóng', color: '#757575' }
        };
        const badge = badges[status] || { text: status, color: '#999' };
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
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
            urgent: { text: 'Khẩn cấp', color: '#d32f2f' }
        };
        const badge = badges[priority] || { text: priority, color: '#999' };
        return (
            <span style={{
                padding: '2px 8px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '600',
                background: badge.color + '20',
                color: badge.color,
                border: `1px solid ${badge.color}`
            }}>
                {badge.text}
            </span>
        );
    };

    getStatusText = (status) => {
        const texts = {
            pending: 'Chờ xử lý',
            assigned: 'Đã giao',
            in_progress: 'Đang tư vấn',
            resolved: 'Đã giải quyết',
            closed: 'Đã đóng'
        };
        return texts[status] || status;
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
        const {
            requests, stats, specialties, doctors, loading, filters,
            showAssignModal, showResponseModal, selectedRequest,
            responseText, responding, assignForm
        } = this.state;

        return (
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <h1>Quản lý Yêu cầu Tư vấn</h1>
                </div>

                {/* Stats */}
                {stats && (
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard} style={{ background: '#ff9800' }}>
                            <div className={styles.statValue}>{stats.pending}</div>
                            <div className={styles.statLabel}>Chờ xử lý</div>
                        </div>
                        <div className={styles.statCard} style={{ background: '#2196f3' }}>
                            <div className={styles.statValue}>{stats.assigned}</div>
                            <div className={styles.statLabel}>Đã giao</div>
                        </div>
                        <div className={styles.statCard} style={{ background: '#9c27b0' }}>
                            <div className={styles.statValue}>{stats.inProgress}</div>
                            <div className={styles.statLabel}>Đang tư vấn</div>
                        </div>
                        <div className={styles.statCard} style={{ background: '#4caf50' }}>
                            <div className={styles.statValue}>{stats.resolved}</div>
                            <div className={styles.statLabel}>Đã giải quyết</div>
                        </div>
                        <div className={styles.statCard} style={{ background: '#d32f2f' }}>
                            <div className={styles.statValue}>{stats.urgent}</div>
                            <div className={styles.statLabel}>Khẩn cấp</div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className={styles.filters}>
                    <input
                        type="text"
                        placeholder="Tìm theo tên, email, chủ đề..."
                        value={filters.search}
                        onChange={(e) => this.setState({ filters: { ...filters, search: e.target.value } })}
                        className={styles.searchInput}
                    />

                    <select value={filters.status} onChange={(e) => this.setState({ filters: { ...filters, status: e.target.value } })}>
                        <option value="">Tất cả trạng thái</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="assigned">Đã giao</option>
                        <option value="in_progress">Đang tư vấn</option>
                        <option value="resolved">Đã giải quyết</option>
                        <option value="closed">Đã đóng</option>
                    </select>

                    <select value={filters.priority} onChange={(e) => this.setState({ filters: { ...filters, priority: e.target.value } })}>
                        <option value="">Tất cả mức độ</option>
                        <option value="urgent">Khẩn cấp</option>
                        <option value="high">Cao</option>
                        <option value="medium">Trung bình</option>
                        <option value="low">Thấp</option>
                    </select>

                    <select value={filters.specialty_id} onChange={(e) => this.setState({ filters: { ...filters, specialty_id: e.target.value } })}>
                        <option value="">Tất cả chuyên khoa</option>
                        {specialties.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    <button onClick={() => this.setState({ filters: { status: '', priority: '', specialty_id: '', search: '' } })} className={styles.resetBtn}>
                        Reset
                    </button>
                </div>

                {/* Requests List */}
                {loading ? (
                    <div className={styles.loading}>Đang tải...</div>
                ) : requests.length === 0 ? (
                    <div className={styles.empty}>Không có yêu cầu nào</div>
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
                                    <div className={styles.headerRight}>
                                        <button
                                            className={styles.btnRespond}
                                            onClick={() => this.handleOpenResponseModal(request)}
                                            disabled={request.status === 'closed'}
                                            style={{ background: '#9c27b0', color: 'white', marginRight: '8px' }}
                                        >
                                            Trả lời
                                        </button>
                                        <button
                                            className={styles.btnAssign}
                                            onClick={() => this.handleOpenAssignModal(request)}
                                            disabled={request.status === 'closed'}
                                        >
                                            {request.assigned_doctor_id ? 'Đổi bác sĩ' : 'Chỉ định bác sĩ'}
                                        </button>
                                        <button
                                            className={styles.btnDelete}
                                            onClick={() => this.handleDelete(request.id)}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.cardBody}>
                                    <div className={styles.info}>
                                        <div><strong>Người gửi:</strong> {request.patient?.full_name || request.guest_name}</div>
                                        <div><strong>Email:</strong> {request.patient?.email || request.guest_email}</div>
                                        <div><strong>SĐT:</strong> {request.patient?.phone || request.guest_phone || 'N/A'}</div>
                                        {request.specialty && (
                                            <div><strong>Chuyên khoa:</strong> {request.specialty.name}</div>
                                        )}
                                        {request.assignedDoctor && (
                                            <div><strong>Bác sĩ:</strong> {request.assignedDoctor.full_name}</div>
                                        )}
                                    </div>

                                    <div className={styles.message}>
                                        <strong>Nội dung:</strong>
                                        <p>{request.message}</p>
                                    </div>

                                    {request.doctor_response && (
                                        <div className={styles.response}>
                                            <strong>Phản hồi từ bác sĩ:</strong>
                                            <p>{request.doctor_response}</p>
                                            <small>Thời gian: {this.formatDate(request.responded_at)}</small>
                                        </div>
                                    )}

                                    {request.admin_notes && (
                                        <div className={styles.adminNotes}>
                                            <strong>Ghi chú nội bộ:</strong>
                                            <p>{request.admin_notes}</p>
                                        </div>
                                    )}

                                    <div className={styles.cardFooter}>
                                        <small>Tạo lúc: {this.formatDate(request.created_at)}</small>
                                        {request.assigned_at && <small>Giao lúc: {this.formatDate(request.assigned_at)}</small>}
                                        {request.resolved_at && <small>Giải quyết: {this.formatDate(request.resolved_at)}</small>}
                                    </div>
                                </div>

                                <div className={styles.cardFooter}>
                                    {request.status === 'assigned' && (
                                        <button onClick={() => this.handleUpdateStatus(request.id, 'in_progress')} className={styles.btnStatus}>
                                            Đang tư vấn
                                        </button>
                                    )}
                                    {(request.status === 'in_progress' || request.status === 'assigned') && (
                                        <button onClick={() => this.handleUpdateStatus(request.id, 'resolved')} className={styles.btnStatus}>
                                            Đã giải quyết
                                        </button>
                                    )}
                                    {request.status === 'resolved' && (
                                        <button onClick={() => this.handleUpdateStatus(request.id, 'closed')} className={styles.btnStatus}>
                                            Đóng
                                        </button>
                                    )}
                                    {request.status === 'pending' && (
                                        <button onClick={() => this.handleUpdateStatus(request.id, 'closed')} className={styles.btnStatus}>
                                            Từ chối
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Assign Doctor Modal */}
                {showAssignModal && selectedRequest && (
                    <div className={styles.modalOverlay} onClick={() => this.setState({ showAssignModal: false })}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>Chỉ định Bác sĩ</h2>
                                <button className={styles.closeBtn} onClick={() => this.setState({ showAssignModal: false })}>Đóng</button>
                            </div>

                            <div className={styles.modalBody}>
                                <div className={styles.requestInfo}>
                                    <p><strong>Yêu cầu:</strong> {selectedRequest.subject}</p>
                                    <p><strong>Người gửi:</strong> {selectedRequest.patient?.full_name || selectedRequest.guest_name}</p>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Chuyên khoa *</label>
                                    <select
                                        value={assignForm.specialty_id}
                                        onChange={(e) => this.setState({ assignForm: { ...assignForm, specialty_id: e.target.value } })}
                                    >
                                        <option value="">-- Chọn chuyên khoa --</option>
                                        {specialties.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Bác sĩ *</label>
                                    <select
                                        value={assignForm.doctor_id}
                                        onChange={(e) => this.setState({ assignForm: { ...assignForm, doctor_id: e.target.value } })}
                                    >
                                        <option value="">-- Chọn bác sĩ --</option>
                                        {doctors
                                            .filter(d => !assignForm.specialty_id || d.specialty_id == assignForm.specialty_id)
                                            .map(d => (
                                                <option key={d.id} value={d.id}>
                                                    {d.full_name} ({d.specialty?.name})
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Mức độ ưu tiên</label>
                                    <select
                                        value={assignForm.priority}
                                        onChange={(e) => this.setState({ assignForm: { ...assignForm, priority: e.target.value } })}
                                    >
                                        <option value="low">Thấp</option>
                                        <option value="medium">Trung bình</option>
                                        <option value="high">Cao</option>
                                        <option value="urgent">Khẩn cấp</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Ghi chú nội bộ</label>
                                    <textarea
                                        value={assignForm.admin_notes}
                                        onChange={(e) => this.setState({ assignForm: { ...assignForm, admin_notes: e.target.value } })}
                                        rows="3"
                                        placeholder="Ghi chú cho admin..."
                                    />
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button className={styles.btnCancel} onClick={() => this.setState({ showAssignModal: false })}>Hủy</button>
                                <button className={styles.btnSave} onClick={this.handleAssignDoctor}>Chỉ định</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Response Modal */}
                {showResponseModal && selectedRequest && (
                    <div className={styles.modalOverlay} onClick={() => this.setState({ showResponseModal: false })}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>Trả lời Yêu cầu</h2>
                                <button className={styles.closeBtn} onClick={() => this.setState({ showResponseModal: false })}>Đóng</button>
                            </div>

                            <div className={styles.modalBody}>
                                <div className={styles.requestInfo}>
                                    <p><strong>Chủ đề:</strong> {selectedRequest.subject}</p>
                                    <p><strong>Người gửi:</strong> {selectedRequest.patient?.full_name || selectedRequest.guest_name}</p>
                                    <p><strong>Nội dung:</strong></p>
                                    <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                                        {selectedRequest.message}
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Nội dung phản hồi *</label>
                                    <textarea
                                        value={responseText}
                                        onChange={(e) => this.setState({ responseText: e.target.value })}
                                        rows="6"
                                        placeholder="Nhập nội dung phản hồi cho khách hàng..."
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button className={styles.btnCancel} onClick={() => this.setState({ showResponseModal: false })}>Hủy</button>
                                <button
                                    className={styles.btnSave}
                                    onClick={this.handleSubmitResponse}
                                    disabled={responding}
                                    style={{ background: '#9c27b0' }}
                                >
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

export default ConsultationRequests;
