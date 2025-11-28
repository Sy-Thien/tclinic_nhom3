const { Review, Patient, Doctor, Specialty, Booking } = require('../models');
const { Op } = require('sequelize');

// Patient - Tạo đánh giá sau khi khám
exports.createReview = async (req, res) => {
    try {
        const patient_id = req.user.id;
        const { booking_id, doctor_id, rating, comment } = req.body;

        console.log('📝 POST /api/reviews/create', { patient_id, booking_id, doctor_id, rating });

        // Validation
        if (!doctor_id || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn số sao đánh giá'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá phải từ 1 đến 5 sao'
            });
        }

        // Kiểm tra booking có tồn tại và đã hoàn thành không
        if (booking_id) {
            const booking = await Booking.findOne({
                where: {
                    id: booking_id,
                    patient_id,
                    status: 'completed'
                }
            });

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy lịch khám hoặc lịch khám chưa hoàn thành'
                });
            }

            // Kiểm tra đã đánh giá chưa
            const existingReview = await Review.findOne({
                where: {
                    patient_id,
                    doctor_id,
                    booking_id
                }
            });

            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn đã đánh giá lịch khám này rồi'
                });
            }
        }

        // Tạo review
        const review = await Review.create({
            patient_id,
            doctor_id,
            booking_id: booking_id || null,
            rating,
            comment: comment || ''
        });

        console.log('✅ Review created:', review.id);

        res.status(201).json({
            success: true,
            message: 'Cảm ơn bạn đã đánh giá!',
            data: review
        });

    } catch (error) {
        console.error('❌ Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Patient - Xem danh sách đánh giá của mình
exports.getMyReviews = async (req, res) => {
    try {
        const patient_id = req.user.id;

        const reviews = await Review.findAll({
            where: { patient_id },
            include: [
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name', 'education'],
                    include: [{
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['id', 'name']
                    }]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: reviews
        });

    } catch (error) {
        console.error('❌ Get my reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Public - Xem đánh giá của bác sĩ
exports.getDoctorReviews = async (req, res) => {
    try {
        const { doctor_id } = req.params;

        const reviews = await Review.findAll({
            where: { doctor_id },
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name'] // Không lộ thông tin nhạy cảm
                }
            ],
            order: [['created_at', 'DESC']],
            limit: 50
        });

        // Tính rating trung bình
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

        res.json({
            success: true,
            data: {
                reviews,
                summary: {
                    total: reviews.length,
                    average: parseFloat(avgRating)
                }
            }
        });

    } catch (error) {
        console.error('❌ Get doctor reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Patient - Cập nhật đánh giá
exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const patient_id = req.user.id;
        const { rating, comment } = req.body;

        const review = await Review.findOne({
            where: {
                id,
                patient_id
            }
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá phải từ 1 đến 5 sao'
            });
        }

        await review.update({
            rating: rating || review.rating,
            comment: comment !== undefined ? comment : review.comment,
            updated_at: new Date()
        });

        res.json({
            success: true,
            message: 'Cập nhật đánh giá thành công',
            data: review
        });

    } catch (error) {
        console.error('❌ Update review error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Patient - Xóa đánh giá
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const patient_id = req.user.id;

        const review = await Review.findOne({
            where: {
                id,
                patient_id
            }
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        await review.destroy();

        res.json({
            success: true,
            message: 'Xóa đánh giá thành công'
        });

    } catch (error) {
        console.error('❌ Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Kiểm tra booking có thể đánh giá không
exports.checkReviewEligibility = async (req, res) => {
    try {
        const patient_id = req.user.id;
        const { booking_id } = req.params;

        const booking = await Booking.findOne({
            where: {
                id: booking_id,
                patient_id,
                status: 'completed'
            }
        });

        if (!booking) {
            return res.json({
                success: true,
                eligible: false,
                message: 'Lịch khám chưa hoàn thành'
            });
        }

        // Kiểm tra đã đánh giá chưa
        const existingReview = await Review.findOne({
            where: {
                patient_id,
                doctor_id: booking.doctor_id,
                booking_id
            }
        });

        res.json({
            success: true,
            eligible: !existingReview,
            hasReview: !!existingReview,
            review: existingReview || null,
            message: existingReview ? 'Đã đánh giá' : 'Có thể đánh giá'
        });

    } catch (error) {
        console.error('❌ Check eligibility error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

module.exports = exports;
