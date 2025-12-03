import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import styles from './MyConsultations.module.css';

export default function MyConsultations() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyRequests();
    }, []);

    const fetchMyRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/consultation-requests/my-requests');
            setRequests(response.data.data);
        } catch (error) {
            console.error('Error fetching my requests:', error);
            alert('Lỗi khi tải lịch sử yêu cầu!');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { text: 'Chờ xử lý', color: '#ff9800' },
            assigned: { text: 'Đang xử lý', color: '#2196f3' },
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
                color: 'white',
                display: 'inline-block'
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Lịch sử Yêu cầu Tư vấn</h1>
                <Link to="/contact" className={styles.btnNew}>
                    ➕ Gửi yêu cầu mới
                </Link>
            </div>

            {loading ? (
                <div className={styles.loading}>⏳ Đang tải...</div>
            ) : requests.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>📭</div>
                    <p>Bạn chưa có yêu cầu tư vấn nào</p>
                    <Link to="/contact" className={styles.btnEmptyAction}>
                        Gửi yêu cầu đầu tiên
                    </Link>
                </div>
            ) : (
                <div className={styles.requestsList}>
                    {requests.map(request => (
                        <div key={request.id} className={styles.requestCard}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3>{request.subject}</h3>
                                    <div className={styles.meta}>
                                        <span className={styles.category}>{getCategoryText(request.category)}</span>
                                        {request.specialty && (
                                            <span className={styles.specialty}>🏥 {request.specialty.name}</span>
                                        )}
                                    </div>
                                </div>
                                {getStatusBadge(request.status)}
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.message}>
                                    <strong>Nội dung yêu cầu:</strong>
                                    <p>{request.message}</p>
                                </div>

                                {request.assignedDoctor && (
                                    <div className={styles.doctorInfo}>
                                        <strong>Bác sĩ phụ trách:</strong>
                                        <p>{request.assignedDoctor.full_name}</p>
                                        {request.assignedDoctor.email && (
                                            <small>Email: {request.assignedDoctor.email}</small>
                                        )}
                                    </div>
                                )}

                                {request.doctor_response && (
                                    <div className={styles.response}>
                                        <strong>Phản hồi từ bác sĩ:</strong>
                                        <p>{request.doctor_response}</p>
                                        <small>Thời gian: {formatDate(request.responded_at)}</small>
                                    </div>
                                )}

                                <div className={styles.timestamps}>
                                    <small>Gửi lúc: {formatDate(request.created_at)}</small>
                                    {request.assigned_at && <small>Giao lúc: {formatDate(request.assigned_at)}</small>}
                                    {request.resolved_at && <small>Giải quyết: {formatDate(request.resolved_at)}</small>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
