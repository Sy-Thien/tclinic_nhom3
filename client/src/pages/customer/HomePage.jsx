import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './HomePage.module.css';

export default function HomePage() {
    const [specialties, setSpecialties] = useState([]); // popular specialties for section
    const [specialtiesWithDoctors, setSpecialtiesWithDoctors] = useState([]); // chuyên khoa kèm bác sĩ + lịch khám
    const [allSpecialties, setAllSpecialties] = useState([]); // for hero/quick booking selects
    const [doctors, setDoctors] = useState([]);
    const [heroDoctors, setHeroDoctors] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [services, setServices] = useState([]);
    const [stats, setStats] = useState({
        totalDoctors: 0,
        totalPatients: 0,
        completedAppointments: 0,
        totalServices: 0,
        yearsOfExperience: 10
    });
    // Hero quick search form state
    const [symptomText, setSymptomText] = useState('');
    const [heroSpecialty, setHeroSpecialty] = useState('');
    const [heroDoctor, setHeroDoctor] = useState('');
    const [heroDate, setHeroDate] = useState('');

    // Quick Booking widget state
    const [qbSpecialty, setQbSpecialty] = useState('');
    const [qbDoctor, setQbDoctor] = useState('');
    const [qbDate, setQbDate] = useState('');
    const [qbDoctors, setQbDoctors] = useState([]);
    const [qbSlots, setQbSlots] = useState([]);

    // Selected date per doctor for schedule display
    const [selectedDoctorDates, setSelectedDoctorDates] = useState({});

    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Load tất cả dữ liệu song song
            const [statsRes, specialtiesRes, doctorsRes, testimonialsRes, allSpecialtiesRes, servicesRes, specialtiesWithDoctorsRes] = await Promise.all([
                api.get('/api/public/home-stats'),
                api.get('/api/public/popular-specialties?limit=6'),
                api.get('/api/public/featured-doctors?limit=4'),
                api.get('/api/public/testimonials?limit=6'),
                api.get('/api/public/specialties'),
                api.get('/api/public/services'),
                api.get('/api/public/specialties-with-doctors?limit=4')
            ]);

            // Set stats
            if (statsRes.data.success) {
                setStats(statsRes.data.data);
            }

            // Set specialties
            if (specialtiesRes.data.success) {
                setSpecialties(specialtiesRes.data.data);
            }
            // Set all specialties for selects
            if (Array.isArray(allSpecialtiesRes.data)) {
                setAllSpecialties(allSpecialtiesRes.data);
            }

            // Set doctors
            if (doctorsRes.data.success) {
                setDoctors(doctorsRes.data.data);
            }

            // Set testimonials
            if (testimonialsRes.data.success) {
                setTestimonials(testimonialsRes.data.data);
            }

            // Set services (public route returns raw array)
            if (Array.isArray(servicesRes.data)) {
                // Lấy 8 dịch vụ phổ biến
                setServices(servicesRes.data.slice(0, 8));
            }

            // Set specialties with doctors
            if (specialtiesWithDoctorsRes.data.success) {
                setSpecialtiesWithDoctors(specialtiesWithDoctorsRes.data.data);
            }

            console.log('✅ Home data loaded:', {
                stats: statsRes.data.data,
                specialties: specialtiesRes.data.data.length,
                doctors: doctorsRes.data.data.length,
                testimonials: testimonialsRes.data.data.length,
                allSpecialties: Array.isArray(allSpecialtiesRes.data) ? allSpecialtiesRes.data.length : 0,
                specialtiesWithDoctors: specialtiesWithDoctorsRes.data.data?.length || 0
            });
        } catch (error) {
            console.error('❌ Error fetching home data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load doctors when hero specialty changes
    useEffect(() => {
        const loadHeroDoctors = async () => {
            if (!heroSpecialty) {
                setHeroDoctors([]);
                return;
            }
            try {
                const res = await api.get('/api/public/doctors', { params: { specialty_id: heroSpecialty } });
                setHeroDoctors(res.data || []);
            } catch (e) {
                console.error('Error loading hero doctors:', e);
                setHeroDoctors([]);
            }
        };
        loadHeroDoctors();
    }, [heroSpecialty]);

    // Load doctors for Quick Booking when specialty changes
    useEffect(() => {
        const loadQbDoctors = async () => {
            if (!qbSpecialty) {
                setQbDoctors([]);
                setQbDoctor('');
                return;
            }
            try {
                const res = await api.get('/api/public/doctors', { params: { specialty_id: qbSpecialty } });
                setQbDoctors(res.data || []);
                setQbDoctor('');
            } catch (e) {
                console.error('Error loading quick booking doctors:', e);
                setQbDoctors([]);
            }
        };
        loadQbDoctors();
    }, [qbSpecialty]);

    // Load slots for Quick Booking when doctor/date changes
    useEffect(() => {
        const loadSlots = async () => {
            if (!qbDoctor || !qbDate) {
                setQbSlots([]);
                return;
            }
            try {
                const res = await api.get(`/api/public/doctors/${qbDoctor}/schedule`);
                const allSlots = Array.isArray(res.data) ? res.data : [];
                const slotsForDate = allSlots.filter(s => s.work_date === qbDate && s.available_slots > 0)
                    .map(s => ({
                        id: s.id,
                        start: s.start_time,
                        end: s.end_time
                    }));
                setQbSlots(slotsForDate.slice(0, 6));
            } catch (e) {
                console.error('Error loading quick booking slots:', e);
                setQbSlots([]);
            }
        };
        loadSlots();
    }, [qbDoctor, qbDate]);

    // Map specialty id to icon
    const getSpecialtyIcon = (specialtyId) => {
        const icons = {
            1: '💊', // Nội khoa
            2: '🔪', // Ngoại khoa
            3: '🤰', // Sản phụ khoa
            4: '👶', // Nhi khoa
            5: '❤️', // Tim mạch
            6: '🧠', // Thần kinh
            7: '🫁', // Tiêu hóa
            8: '😮‍💨', // Hô hấp
            9: '👂', // Tai mũi họng
            10: '👁️', // Mắt
            11: '🧴', // Da liễu
            12: '🦷', // Răng hàm mặt
            13: '🦴', // Chấn thương chỉnh hình
            14: '🎗️', // Ung bướu
            15: '🧘', // Tâm thần
        };
        return icons[specialtyId] || '💡';
    };

    const features = [
        {
            icon: '🏥',
            title: 'Đội ngũ bác sĩ chuyên môn cao',
            description: 'Bác sĩ giàu kinh nghiệm, tận tâm với bệnh nhân'
        },
        {
            icon: '⏰',
            title: 'Đặt lịch nhanh chóng',
            description: 'Đặt lịch khám online chỉ trong vài phút'
        },
        {
            icon: '💊',
            title: 'Dịch vụ đa dạng',
            description: 'Đầy đủ các chuyên khoa từ A-Z'
        },
        {
            icon: '📱',
            title: 'Theo dõi lịch hẹn',
            description: 'Quản lý lịch khám dễ dàng trên điện thoại'
        }
    ];

    const steps = [
        {
            number: '1',
            title: 'Chọn chuyên khoa',
            description: 'Lựa chọn chuyên khoa phù hợp với triệu chứng'
        },
        {
            number: '2',
            title: 'Chọn bác sĩ & giờ khám',
            description: 'Chọn bác sĩ và thời gian phù hợp'
        },
        {
            number: '3',
            title: 'Xác nhận thông tin',
            description: 'Điền thông tin cá nhân và xác nhận'
        },
        {
            number: '4',
            title: 'Nhận xác nhận',
            description: 'Nhận email xác nhận và đến khám đúng giờ'
        }
    ];

    const renderStars = (rating) => {
        return (
            <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map(star => (
                    <i
                        key={star}
                        className={star <= rating ? 'fas fa-star' : 'far fa-star'}
                        style={{ color: star <= rating ? '#ffc107' : '#ddd' }}
                    ></i>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className={styles.homePage}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.heroText}>
                        <h1 className={styles.heroTitle}>
                            Chăm sóc sức khỏe <br />
                            <span className={styles.highlight}>Chuyên nghiệp & Tận tâm</span>
                        </h1>
                        <p className={styles.heroSubtitle}>
                            Đặt lịch khám bệnh online nhanh chóng, tiện lợi với đội ngũ bác sĩ giàu kinh nghiệm
                        </p>
                        <div className={styles.heroSearch}>
                            <input
                                type="text"
                                placeholder="Triệu chứng của bạn (ho, sốt, đau họng...)"
                                value={symptomText}
                                onChange={(e) => setSymptomText(e.target.value)}
                            />
                            <select value={heroSpecialty} onChange={(e) => setHeroSpecialty(e.target.value)}>
                                <option value="">Chọn chuyên khoa</option>
                                {allSpecialties.map(sp => (
                                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                                ))}
                            </select>
                            <select
                                value={heroDoctor}
                                onChange={(e) => setHeroDoctor(e.target.value)}
                                disabled={!heroSpecialty || heroDoctors.length === 0}
                            >
                                <option value="">Bác sĩ (tuỳ chọn)</option>
                                {heroDoctors.map(d => (
                                    <option key={d.id} value={d.id}>{d.full_name}</option>
                                ))}
                            </select>
                            <input
                                type="date"
                                value={heroDate}
                                onChange={(e) => setHeroDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                            <button
                                className={styles.btnPrimary}
                                onClick={() => {
                                    if (!heroSpecialty) {
                                        alert('Vui lòng chọn chuyên khoa');
                                        return;
                                    }
                                    const params = new URLSearchParams();
                                    params.set('specialty', heroSpecialty);
                                    if (heroDoctor) params.set('doctor', heroDoctor);
                                    if (heroDate) params.set('date', heroDate);
                                    if (symptomText) params.set('symptoms', symptomText);
                                    navigate(`/booking?${params.toString()}`);
                                }}
                            >
                                Tìm & đặt lịch
                            </button>
                        </div>
                        <div className={styles.heroButtons}>
                            <button className={styles.btnSecondary} onClick={() => navigate('/doctors')}>Xem bác sĩ</button>
                            <button className={styles.btnSecondary} onClick={() => navigate('/services')}>Xem dịch vụ</button>
                        </div>
                    </div>
                    <div className={styles.heroImage}>
                        <img
                            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600"
                            alt="Bác sĩ"
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className={styles.stats}>
                <div className={styles.container}>
                    <div className={styles.statGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>👨‍⚕️</div>
                            <div className={styles.statValue}>{stats.totalDoctors}+</div>
                            <div className={styles.statLabel}>Bác sĩ giàu kinh nghiệm</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>😊</div>
                            <div className={styles.statValue}>{stats.totalPatients.toLocaleString()}+</div>
                            <div className={styles.statLabel}>Bệnh nhân hài lòng</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>🏆</div>
                            <div className={styles.statValue}>{stats.yearsOfExperience}+</div>
                            <div className={styles.statLabel}>Năm kinh nghiệm</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>💊</div>
                            <div className={styles.statValue}>{stats.totalServices}+</div>
                            <div className={styles.statLabel}>Dịch vụ y tế</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className={styles.features}>
                <div className={styles.container}>
                    <h2 className={styles.sectionTitle}>Tại sao chọn chúng tôi?</h2>
                    <div className={styles.featureGrid}>
                        {features.map((feature, index) => (
                            <div key={index} className={styles.featureCard}>
                                <div className={styles.featureIcon}>{feature.icon}</div>
                                <h3 className={styles.featureTitle}>{feature.title}</h3>
                                <p className={styles.featureDesc}>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Section */}
            {services.length > 0 && (
                <section className={styles.services}>
                    <div className={styles.container}>
                        <h2 className={styles.sectionTitle}>Dịch vụ nổi bật</h2>
                        <p className={styles.sectionSubtitle}>Các dịch vụ được lựa chọn nhiều nhất</p>
                        <div className={styles.serviceGrid}>
                            {services.map((svc) => (
                                <div
                                    key={svc.id}
                                    className={styles.serviceCard}
                                    onClick={() => navigate(`/services/${svc.id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className={styles.serviceIcon}>{getSpecialtyIcon(svc.specialty_id)}</div>
                                    <h3 className={styles.serviceName}>{svc.name}</h3>
                                    <p className={styles.serviceDesc}>{svc.description || 'Dịch vụ chất lượng, quy trình nhanh gọn'}</p>
                                    <div className={styles.serviceMeta}>
                                        {svc.price != null && <span>💵 {Number(svc.price).toLocaleString()}đ</span>}
                                        {svc.duration && <span>⏱️ {svc.duration} phút</span>}
                                    </div>
                                    <button
                                        className={styles.serviceBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/services/${svc.id}`);
                                        }}
                                    >
                                        👨‍⚕️ Xem bác sĩ & Đặt lịch
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className={styles.sectionFooter}>
                            <button className={styles.btnViewAll} onClick={() => navigate('/services')}>
                                Xem tất cả {stats.totalServices}+ dịch vụ
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Specialties Section - Click vào chuyên khoa để xem bác sĩ */}
            <section className={styles.specialties}>
                <div className={styles.container}>
                    <h2 className={styles.sectionTitle}>Khám chuyên khoa</h2>
                    <p className={styles.sectionSubtitle}>
                        Chọn chuyên khoa để xem danh sách bác sĩ
                    </p>
                    {allSpecialties.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>Chưa có dữ liệu chuyên khoa</p>
                        </div>
                    ) : (
                        <div className={styles.specialtyGrid}>
                            {allSpecialties.map((specialty) => (
                                <div
                                    key={specialty.id}
                                    className={styles.specialtyCard}
                                    onClick={() => navigate(`/doctors?specialty=${specialty.id}`)}
                                >
                                    <div className={styles.specialtyIcon}>🏥</div>
                                    <h3 className={styles.specialtyName}>{specialty.name}</h3>
                                    <p className={styles.specialtyDesc}>
                                        {specialty.description || 'Đội ngũ bác sĩ chuyên khoa giàu kinh nghiệm'}
                                    </p>
                                    <button className={styles.specialtyBtn}>Xem bác sĩ →</button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className={styles.sectionFooter}>
                        <button
                            className={styles.btnViewAll}
                            onClick={() => navigate('/doctors')}
                        >
                            Xem tất cả bác sĩ
                        </button>
                    </div>
                </div>
            </section>

            {/* Quick Booking Section */}
            <section className={styles.quickBooking}>
                <div className={styles.container}>
                    <h2 className={styles.sectionTitle}>Đặt lịch nhanh</h2>
                    <p className={styles.sectionSubtitle}>Chọn chuyên khoa, bác sĩ và ngày khám để xem khung giờ trống</p>
                    <div className={styles.qbControls}>
                        <select value={qbSpecialty} onChange={(e) => setQbSpecialty(e.target.value)}>
                            <option value="">Chọn chuyên khoa</option>
                            {allSpecialties.map(sp => (
                                <option key={sp.id} value={sp.id}>{sp.name}</option>
                            ))}
                        </select>
                        <select
                            value={qbDoctor}
                            onChange={(e) => setQbDoctor(e.target.value)}
                            disabled={!qbSpecialty || qbDoctors.length === 0}
                        >
                            <option value="">Chọn bác sĩ (tuỳ chọn)</option>
                            {qbDoctors.map(d => (
                                <option key={d.id} value={d.id}>{d.full_name}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={qbDate}
                            onChange={(e) => setQbDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    {qbDoctor && qbDate && (
                        <div className={styles.qbSlotsGrid}>
                            {qbSlots.length === 0 ? (
                                <div className={styles.emptyState}>Không có khung giờ trống cho ngày này</div>
                            ) : (
                                qbSlots.map(slot => (
                                    <div key={slot.id} className={styles.qbSlotCard}>
                                        <div className={styles.qbSlotTime}>{slot.start} - {slot.end}</div>
                                        <button
                                            className={styles.qbBookBtn}
                                            onClick={() => {
                                                const params = new URLSearchParams();
                                                if (qbSpecialty) params.set('specialty', qbSpecialty);
                                                if (qbDoctor) params.set('doctor', qbDoctor);
                                                if (qbDate) params.set('date', qbDate);
                                                params.set('time', slot.start);
                                                navigate(`/booking?${params.toString()}`);
                                            }}
                                        >
                                            Đặt ngay
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Featured Doctors Section */}
            {doctors.length > 0 && (
                <section className={styles.doctors}>
                    <div className={styles.container}>
                        <h2 className={styles.sectionTitle}>Đội ngũ bác sĩ nổi bật</h2>
                        <p className={styles.sectionSubtitle}>
                            Các bác sĩ giàu kinh nghiệm, được bệnh nhân tin tưởng
                        </p>
                        <div className={styles.doctorGrid}>
                            {doctors.map((doctor) => (
                                <div
                                    key={doctor.id}
                                    className={styles.doctorCard}
                                    onClick={() => navigate(`/doctors/${doctor.id}`)}
                                >
                                    <div className={styles.doctorImage}>
                                        <img
                                            src={doctor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.full_name || 'Doctor')}&background=667eea&color=fff&size=200`}
                                            alt={doctor.full_name}
                                        />
                                    </div>
                                    <div className={styles.doctorInfo}>
                                        <h3 className={styles.doctorName}>{doctor.full_name}</h3>
                                        <p className={styles.doctorSpecialty}>
                                            {doctor.specialty_name || 'Chuyên khoa'}
                                        </p>
                                        <p className={styles.doctorExperience}>
                                            <i className="fas fa-award"></i> {doctor.experience || 0} năm kinh nghiệm
                                        </p>
                                        <p className={styles.doctorStats}>
                                            <i className="fas fa-check-circle"></i> {doctor.completed_bookings || 0} ca đã khám
                                        </p>
                                        <button className={styles.doctorBtn}>
                                            Xem chi tiết
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className={styles.sectionFooter}>
                            <button
                                className={styles.btnViewAll}
                                onClick={() => navigate('/doctors')}
                            >
                                Xem tất cả bác sĩ
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* How it works Section */}
            <section className={styles.howItWorks}>
                <div className={styles.container}>
                    <h2 className={styles.sectionTitle}>Quy trình đặt lịch</h2>
                    <p className={styles.sectionSubtitle}>
                        4 bước đơn giản để đặt lịch khám bệnh
                    </p>
                    <div className={styles.stepGrid}>
                        {steps.map((step, index) => (
                            <div key={index} className={styles.stepCard}>
                                <div className={styles.stepNumber}>{step.number}</div>
                                <h3 className={styles.stepTitle}>{step.title}</h3>
                                <p className={styles.stepDesc}>{step.description}</p>
                                {index < steps.length - 1 && (
                                    <div className={styles.stepArrow}>→</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            {testimonials.length > 0 && (
                <section className={styles.testimonials}>
                    <div className={styles.container}>
                        <h2 className={styles.sectionTitle}>Phản hồi từ bệnh nhân</h2>
                        <p className={styles.sectionSubtitle}>
                            Cảm nhận thực tế từ những bệnh nhân đã sử dụng dịch vụ
                        </p>
                        <div className={styles.testimonialGrid}>
                            {testimonials.map((testimonial) => (
                                <div key={testimonial.id} className={styles.testimonialCard}>
                                    <div className={styles.testimonialHeader}>
                                        <div className={styles.testimonialAvatar}>
                                            <i className="fas fa-user-circle"></i>
                                        </div>
                                        <div className={styles.testimonialAuthor}>
                                            <h4>{testimonial.patient_name}</h4>
                                            <p>Khám tại {testimonial.specialty || 'Phòng khám'}</p>
                                        </div>
                                    </div>
                                    <div className={styles.testimonialRating}>
                                        {renderStars(testimonial.rating)}
                                    </div>
                                    <p className={styles.testimonialComment}>
                                        "{testimonial.comment || 'Dịch vụ tốt, bác sĩ tận tâm'}"
                                    </p>
                                    {testimonial.doctor_name && (
                                        <p className={styles.testimonialDoctor}>
                                            <i className="fas fa-user-md"></i> {testimonial.doctor_name}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className={styles.cta}>
                <div className={styles.container}>
                    <div className={styles.ctaContent}>
                        <h2 className={styles.ctaTitle}>Sẵn sàng đặt lịch khám?</h2>
                        <p className={styles.ctaSubtitle}>
                            Đăng ký ngay hôm nay để nhận được dịch vụ chăm sóc sức khỏe tốt nhất
                        </p>
                        <button
                            className={styles.ctaButton}
                            onClick={() => navigate('/booking')}
                        >
                            Đặt lịch ngay
                        </button>
                    </div>
                </div>
            </section>

            {/* Contact & Map Section */}
            <section className={styles.contactSection}>
                <div className={styles.container}>
                    <h2 className={styles.sectionTitle}>Liên hệ & Bản đồ</h2>
                    <div className={styles.contactGrid}>
                        <div className={styles.contactInfo}>
                            <p><strong>Địa chỉ:</strong> 123 Đường ABC, Quận 1, TP.HCM</p>
                            <p><strong>Hotline:</strong> (028) 1234 5678</p>
                            <p><strong>Email:</strong> contact@tclinic.vn</p>
                            <p><strong>Giờ làm việc:</strong> Thứ 2 - Thứ 6: 7:00 - 20:00; Thứ 7: 7:00 - 17:00</p>
                            <button className={styles.btnViewAll} onClick={() => navigate('/contact')}>Xem chi tiết liên hệ</button>
                        </div>
                        <div className={styles.mapWrapper}>
                            <iframe
                                title="TClinic Map"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4510632550206!2d106.700981!3d10.776889!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f3f4a1a3a8b%3A0xabcd1234567890!2sDistrict%201%2C%20Ho%20Chi%20Minh%20City!5e0!3m2!1sen!2s!4v1700000000000"
                                width="100%"
                                height="280"
                                style={{ border: 0, borderRadius: 12 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}