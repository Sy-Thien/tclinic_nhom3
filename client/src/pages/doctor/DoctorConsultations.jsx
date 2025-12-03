import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './DoctorConsultations.module.css';

export default function DoctorConsultations() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('assigned'); // Mặc định xem assigned
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [responseText, setResponseText] = useState('');
    const [responding, setResponding] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filter && filter !== 'all') params.append('status', filter);

            const response = await api.get(`/api/doctor/consultations?${params}`);
            setRequests(response.data.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
            alert('Lỗi khi tải danh sách yêu cầu!');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenResponseModal = (request) => {
        setSelectedRequest(request);
        setResponseText(request.doctor_response || '');
        setShowResponseModal(true);
    };

    const handleSubmitResponse = async () => {
        if (!responseText.trim()) {
            alert('Vui lòng nhập nội dung phản hồi!');
            return;
        }

        try {
            setResponding(true);
            await api.post(`/api/doctor/consultations/${selectedRequest.id}/respond`, {
                doctor_response: responseText,
                status: selectedRequest.doctor_response ? selectedRequest.status : 'in_progress'
            });

            alert('Đã gửi phản hồi thành công!');
            setShowResponseModal(false);
            fetchRequests();
        } catch (error) {
            console.error('Error submitting response:', error);
            alert('Lỗi: ' + (error.response?.data?.message || 'Có lỗi xảy ra!'));
        } finally {
            setResponding(false);
        }
    };

    const handleMarkResolved = async (id) => {
        if (!window.confirm('Xác nhận đã giải quyết yêu cầu này?')) return;

        try {
            await api.put(`/api/doctor/consultations/${id}/resolve`);
            alert('Đã đánh dấu hoàn thành!');
            fetchRequests();
        } catch (error) {
            console.error('Error marking resolved:', error);
            alert('Có lỗi xảy ra!');
        }
    };

    const getStatusBadge = (status) => {
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

    const getPriorityBadge = (priority) => {
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
                <div className={styles.statCard} style={{ background: '#667eea' }}>
                    <div className={styles.statValue}>{stats.total}</div>
                    <div className={styles.statLabel}>Tổng cộng</div>
                </div>
            </div>

            {/* Filter */}
            <div className={styles.filters}>
                <button
                    className={filter === 'assigned' ? styles.filterActive : styles.filterBtn}
                    onClick={() => setFilter('assigned')}
                >
                    Mới giao ({stats.assigned})
                </button>
                <button
                    className={filter === 'in_progress' ? styles.filterActive : styles.filterBtn}
                    onClick={() => setFilter('in_progress')}
                >
                    Đang tư vấn ({stats.inProgress})
                </button>
                <button
                    className={filter === 'resolved' ? styles.filterActive : styles.filterBtn}
                    onClick={() => setFilter('resolved')}
                >
                    Đã giải quyết ({stats.resolved})
                </button>
                <button
                    className={filter === 'all' ? styles.filterActive : styles.filterBtn}
                    onClick={() => setFilter('all')}
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
                                        {getStatusBadge(request.status)}
                                        {getPriorityBadge(request.priority)}
                                        <span className={styles.categoryBadge}>{getCategoryText(request.category)}</span>
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
                                    <small>Gửi lúc: {formatDate(request.created_at)}</small>
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
                                        <small>{formatDate(request.responded_at)}</small>
                                    </div>
                                )}

                                <div className={styles.timestamps}>
                                    <small>Nhận: {formatDate(request.assigned_at)}</small>
                                    {request.resolved_at && <small>Hoàn thành: {formatDate(request.resolved_at)}</small>}
                                </div>
                            </div>

                            <div className={styles.cardFooter}>
                                {(request.status === 'assigned' || request.status === 'in_progress') && (
                                    <>
                                        <button
                                            className={styles.btnRespond}
                                            onClick={() => handleOpenResponseModal(request)}
                                        >
                                            {request.doctor_response ? 'Cập nhật phản hồi' : 'Phản hồi'}
                                        </button>
                                        {request.doctor_response && (
                                            <button
                                                className={styles.btnResolve}
                                                onClick={() => handleMarkResolved(request.id)}
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
                <div className={styles.modalOverlay} onClick={() => setShowResponseModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Phản hồi Tư vấn</h2>
                            <button className={styles.closeBtn} onClick={() => setShowResponseModal(false)}>Đóng</button>
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
                                    onChange={(e) => setResponseText(e.target.value)}
                                    rows="8"
                                    placeholder="Nhập nội dung tư vấn/phản hồi cho bệnh nhân..."
                                />
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.btnCancel} onClick={() => setShowResponseModal(false)}>Hủy</button>
                            <button className={styles.btnSend} onClick={handleSubmitResponse} disabled={responding}>
                                {responding ? 'Đang gửi...' : 'Gửi phản hồi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
