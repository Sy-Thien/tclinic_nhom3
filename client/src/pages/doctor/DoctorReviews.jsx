import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './DoctorReviews.module.css';

export default function DoctorReviews() {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ avgRating: 0, totalReviews: 0, distribution: {} });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, replied, not_replied
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reviewsRes, statsRes] = await Promise.all([
                api.get('/api/doctor/reviews?limit=100'),
                api.get('/api/doctor/rating-stats')
            ]);

            if (reviewsRes.data.success) {
                setReviews(reviewsRes.data.data || []);
            }
            if (statsRes.data.success) {
                setStats(statsRes.data.stats || { avgRating: 0, totalReviews: 0, distribution: {} });
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredReviews = reviews.filter(review => {
        if (filter === 'replied') return review.doctor_reply;
        if (filter === 'not_replied') return !review.doctor_reply;
        return true;
    });

    const handleOpenReply = (review) => {
        setReplyingTo(review);
        setReplyText(review.doctor_reply || '');
    };

    const handleSubmitReply = async () => {
        if (!replyText.trim()) {
            alert('Vui lòng nhập nội dung phản hồi');
            return;
        }

        try {
            setSubmitting(true);
            const isEdit = replyingTo.doctor_reply;

            if (isEdit) {
                await api.put(`/api/doctor/reviews/${replyingTo.id}/reply`, { reply: replyText });
            } else {
                await api.post(`/api/doctor/reviews/${replyingTo.id}/reply`, { reply: replyText });
            }

            alert(isEdit ? '✅ Cập nhật phản hồi thành công!' : '✅ Phản hồi thành công!');
            setReplyingTo(null);
            setReplyText('');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReply = async (reviewId) => {
        if (!window.confirm('Bạn có chắc muốn xóa phản hồi này?')) return;

        try {
            await api.delete(`/api/doctor/reviews/${reviewId}/reply`);
            alert('✅ Đã xóa phản hồi');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const renderStars = (rating) => {
        return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRatingEmoji = (rating) => {
        const emojis = { 1: '😞', 2: '😕', 3: '😐', 4: '😊', 5: '😍' };
        return emojis[rating] || '';
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải đánh giá...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1>⭐ Đánh giá từ Bệnh nhân</h1>
                    <p>Xem và phản hồi đánh giá của bệnh nhân về dịch vụ khám chữa bệnh</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>⭐</div>
                    <div className={styles.statContent}>
                        <h3>{stats.avgRating.toFixed(1)}</h3>
                        <p>Điểm trung bình</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>📝</div>
                    <div className={styles.statContent}>
                        <h3>{stats.totalReviews}</h3>
                        <p>Tổng đánh giá</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>💬</div>
                    <div className={styles.statContent}>
                        <h3>{reviews.filter(r => r.doctor_reply).length}</h3>
                        <p>Đã phản hồi</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>⏳</div>
                    <div className={styles.statContent}>
                        <h3>{reviews.filter(r => !r.doctor_reply).length}</h3>
                        <p>Chưa phản hồi</p>
                    </div>
                </div>
            </div>

            {/* Rating Distribution */}
            <div className={styles.distributionCard}>
                <h3>📊 Phân bố đánh giá</h3>
                <div className={styles.distribution}>
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = stats.distribution?.[`star${star}`] || 0;
                        const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews * 100) : 0;
                        return (
                            <div key={star} className={styles.distRow}>
                                <span className={styles.distLabel}>{star} ⭐</span>
                                <div className={styles.distBar}>
                                    <div
                                        className={styles.distFill}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <span className={styles.distCount}>{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filter */}
            <div className={styles.filterBar}>
                <button
                    className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Tất cả ({reviews.length})
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'not_replied' ? styles.active : ''}`}
                    onClick={() => setFilter('not_replied')}
                >
                    Chưa phản hồi ({reviews.filter(r => !r.doctor_reply).length})
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'replied' ? styles.active : ''}`}
                    onClick={() => setFilter('replied')}
                >
                    Đã phản hồi ({reviews.filter(r => r.doctor_reply).length})
                </button>
            </div>

            {/* Reviews List */}
            <div className={styles.reviewsList}>
                {filteredReviews.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>📭</span>
                        <p>Chưa có đánh giá nào</p>
                    </div>
                ) : (
                    filteredReviews.map(review => (
                        <div key={review.id} className={styles.reviewCard}>
                            <div className={styles.reviewHeader}>
                                <div className={styles.patientInfo}>
                                    <div className={styles.avatar}>
                                        {review.patient?.full_name?.charAt(0) || 'B'}
                                    </div>
                                    <div>
                                        <h4>{review.patient?.full_name || 'Bệnh nhân'}</h4>
                                        <p className={styles.reviewDate}>{formatDate(review.created_at)}</p>
                                    </div>
                                </div>
                                <div className={styles.rating}>
                                    <span className={styles.stars}>{renderStars(review.rating)}</span>
                                    <span className={styles.emoji}>{getRatingEmoji(review.rating)}</span>
                                </div>
                            </div>

                            {review.comment && (
                                <div className={styles.reviewContent}>
                                    <p>"{review.comment}"</p>
                                </div>
                            )}

                            {/* Doctor Reply */}
                            {review.doctor_reply ? (
                                <div className={styles.replyBox}>
                                    <div className={styles.replyHeader}>
                                        <span className={styles.replyLabel}>💬 Phản hồi của bạn:</span>
                                        <span className={styles.replyDate}>{formatDate(review.replied_at)}</span>
                                    </div>
                                    <p className={styles.replyText}>{review.doctor_reply}</p>
                                    <div className={styles.replyActions}>
                                        <button
                                            className={styles.btnEdit}
                                            onClick={() => handleOpenReply(review)}
                                        >
                                            ✏️ Sửa
                                        </button>
                                        <button
                                            className={styles.btnDelete}
                                            onClick={() => handleDeleteReply(review.id)}
                                        >
                                            🗑️ Xóa
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    className={styles.btnReply}
                                    onClick={() => handleOpenReply(review)}
                                >
                                    💬 Phản hồi đánh giá
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Reply Modal */}
            {replyingTo && (
                <div className={styles.modalOverlay} onClick={() => setReplyingTo(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{replyingTo.doctor_reply ? '✏️ Sửa phản hồi' : '💬 Phản hồi đánh giá'}</h2>
                            <button className={styles.btnClose} onClick={() => setReplyingTo(null)}>×</button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Original Review */}
                            <div className={styles.originalReview}>
                                <div className={styles.reviewMini}>
                                    <strong>{replyingTo.patient?.full_name || 'Bệnh nhân'}</strong>
                                    <span>{renderStars(replyingTo.rating)}</span>
                                </div>
                                {replyingTo.comment && (
                                    <p className={styles.originalComment}>"{replyingTo.comment}"</p>
                                )}
                            </div>

                            {/* Reply Input */}
                            <div className={styles.replyInput}>
                                <label>Nội dung phản hồi:</label>
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Cảm ơn bạn đã tin tưởng và đánh giá dịch vụ của chúng tôi..."
                                    rows={5}
                                    maxLength={500}
                                />
                                <p className={styles.charCount}>{replyText.length}/500 ký tự</p>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={styles.btnCancel}
                                onClick={() => setReplyingTo(null)}
                                disabled={submitting}
                            >
                                Hủy
                            </button>
                            <button
                                className={styles.btnSubmit}
                                onClick={handleSubmitReply}
                                disabled={submitting || !replyText.trim()}
                            >
                                {submitting ? 'Đang gửi...' : (replyingTo.doctor_reply ? 'Cập nhật' : 'Gửi phản hồi')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
