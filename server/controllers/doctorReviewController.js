const { Review, Patient, Doctor } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// ✅ GET - Lấy đánh giá của bác sĩ
exports.getDoctorReviews = async (req, res) => {
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
exports.getDoctorRatingStats = async (req, res) => {
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

module.exports = exports;
