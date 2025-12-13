import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './ConsultationRequests.module.css';

export default function ConsultationRequests() {
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState(null);
    const [specialties, setSpecialties] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        specialty_id: '',
        search: ''
    });
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showResponseModal, setShowResponseModal] = useState(false);  // ✅ NEW
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [responseText, setResponseText] = useState('');  // ✅ NEW
    const [responding, setResponding] = useState(false);  // ✅ NEW
    const [assignForm, setAssignForm] = useState({
        doctor_id: '',
        specialty_id: '',
        priority: '',
        admin_notes: ''
    });

    useEffect(() => {
        fetchStats();
        fetchSpecialties();
        fetchDoctors();
        fetchRequests();
    }, [filters]);

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/admin/consultations/stats');
            setStats(response.data.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            setSpecialties(response.data.specialties || []);
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    const fetchDoctors = async () => {
        try {
            const response = await api.get('/api/public/doctors');
            setDoctors(response.data.doctors || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.specialty_id) params.append('specialty_id', filters.specialty_id);
            if (filters.search) params.append('search', filters.search);

            const response = await api.get(`/api/admin/consultations?${params}`);
            setRequests(response.data.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
            alert('Lỗi khi tải danh sách yêu cầu!');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAssignModal = (request) => {
        setSelectedRequest(request);
        setAssignForm({
            doctor_id: request.assigned_doctor_id || '',
            specialty_id: request.specialty_id || '',
            priority: request.priority,
            admin_notes: request.admin_notes || ''
        });
        setShowAssignModal(true);
    };

    // ✅ NEW: Mở modal trả lời
    const handleOpenResponseModal = (request) => {
        setSelectedRequest(request);
        setResponseText(request.doctor_response || '');
        setShowResponseModal(true);
    };

    // ✅ NEW: Admin gửi phản hồi
    const handleSubmitResponse = async () => {
        if (!responseText.trim()) {
            alert('Vui lòng nhập nội dung phản hồi!');
            return;
        }

        try {
            setResponding(true);
            await api.post(`/api/admin/consultations/${selectedRequest.id}/respond`, {
                admin_response: responseText,
                status: 'in_progress'
            });

            alert('Đã gửi phản hồi thành công!');
            setShowResponseModal(false);
            fetchStats();
            fetchRequests();
        } catch (error) {
            console.error('Error submitting response:', error);
            alert('Lỗi: ' + (error.response?.data?.message || 'Có lỗi xảy ra!'));
        } finally {
            setResponding(false);
        }
    };

    const handleAssignDoctor = async () => {
        if (!assignForm.doctor_id) {
            alert('Vui lòng chọn bác sĩ!');
            return;
        }

        try {
            await api.post(`/api/admin/consultations/${selectedRequest.id}/assign-doctor`, assignForm);
            alert('Đã chỉ định bác sĩ thành công!');
            setShowAssignModal(false);
            fetchStats();
            fetchRequests();
        } catch (error) {
            console.error('Error assigning doctor:', error);
            alert('Lỗi: ' + (error.response?.data?.message || 'Có lỗi xảy ra!'));
        }
    };

    const handleUpdateStatus = async (id, status) => {
        if (!window.confirm(`Cập nhật trạng thái thành "${getStatusText(status)}"?`)) return;

        try {
            await api.put(`/api/admin/consultations/${id}`, { status });
            alert('Cập nhật thành công!');
            fetchStats();
            fetchRequests();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Có lỗi xảy ra!');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xác nhận xóa yêu cầu này?')) return;

        try {
            await api.delete(`/api/admin/consultations/${id}`);
            alert('Đã xóa!');
            fetchStats();
            fetchRequests();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Có lỗi xảy ra!');
        }
    };

    const getStatusBadge = (status) => {
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

    const getPriorityBadge = (priority) => {
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

    const getStatusText = (status) => {
        const texts = {
            pending: 'Chờ xử lý',
            assigned: 'Đã giao',
            in_progress: 'Đang tư vấn',
            resolved: 'Đã giải quyết',
            closed: 'Đã đóng'
        };
        return texts[status] || status;
    };

    const getCategoryText = (category) => {
        const texts = {
            general: 'Tổng quát',
            medical_inquiry: 'Tư vấn y tế',
            appointment: 'Đặt lịch khám',
            complaint: 'Khiếu nại',
            other: 'Khác'
        };
        return texts[category] || category;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('vi-VN');
    };

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
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className={styles.searchInput}
                />

                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="assigned">Đã giao</option>
                    <option value="in_progress">Đang tư vấn</option>
                    <option value="resolved">Đã giải quyết</option>
                    <option value="closed">Đã đóng</option>
                </select>

                <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
                    <option value="">Tất cả mức độ</option>
                    <option value="urgent">Khẩn cấp</option>
                    <option value="high">Cao</option>
                    <option value="medium">Trung bình</option>
                    <option value="low">Thấp</option>
                </select>

                <select value={filters.specialty_id} onChange={(e) => setFilters({ ...filters, specialty_id: e.target.value })}>
                    <option value="">Tất cả chuyên khoa</option>
                    {specialties.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>

                <button onClick={() => setFilters({ status: '', priority: '', specialty_id: '', search: '' })} className={styles.resetBtn}>
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
                                        {getStatusBadge(request.status)}
                                        {getPriorityBadge(request.priority)}
                                        <span className={styles.categoryBadge}>{getCategoryText(request.category)}</span>
                                    </div>
                                </div>
                                <div className={styles.headerRight}>
                                    <button
                                        className={styles.btnRespond}
                                        onClick={() => handleOpenResponseModal(request)}
                                        disabled={request.status === 'closed'}
                                        style={{ background: '#9c27b0', color: 'white', marginRight: '8px' }}
                                    >
                                        Trả lời
                                    </button>
                                    <button
                                        className={styles.btnAssign}
                                        onClick={() => handleOpenAssignModal(request)}
                                        disabled={request.status === 'closed'}
                                    >
                                        {request.assigned_doctor_id ? 'Đổi bác sĩ' : 'Chỉ định bác sĩ'}
                                    </button>
                                    <button
                                        className={styles.btnDelete}
                                        onClick={() => handleDelete(request.id)}
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
                                        <small>Thời gian: {formatDate(request.responded_at)}</small>
                                    </div>
                                )}

                                {request.admin_notes && (
                                    <div className={styles.adminNotes}>
                                        <strong>Ghi chú nội bộ:</strong>
                                        <p>{request.admin_notes}</p>
                                    </div>
                                )}

                                <div className={styles.cardFooter}>
                                    <small>Tạo lúc: {formatDate(request.created_at)}</small>
                                    {request.assigned_at && <small>Giao lúc: {formatDate(request.assigned_at)}</small>}
                                    {request.resolved_at && <small>Giải quyết: {formatDate(request.resolved_at)}</small>}
                                </div>
                            </div>

                            <div className={styles.cardFooter}>
                                {request.status === 'assigned' && (
                                    <button onClick={() => handleUpdateStatus(request.id, 'in_progress')} className={styles.btnStatus}>
                                        Đang tư vấn
                                    </button>
                                )}
                                {(request.status === 'in_progress' || request.status === 'assigned') && (
                                    <button onClick={() => handleUpdateStatus(request.id, 'resolved')} className={styles.btnStatus}>
                                        Đã giải quyết
                                    </button>
                                )}
                                {request.status === 'resolved' && (
                                    <button onClick={() => handleUpdateStatus(request.id, 'closed')} className={styles.btnStatus}>
                                        Đóng
                                    </button>
                                )}
                                {request.status === 'pending' && (
                                    <button onClick={() => handleUpdateStatus(request.id, 'closed')} className={styles.btnStatus}>
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
                <div className={styles.modalOverlay} onClick={() => setShowAssignModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Chỉ định Bác sĩ</h2>
                            <button className={styles.closeBtn} onClick={() => setShowAssignModal(false)}>Đóng</button>
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
                                    onChange={(e) => setAssignForm({ ...assignForm, specialty_id: e.target.value })}
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
                                    onChange={(e) => setAssignForm({ ...assignForm, doctor_id: e.target.value })}
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
                                    onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
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
                                    onChange={(e) => setAssignForm({ ...assignForm, admin_notes: e.target.value })}
                                    rows="3"
                                    placeholder="Ghi chú cho admin..."
                                />
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.btnCancel} onClick={() => setShowAssignModal(false)}>Hủy</button>
                            <button className={styles.btnSave} onClick={handleAssignDoctor}>Chỉ định</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ NEW: Response Modal - Admin trả lời trực tiếp */}
            {showResponseModal && selectedRequest && (
                <div className={styles.modalOverlay} onClick={() => setShowResponseModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Trả lời Yêu cầu</h2>
                            <button className={styles.closeBtn} onClick={() => setShowResponseModal(false)}>Đóng</button>
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
                                    onChange={(e) => setResponseText(e.target.value)}
                                    rows="6"
                                    placeholder="Nhập nội dung phản hồi cho khách hàng..."
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.btnCancel} onClick={() => setShowResponseModal(false)}>Hủy</button>
                            <button
                                className={styles.btnSave}
                                onClick={handleSubmitResponse}
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
