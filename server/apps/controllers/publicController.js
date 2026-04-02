const { Doctor, Patient, Booking, Service, Specialty, Review, Drug, TimeSlot, Room } = require('../Database/Entity');
const { Op } = require('sequelize');
const sequelize = require('../Database/DatabaseConnection');

// GET - Thống kê tổng quan cho trang chủ

class PublicController {
    async getHomeStats(req, res) {
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
    async getFeaturedDoctors(req, res) {
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
    async getTestimonials(req, res) {
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
    async getPopularSpecialties(req, res) {
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
    async getSpecialtiesWithDoctors(req, res) {
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

            const TimeSlot = require('../Database/Entity').TimeSlot;

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

    // GET - Danh sách chuyên khoa
    async getSpecialties(req, res) {
        try {
            console.log('📋 GET /api/public/specialties');

            const specialties = await Specialty.findAll({
                attributes: ['id', 'name', 'description'],
                order: [['name', 'ASC']]
            });

            console.log(`✅ Found ${specialties.length} specialties`);
            res.json(specialties);
        } catch (error) {
            console.error('❌ Error fetching specialties:', error);
            res.status(500).json({
                message: 'Lỗi server',
                error: error.message
            });
        }
    }

    // GET - Danh sách dịch vụ
    async getServices(req, res) {
        try {
            const { specialty_id, search } = req.query;
            console.log(`📋 GET /api/public/services`, { specialty_id, search });

            let whereClause = {};
            if (specialty_id) {
                whereClause.specialty_id = specialty_id;
            }
            if (search) {
                whereClause.name = { [Op.like]: `%${search}%` };
            }

            const services = await Service.findAll({
                where: whereClause,
                include: [
                    {
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['id', 'name']
                    }
                ],
                attributes: ['id', 'name', 'description', 'price', 'duration', 'specialty_id'],
                order: [['name', 'ASC']]
            });

            console.log(`✅ Found ${services.length} services`);
            res.json(services);
        } catch (error) {
            console.error('❌ Error fetching services:', error);
            res.status(500).json({
                message: 'Lỗi server',
                error: error.message
            });
        }
    }

    // GET - Chi tiết dịch vụ
    async getServiceDetail(req, res) {
        try {
            const { id } = req.params;
            console.log(`📋 GET /api/public/services/${id}`);

            const service = await Service.findByPk(id, {
                include: [
                    {
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['id', 'name', 'description']
                    }
                ],
                attributes: ['id', 'name', 'description', 'price', 'duration', 'specialty_id']
            });

            if (!service) {
                return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
            }

            console.log(`✅ Found service: ${service.name}`);
            res.json(service);
        } catch (error) {
            console.error('❌ Error fetching service:', error);
            res.status(500).json({
                message: 'Lỗi server',
                error: error.message
            });
        }
    }

    // POST - Đặt lịch khám (public)
    async createBooking(req, res) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📥 POST /api/public/booking');
        console.log('Body:', req.body);

        try {
            const jwt = require('jsonwebtoken');
            const {
                name,
                email,
                phone,
                birthday,
                gender,
                address,
                service_id,
                appointment_date,
                appointment_time,
                symptoms
            } = req.body;

            // Lấy patient_id từ token (nếu có)
            const token = req.headers.authorization?.split(' ')[1];
            let patient_id = null;

            if (token) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                    console.log('🔓 Token decoded:', decoded);
                    if (decoded.role === 'patient') {
                        patient_id = decoded.id;
                    }
                } catch (error) {
                    console.log('⚠️ Token invalid:', error.message);
                }
            }

            // Validation
            if (!name || !phone || !service_id || !appointment_date || !appointment_time) {
                console.log('❌ Validation failed');
                return res.status(400).json({
                    message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
                });
            }

            // Validate ngày không được là quá khứ
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(appointment_date + 'T00:00:00');
            if (selectedDate < today) {
                console.log('❌ Past date selected');
                return res.status(400).json({
                    message: 'Không thể đặt lịch cho ngày trong quá khứ'
                });
            }

            console.log('✅ Validation passed');

            // Kiểm tra service tồn tại
            const service = await Service.findByPk(service_id, {
                include: [
                    {
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['name']
                    }
                ]
            });

            if (!service) {
                console.log('❌ Service not found');
                return res.status(404).json({
                    message: 'Dịch vụ không tồn tại'
                });
            }

            console.log('✅ Service found:', service.name);

            // Kiểm tra trùng lịch
            const existingBooking = await Booking.findOne({
                where: {
                    appointment_date: appointment_date,
                    appointment_time: appointment_time,
                    service_id: service_id,
                    status: { [Op.ne]: 'cancelled' }
                }
            });

            if (existingBooking) {
                console.log('❌ Time slot already booked');
                return res.status(400).json({
                    message: 'Khung giờ này đã có người đặt. Vui lòng chọn giờ khác.'
                });
            }

            console.log('✅ Time slot available');

            // Tạo booking
            const booking = await Booking.create({
                patient_id: patient_id,
                service_id: service_id,
                appointment_date: appointment_date,
                appointment_time: appointment_time,
                status: 'pending'
            });

            console.log('✅ Booking created:', booking.id);

            res.status(201).json({
                message: `Đặt lịch thành công!`,
                booking: {
                    id: booking.id,
                    appointment_date: booking.appointment_date,
                    appointment_time: booking.appointment_time,
                    service: service.name,
                    specialty: service.specialty?.name,
                    price: service.price,
                    status: booking.status
                }
            });

        } catch (error) {
            console.error('❌ Booking error:', error);
            console.error('Stack:', error.stack);

            res.status(500).json({
                message: 'Lỗi server. Vui lòng thử lại sau.',
                error: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    // GET - Danh sách bác sĩ
    async getDoctors(req, res) {
        try {
            const { specialty_id, search } = req.query;
            console.log('📋 GET /api/public/doctors', { specialty_id, search });

            let whereClause = { is_active: true };

            if (specialty_id) {
                whereClause.specialty_id = specialty_id;
            }

            if (search) {
                whereClause.full_name = { [Op.like]: `%${search}%` };
            }

            const doctors = await Doctor.findAll({
                where: whereClause,
                include: [
                    {
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['id', 'name']
                    }
                ],
                attributes: ['id', 'full_name', 'email', 'phone', 'description', 'avatar', 'experience', 'specialty_id'],
                order: [['full_name', 'ASC']]
            });

            const doctorsWithRating = doctors.map(doc => {
                const jsonDoc = doc.toJSON();
                return {
                    ...jsonDoc,
                    specialty_name: jsonDoc.specialty?.name || null,
                    experience_years: jsonDoc.experience || null,
                    bio: jsonDoc.description || null,
                    rating: doc.rating || 0
                };
            });

            console.log(`✅ Found ${doctorsWithRating.length} doctors`);
            res.json(doctorsWithRating);
        } catch (error) {
            console.error('❌ Error fetching doctors:', error);
            res.status(500).json({
                message: 'Lỗi server',
                error: error.message
            });
        }
    }

    // GET - Chi tiết bác sĩ
    async getDoctorDetail(req, res) {
        try {
            const { id } = req.params;
            console.log(`📋 GET /api/public/doctors/${id}`);

            const doctor = await Doctor.findByPk(id, {
                include: [
                    {
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['id', 'name', 'description']
                    }
                ],
                attributes: ['id', 'full_name', 'email', 'phone', 'description', 'avatar', 'experience', 'education', 'specialty_id']
            });

            if (!doctor) {
                return res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
            }

            const jsonDoc = doctor.toJSON();
            const doctorWithRating = {
                ...jsonDoc,
                specialty_name: jsonDoc.specialty?.name || null,
                experience_years: jsonDoc.experience || null,
                bio: jsonDoc.description || null,
                rating: doctor.rating || 0
            };

            console.log(`✅ Found doctor:`, doctor.full_name);
            res.json(doctorWithRating);
        } catch (error) {
            console.error('❌ Error fetching doctor:', error);
            res.status(500).json({
                message: 'Lỗi server',
                error: error.message
            });
        }
    }

    // GET - Lịch làm việc của bác sĩ (14 ngày tới)
    async getDoctorSchedule(req, res) {
        try {
            const { id } = req.params;
            console.log(`📋 GET /api/public/doctors/${id}/schedule`);

            const today = new Date().toISOString().split('T')[0];
            const twoWeeksLater = new Date();
            twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
            const endDate = twoWeeksLater.toISOString().split('T')[0];

            const timeSlots = await TimeSlot.findAll({
                where: {
                    doctor_id: id,
                    date: {
                        [Op.between]: [today, endDate]
                    },
                    is_available: true
                },
                include: [
                    {
                        model: Room,
                        as: 'room',
                        attributes: ['id', 'name', 'location'],
                        required: false
                    }
                ],
                order: [['date', 'ASC'], ['start_time', 'ASC']]
            });

            const scheduleData = timeSlots.map(slot => ({
                id: slot.id,
                work_date: slot.date,
                start_time: slot.start_time,
                end_time: slot.end_time,
                room_name: slot.room ? slot.room.name : null,
                room_location: slot.room ? slot.room.location : null,
                max_patients: slot.max_patients,
                current_patients: slot.current_patients,
                available_slots: slot.max_patients - slot.current_patients
            }));

            console.log(`✅ Found ${scheduleData.length} time slots for doctor ${id}`);
            res.json(scheduleData);
        } catch (error) {
            console.error('❌ Error fetching doctor schedule:', error);
            res.status(500).json({
                message: 'Lỗi server',
                error: error.message
            });
        }
    }

    // GET - Danh sách thuốc (public access cho doctor prescription)
    async getDrugs(req, res) {
        try {
            console.log('📋 GET /api/public/drugs');

            const drugs = await Drug.findAll({
                attributes: ['id', 'name', 'ingredient', 'unit', 'price', 'quantity'],
                where: {
                    quantity: { [Op.gt]: 0 }
                },
                order: [['name', 'ASC']]
            });

            console.log(`✅ Found ${drugs.length} drugs in stock`);
            res.json({ drugs });
        } catch (error) {
            console.error('❌ Error fetching drugs:', error);
            res.status(500).json({
                message: 'Lỗi server',
                error: error.message
            });
        }
    }
}

module.exports = new PublicController();



