import React, { Component } from 'react';
import PropTypes from 'prop-types';
import api from '../../utils/api';
import styles from './ReviewModal.module.css';

class ReviewModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            rating: 0,
            hoverRating: 0,
            comment: '',
            loading: false
        };
    }

    handleSubmit = async (e) => {
        e.preventDefault();
        const { appointment, onSuccess, onClose } = this.props;
        const { rating, comment } = this.state;

        if (rating === 0) {
            alert('Vui lòng chọn số sao đánh giá!');
            return;
        }

        this.setState({ loading: true });
        try {
            await api.post('/api/reviews/create', {
                booking_id: appointment.id,
                doctor_id: appointment.doctor_id,
                rating,
                comment
            });

            alert('✅ Cảm ơn bạn đã đánh giá!');
            onSuccess && onSuccess();
            onClose();
        } catch (error) {
            console.error('Error submitting review:', error);
            alert(error.response?.data?.message || '❌ Không thể gửi đánh giá!');
        } finally {
            this.setState({ loading: false });
        }
    };

    render() {
        const { appointment, onClose } = this.props;
        const { rating, hoverRating, comment, loading } = this.state;

        return (
            <div className={styles.modalOverlay} onClick={onClose}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h2>⭐ Đánh giá dịch vụ</h2>
                        <button className={styles.btnClose} onClick={onClose}>×</button>
                    </div>

                    <form onSubmit={this.handleSubmit}>
                        <div className={styles.modalBody}>
                            {/* Doctor Info */}
                            <div className={styles.doctorInfo}>
                                <p className={styles.label}>Bác sĩ:</p>
                                <p className={styles.doctorName}>{appointment.doctor_name || 'Không xác định'}</p>
                                <p className={styles.specialty}>{appointment.specialty_name}</p>
                            </div>

                            {/* Rating Stars */}
                            <div className={styles.ratingSection}>
                                <label className={styles.label}>Đánh giá của bạn:</label>
                                <div className={styles.stars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={`${styles.star} ${star <= (hoverRating || rating) ? styles.starActive : ''
                                                }`}
                                            onMouseEnter={() => this.setState({ hoverRating: star })}
                                            onMouseLeave={() => this.setState({ hoverRating: 0 })}
                                            onClick={() => this.setState({ rating: star })}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                                <p className={styles.ratingText}>
                                    {rating === 0 && 'Chọn số sao'}
                                    {rating === 1 && '😞 Không hài lòng'}
                                    {rating === 2 && '😐 Tạm được'}
                                    {rating === 3 && '🙂 Bình thường'}
                                    {rating === 4 && '😊 Hài lòng'}
                                    {rating === 5 && '😍 Rất hài lòng'}
                                </p>
                            </div>

                            {/* Comment */}
                            <div className={styles.commentSection}>
                                <label className={styles.label}>Nhận xét (tùy chọn):</label>
                                <textarea
                                    className={styles.textarea}
                                    value={comment}
                                    onChange={(e) => this.setState({ comment: e.target.value })}
                                    placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ khám chữa bệnh..."
                                    rows={5}
                                    maxLength={500}
                                />
                                <p className={styles.charCount}>{comment.length}/500 ký tự</p>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.btnCancel}
                                onClick={onClose}
                                disabled={loading}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                className={styles.btnSubmit}
                                disabled={loading || rating === 0}
                            >
                                {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
}

ReviewModal.propTypes = {
    appointment: PropTypes.shape({
        id: PropTypes.number.isRequired,
        doctor_id: PropTypes.number,
        doctor_name: PropTypes.string,
        specialty_name: PropTypes.string
    }).isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func
};

export default ReviewModal;
