const { Review, Patient, Doctor } = require('../Database/Entity');
const { Op } = require('sequelize');
const sequelize = require('../Database/DatabaseConnection');

// ✅ GET - Lấy đánh giá của bác sĩ

class DoctorReviewController {
        async getDoctorReviews(req, res) {
        try {
            const doctor_id = req.user.id;
            const { limit = 10, status } = req.query;

            console.log('📋 GET /api/doctor/reviews', { doctor_id, limit });

            let where = { doctor_id };
            if (status) {
                where.status = status;
            }

            // Lấy danh sách reviews
            const reviews = await Review.findAll({
                where,
                include: [
                    {
                        model: Patient,
                        as: 'patient',
                        attributes: ['id', 'full_name', 'phone']
                    }
                ],
                order: [['created_at', 'DESC']],
                limit: parseInt(limit)
            });

            // Tính rating trung bình
            const ratingStats = await Review.findOne({
                where: { doctor_id },
                attributes: [
                    [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
                ],
                raw: true
            });

            const avgRating = ratingStats?.avgRating ? parseFloat(ratingStats.avgRating).toFixed(1) : 0;
            const totalReviews = parseInt(ratingStats?.totalReviews || 0);

            console.log(`✅ Found ${reviews.length} reviews, avg rating: ${avgRating}`);
            res.json({
                success: true,
                data: reviews,
                stats: {
                    avgRating: parseFloat(avgRating),
                    totalReviews
                }
            });
        } catch (error) {
            console.error('❌ Error fetching doctor reviews:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    };

    // ✅ GET - Thống kê chi tiết rating
        async getDoctorRatingStats(req, res) {
        try {
            const doctor_id = req.user.id;

            console.log('📊 GET /api/doctor/rating-stats', { doctor_id });

            // Tổng quan
            const overallStats = await Review.findOne({
                where: { doctor_id },
                attributes: [
                    [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
                ],
                raw: true
            });

            // Phân bố rating (1-5 sao)
            const distribution = await Review.findAll({
                where: { doctor_id },
                attributes: [
                    'rating',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['rating'],
                raw: true
            });

            // Chuyển thành object dễ đọc
            const ratingDistribution = {};
            for (let i = 1; i <= 5; i++) {
                const found = distribution.find(d => d.rating === i);
                ratingDistribution[`star${i}`] = found ? parseInt(found.count) : 0;
            }

            const avgRating = overallStats?.avgRating ? parseFloat(overallStats.avgRating).toFixed(1) : 0;
            const totalReviews = parseInt(overallStats?.totalReviews || 0);

            console.log(`✅ Rating stats: avg ${avgRating}, total ${totalReviews}`);
            res.json({
                success: true,
                stats: {
                    avgRating: parseFloat(avgRating),
                    totalReviews,
                    distribution: ratingDistribution
                }
            });
        } catch (error) {
            console.error('❌ Error fetching rating stats:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    };

    // ✅ POST - Bác sĩ phản hồi đánh giá của bệnh nhân
        async replyToReview(req, res) {
        try {
            const doctor_id = req.user.id;
            const { review_id } = req.params;
            const { reply } = req.body;

            console.log('💬 POST /api/doctor/reviews/:id/reply', { doctor_id, review_id, reply });

            if (!reply || reply.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập nội dung phản hồi'
                });
            }

            // Tìm review
            const review = await Review.findOne({
                where: {
                    id: review_id,
                    doctor_id: doctor_id // Đảm bảo bác sĩ chỉ phản hồi đánh giá của mình
                }
            });

            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đánh giá này hoặc bạn không có quyền phản hồi'
                });
            }

            // Cập nhật phản hồi
            await review.update({
                doctor_reply: reply.trim(),
                replied_at: new Date()
            });

            console.log('✅ Doctor replied to review:', review_id);

            res.json({
                success: true,
                message: 'Phản hồi đánh giá thành công',
                data: review
            });
        } catch (error) {
            console.error('❌ Error replying to review:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    };

    // ✅ PUT - Bác sĩ sửa phản hồi
        async updateReply(req, res) {
        try {
            const doctor_id = req.user.id;
            const { review_id } = req.params;
            const { reply } = req.body;

            console.log('✏️ PUT /api/doctor/reviews/:id/reply', { doctor_id, review_id });

            const review = await Review.findOne({
                where: {
                    id: review_id,
                    doctor_id: doctor_id
                }
            });

            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đánh giá này'
                });
            }

            if (!review.doctor_reply) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn chưa phản hồi đánh giá này'
                });
            }

            await review.update({
                doctor_reply: reply.trim(),
                replied_at: new Date()
            });

            res.json({
                success: true,
                message: 'Cập nhật phản hồi thành công',
                data: review
            });
        } catch (error) {
            console.error('❌ Error updating reply:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    };

    // ✅ DELETE - Bác sĩ xóa phản hồi
        async deleteReply(req, res) {
        try {
            const doctor_id = req.user.id;
            const { review_id } = req.params;

            console.log('🗑️ DELETE /api/doctor/reviews/:id/reply', { doctor_id, review_id });

            const review = await Review.findOne({
                where: {
                    id: review_id,
                    doctor_id: doctor_id
                }
            });

            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đánh giá này'
                });
            }

            await review.update({
                doctor_reply: null,
                replied_at: null
            });

            res.json({
                success: true,
                message: 'Đã xóa phản hồi'
            });
        } catch (error) {
            console.error('❌ Error deleting reply:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    };

}

module.exports = new DoctorReviewController();



