const { Doctor, Patient, Booking, Service, Specialty, Review } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// GET - Thống kê tổng quan cho trang chủ
exports.getHomeStats = async (req, res) => {
    try {
        console.log('📊 GET /api/public/home-stats');

        // Đếm số bác sĩ đang hoạt động
        const totalDoctors = await Doctor.count({
            where: { is_active: true }
        });

        // Đếm tổng số bệnh nhân
        const totalPatients = await Patient.count();

        // Đếm tổng số lịch hẹn đã hoàn thành
        const completedAppointments = await Booking.count({
            where: { status: 'completed' }
        });

        // Đếm số dịch vụ
        const totalServices = await Service.count();

        // Đếm số chuyên khoa
        const totalSpecialties = await Specialty.count();

        console.log('✅ Stats:', {
            totalDoctors,
            totalPatients,
            completedAppointments,
            totalServices,
            totalSpecialties
        });

        res.json({
            success: true,
            data: {
                totalDoctors,
                totalPatients,
                completedAppointments,
                totalServices,
                totalSpecialties,
                yearsOfExperience: 10 // Cứng, có thể tính từ ngày thành lập
            }
        });
    } catch (error) {
        console.error('❌ Error fetching home stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// GET - Danh sách bác sĩ nổi bật (nhiều lượt khám + đánh giá tốt)
exports.getFeaturedDoctors = async (req, res) => {
    try {
        const { limit = 6 } = req.query;
        console.log('👨‍⚕️ GET /api/public/featured-doctors', { limit });

        // Lấy tất cả bác sĩ active với số lượt khám hoàn thành
        const doctors = await Doctor.findAll({
            where: { is_active: true },
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                },
                {
                    model: Booking,
                    as: 'bookings',
                    attributes: [],
                    where: { status: 'completed' },
                    required: false
                }
            ],
            attributes: [
                'id',
                'full_name',
                'email',
                'phone',
                'description',
                'avatar',
                'experience',
                'education',
                'specialty_id',
                [sequelize.fn('COUNT', sequelize.col('bookings.id')), 'completedBookings']
            ],
            group: ['Doctor.id'],
            subQuery: false
        });

        // Lấy rating trung bình của từng bác sĩ từ bảng reviews
        const doctorIds = doctors.map(d => d.id);
        const reviews = await Review.findAll({
            where: { doctor_id: { [Op.in]: doctorIds } },
            attributes: [
                'doctor_id',
                [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount']
            ],
            group: ['doctor_id']
        });

        // Map rating theo doctor_id
        const ratingMap = {};
        reviews.forEach(r => {
            const json = r.toJSON();
            ratingMap[json.doctor_id] = {
                avgRating: parseFloat(json.avgRating) || 0,
                reviewCount: parseInt(json.reviewCount) || 0
            };
        });

        // Format và tính điểm nổi bật (số lượt khám * 0.4 + rating * 0.6)
        const formattedDoctors = doctors.map(doc => {
            const jsonDoc = doc.toJSON();
            const completedBookings = parseInt(jsonDoc.completedBookings) || 0;
            const ratingData = ratingMap[jsonDoc.id] || { avgRating: 0, reviewCount: 0 };

            // Điểm nổi bật: kết hợp số lượt khám và rating
            // Normalize: bookings / 10 (max 10 điểm) + rating (max 5 điểm) * 2
            const featuredScore = (Math.min(completedBookings, 100) / 10) + (ratingData.avgRating * 2);

            return {
                id: jsonDoc.id,
                full_name: jsonDoc.full_name,
                email: jsonDoc.email,
                phone: jsonDoc.phone,
                description: jsonDoc.description,
                avatar: jsonDoc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(jsonDoc.full_name || 'Doctor')}&background=45c3d2&color=fff&size=200`,
                experience: jsonDoc.experience,
                education: jsonDoc.education,
                specialty_id: jsonDoc.specialty_id,
                specialty_name: jsonDoc.specialty?.name || null,
                completed_bookings: completedBookings,
                avg_rating: ratingData.avgRating.toFixed(1),
                review_count: ratingData.reviewCount,
                featured_score: featuredScore
            };
        });

        // Sắp xếp theo điểm nổi bật giảm dần
        formattedDoctors.sort((a, b) => b.featured_score - a.featured_score);

        // Lấy top N bác sĩ
        const topDoctors = formattedDoctors.slice(0, parseInt(limit));

        console.log(`✅ Found ${topDoctors.length} featured doctors (sorted by bookings + rating)`);
        res.json({
            success: true,
            data: topDoctors
        });
    } catch (error) {
        console.error('❌ Error fetching featured doctors:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// GET - Testimonials/Reviews từ bệnh nhân
exports.getTestimonials = async (req, res) => {
    try {
        const { limit = 6 } = req.query;
        console.log('💬 GET /api/public/testimonials', { limit });

        // Nếu bảng tn_reviews chưa có, trả về mảng rỗng để không chặn trang chủ
        if (!Review || !Review.findAll) {
            console.warn('⚠️ Review model not available. Returning empty testimonials.');
            return res.json({ success: true, data: [] });
        }

        const reviews = await Review.findAll({
            where: {
                rating: { [Op.gte]: 4 } // Chỉ lấy đánh giá >= 4 sao
            },
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name']
                },
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name'],
                    include: [
                        {
                            model: Specialty,
                            as: 'specialty',
                            attributes: ['name']
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit)
        });

        const formattedReviews = reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            patient_name: review.patient?.full_name || 'Bệnh nhân',
            doctor_name: review.doctor?.full_name || null,
            specialty: review.doctor?.specialty?.name || null,
            created_at: review.created_at
        }));

        console.log(`✅ Found ${formattedReviews.length} testimonials`);
        res.json({
            success: true,
            data: formattedReviews
        });
    } catch (error) {
        console.error('❌ Error fetching testimonials:', error);
        // Nếu lỗi do bảng chưa tồn tại hoặc column/association chưa sẵn sàng
        const isMissingTable =
            error?.original?.code === 'ER_NO_SUCH_TABLE' ||
            /tn_reviews/i.test(error?.message || '') ||
            /doesn\'t exist/i.test(error?.message || '');

        if (isMissingTable) {
            console.warn('⚠️ tn_reviews table missing. Returning empty testimonials.');
            return res.json({ success: true, data: [] });
        }

        // Các lỗi khác vẫn trả về 200 với mảng rỗng để không làm vỡ trang chủ
        return res.json({ success: true, data: [] });
    }
};

// GET - Các chuyên khoa phổ biến (có nhiều booking nhất)
exports.getPopularSpecialties = async (req, res) => {
    try {
        const { limit = 6 } = req.query;
        console.log('🏥 GET /api/public/popular-specialties', { limit });

        const specialties = await Specialty.findAll({
            include: [
                {
                    model: Doctor,
                    as: 'doctors',
                    attributes: [],
                    include: [
                        {
                            model: Booking,
                            as: 'bookings',
                            attributes: [],
                            required: false
                        }
                    ],
                    required: false
                }
            ],
            attributes: [
                'id',
                'name',
                'description',
                [sequelize.fn('COUNT', sequelize.col('doctors.bookings.id')), 'bookingCount']
            ],
            group: ['Specialty.id'],
            order: [[sequelize.literal('bookingCount'), 'DESC']],
            limit: parseInt(limit),
            subQuery: false
        });

        const formattedSpecialties = specialties.map(spec => {
            const jsonSpec = spec.toJSON();
            return {
                id: jsonSpec.id,
                name: jsonSpec.name,
                description: jsonSpec.description,
                booking_count: parseInt(jsonSpec.bookingCount) || 0
            };
        });

        console.log(`✅ Found ${formattedSpecialties.length} popular specialties`);
        res.json({
            success: true,
            data: formattedSpecialties
        });
    } catch (error) {
        console.error('❌ Error fetching popular specialties:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// GET - Chuyên khoa với danh sách bác sĩ và lịch khám (giống BookingCare)
exports.getSpecialtiesWithDoctors = async (req, res) => {
    try {
        const { limit = 4 } = req.query;
        console.log('🏥 GET /api/public/specialties-with-doctors', { limit });

        // Lấy chuyên khoa phổ biến
        const specialties = await Specialty.findAll({
            attributes: ['id', 'name', 'description'],
            include: [
                {
                    model: Doctor,
                    as: 'doctors',
                    where: { is_active: true },
                    required: false,
                    attributes: ['id', 'full_name', 'avatar', 'experience', 'education', 'description'],
                    limit: 3 // Tối đa 3 bác sĩ mỗi chuyên khoa
                }
            ],
            limit: parseInt(limit)
        });

        // Lấy lịch khám cho từng bác sĩ (7 ngày tới)
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const TimeSlot = require('../models').TimeSlot;

        const formattedSpecialties = await Promise.all(specialties.map(async (spec) => {
            const jsonSpec = spec.toJSON();

            // Lấy lịch khám cho các bác sĩ trong chuyên khoa này
            const doctorsWithSchedule = await Promise.all((jsonSpec.doctors || []).map(async (doc) => {
                // Lấy time slots của bác sĩ trong 7 ngày tới
                const slots = await TimeSlot.findAll({
                    where: {
                        doctor_id: doc.id,
                        date: {
                            [require('sequelize').Op.between]: [
                                today.toISOString().split('T')[0],
                                nextWeek.toISOString().split('T')[0]
                            ]
                        },
                        is_available: true
                    },
                    attributes: ['id', 'date', 'start_time', 'end_time', 'max_patients', 'current_patients'],
                    order: [['date', 'ASC'], ['start_time', 'ASC']],
                    limit: 10
                });

                // Nhóm theo ngày
                const scheduleByDate = {};
                slots.forEach(slot => {
                    const dateKey = slot.date;
                    if (!scheduleByDate[dateKey]) {
                        scheduleByDate[dateKey] = [];
                    }
                    if (slot.current_patients < slot.max_patients) {
                        scheduleByDate[dateKey].push({
                            id: slot.id,
                            time: `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`,
                            available: slot.max_patients - slot.current_patients
                        });
                    }
                });

                return {
                    id: doc.id,
                    full_name: doc.full_name,
                    avatar: doc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.full_name)}&background=667eea&color=fff&size=200`,
                    experience: doc.experience,
                    education: doc.education,
                    description: doc.description ? doc.description.substring(0, 150) + '...' : null,
                    schedule: scheduleByDate
                };
            }));

            return {
                id: jsonSpec.id,
                name: jsonSpec.name,
                description: jsonSpec.description,
                doctors: doctorsWithSchedule
            };
        }));

        console.log(`✅ Found ${formattedSpecialties.length} specialties with doctors`);
        res.json({
            success: true,
            data: formattedSpecialties
        });
    } catch (error) {
        console.error('❌ Error fetching specialties with doctors:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

module.exports = exports;
