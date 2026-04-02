import React, { Component } from 'react';
import api from '../../utils/api';
import styles from './Reviews.module.css';

class Reviews extends Component {
    constructor(props) {
        super(props);
        this.state = {
            myReviews: [],
            loading: true,
            showModal: false,
            selectedBooking: null,
            completedBookings: [],
            formData: {
                booking_id: '',
                doctor_id: '',
                rating: 5,
                comment: ''
            }
        };
    }

    componentDidMount() {
        this.loadData();
    }

    loadData = async () => {
        try {
            const reviewsRes = await api.get('/api/patient/reviews/my-reviews');
            const reviews = reviewsRes.data.data || [];

            const bookingsRes = await api.get('/api/patient/bookings/appointments');
            const bookings = (bookingsRes.data || []).filter(b => b.status === 'completed');

            const bookingsWithoutReview = bookings.filter(booking => {
                return !reviews.find(review => review.booking_id === booking.id);
            });

            this.setState({
                myReviews: reviews,
                completedBookings: bookingsWithoutReview
            });
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            this.setState({ loading: false });
        }
    };

    fetchMyReviews = async () => {
        try {
            const response = await api.get('/api/patient/reviews/my-reviews');
            this.setState({ myReviews: response.data.data || [] });
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    handleOpenModal = (booking) => {
        this.setState({
            selectedBooking: booking,
            formData: {
                booking_id: booking.id,
                doctor_id: booking.doctor_id,
                rating: 5,
                comment: ''
            },
            showModal: true
        });
    };

    handleCloseModal = () => {
        this.setState({
            showModal: false,
            selectedBooking: null,
            formData: { booking_id: '', doctor_id: '', rating: 5, comment: '' }
        });
    };

    handleRatingClick = (rating) => {
        this.setState(prevState => ({
            formData: { ...prevState.formData, rating }
        }));
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/patient/reviews/create', this.state.formData);
            alert('✅ Đánh giá thành công! Cảm ơn phản hồi của bạn');
            this.handleCloseModal();
            this.loadData();
        } catch (error) {
            console.error('Error creating review:', error);
            alert(error.response?.data?.message || 'Không thể gửi đánh giá');
        }
    };

    handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

        try {
            await api.delete(`/api/patient/reviews/${id}`);
            alert('✅ Đã xóa đánh giá');
            this.loadData();
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('Không thể xóa đánh giá');
        }
    };

    renderStars = (rating, interactive = false, onRatingClick = null) => {
        return (
            <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map(star => (
                    <span
                        key={star}
                        className={`${styles.star} ${star <= rating ? styles.filled : ''} ${interactive ? styles.interactive : ''}`}
                        onClick={() => interactive && onRatingClick && onRatingClick(star)}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };

    getStatusBadge = (status) => {
        const statusMap = {
            'pending': { text: 'Chờ duyệt', class: 'pending' },
            'approved': { text: 'Đã duyệt', class: 'approved' },
            'rejected': { text: 'Từ chối', class: 'rejected' }
        };
        const info = statusMap[status] || { text: status, class: 'default' };
        return <span className={`${styles.statusBadge} ${styles[info.class]}`}>{info.text}</span>;
    };

    render() {
        const { myReviews, loading, showModal, selectedBooking, completedBookings, formData } = this.state;

        if (loading) {
            return <div className={styles.loading}>Đang tải...</div>;
        }

        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>⭐ Đánh Giá Của Tôi</h1>
                    <p>Chia sẻ trải nghiệm và giúp bệnh nhân khác đưa ra lựa chọn tốt hơn</p>
                </div>

                {completedBookings.length > 0 && (
                    <div className={styles.section}>
                        <h2>📝 Lịch khám chưa đánh giá ({completedBookings.length})</h2>
                        <div className={styles.bookingGrid}>
                            {completedBookings.map(booking => (
                                <div key={booking.id} className={styles.bookingCard}>
                                    <div className={styles.bookingHeader}>
                                        <span className={styles.bookingCode}>#{booking.booking_code}</span>
                                        <span className={styles.bookingDate}>
                                            {new Date(booking.appointment_date).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    <div className={styles.bookingBody}>
                                        <div className={styles.doctorInfo}>
                                            <span className={styles.doctorName}>👨‍⚕️ {booking.doctor?.full_name}</span>
                                            <span className={styles.specialty}>{booking.specialty?.name}</span>
                                        </div>
                                    </div>
                                    <button
                                        className={styles.btnReview}
                                        onClick={() => this.handleOpenModal(booking)}
                                    >
                                        ⭐ Đánh giá ngay
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className={styles.section}>
                    <h2>💬 Đánh giá đã gửi ({myReviews.length})</h2>
                    {myReviews.length === 0 ? (
                        <div className={styles.empty}>
                            <p>Bạn chưa có đánh giá nào</p>
                            <p>Sau khi hoàn thành lịch khám, bạn có thể đánh giá bác sĩ</p>
                        </div>
                    ) : (
                        <div className={styles.reviewsList}>
                            {myReviews.map(review => (
                                <div key={review.id} className={styles.reviewCard}>
                                    <div className={styles.reviewHeader}>
                                        <div className={styles.doctorSection}>
                                            <h3>👨‍⚕️ {review.doctor?.full_name}</h3>
                                            <span className={styles.specialty}>{review.doctor?.specialty?.name}</span>
                                        </div>
                                        {this.getStatusBadge(review.status)}
                                    </div>

                                    <div className={styles.ratingSection}>
                                        {this.renderStars(review.rating)}
                                        <span className={styles.ratingText}>{review.rating}/5</span>
                                    </div>

                                    {review.comment && (
                                        <div className={styles.comment}>
                                            <p>"{review.comment}"</p>
                                        </div>
                                    )}

                                    {review.doctor_reply && (
                                        <div className={styles.doctorReply}>
                                            <div className={styles.replyHeader}>
                                                <span className={styles.replyIcon}>💬</span>
                                                <span className={styles.replyLabel}>Phản hồi từ bác sĩ:</span>
                                                {review.replied_at && (
                                                    <span className={styles.replyDate}>
                                                        {new Date(review.replied_at).toLocaleDateString('vi-VN')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={styles.replyText}>{review.doctor_reply}</p>
                                        </div>
                                    )}

                                    <div className={styles.reviewFooter}>
                                        <span className={styles.date}>
                                            📅 {new Date(review.created_at).toLocaleDateString('vi-VN')}
                                        </span>
                                        <button
                                            className={styles.btnDelete}
                                            onClick={() => this.handleDelete(review.id)}
                                        >
                                            🗑️ Xóa
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {showModal && selectedBooking && (
                    <div className={styles.modalOverlay} onClick={this.handleCloseModal}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>⭐ Đánh giá lịch khám</h2>
                                <button className={styles.btnClose} onClick={this.handleCloseModal}>×</button>
                            </div>

                            <div className={styles.modalBody}>
                                <div className={styles.bookingInfo}>
                                    <p><strong>Mã lịch:</strong> #{selectedBooking.booking_code}</p>
                                    <p><strong>Bác sĩ:</strong> {selectedBooking.doctor?.full_name}</p>
                                    <p><strong>Chuyên khoa:</strong> {selectedBooking.specialty?.name}</p>
                                    <p><strong>Ngày khám:</strong> {new Date(selectedBooking.appointment_date).toLocaleDateString('vi-VN')}</p>
                                </div>

                                <form onSubmit={this.handleSubmit}>
                                    <div className={styles.formGroup}>
                                        <label>Đánh giá của bạn *</label>
                                        <div className={styles.ratingInput}>
                                            {this.renderStars(formData.rating, true, this.handleRatingClick)}
                                            <span className={styles.ratingLabel}>
                                                {formData.rating === 5 && 'Xuất sắc!'}
                                                {formData.rating === 4 && 'Rất tốt'}
                                                {formData.rating === 3 && 'Tốt'}
                                                {formData.rating === 2 && 'Trung bình'}
                                                {formData.rating === 1 && 'Cần cải thiện'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Nhận xét (tùy chọn)</label>
                                        <textarea
                                            value={formData.comment}
                                            onChange={(e) => this.setState(prevState => ({
                                                formData: { ...prevState.formData, comment: e.target.value }
                                            }))}
                                            placeholder="Chia sẻ trải nghiệm của bạn với bác sĩ và dịch vụ..."
                                            rows={5}
                                        />
                                    </div>

                                    <div className={styles.modalFooter}>
                                        <button type="button" className={styles.btnCancel} onClick={this.handleCloseModal}>
                                            Hủy
                                        </button>
                                        <button type="submit" className={styles.btnSubmit}>
                                            ✨ Gửi đánh giá
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default Reviews;
