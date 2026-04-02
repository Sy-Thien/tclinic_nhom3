import React, { Component } from 'react';
import api from '../../utils/api';
import withRouter from '../../utils/withRouter';
import styles from './HomePage.module.css';

class HomePage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            allSpecialties: [],
            doctors: [],
            articles: [],
            stats: {
                totalDoctors: 0,
                totalPatients: 0,
                completedAppointments: 0,
                totalServices: 0,
                yearsOfExperience: 10
            },
            selectedSpecialty: '',
            loading: true
        };
    }

    componentDidMount() {
        this.fetchData();
    }

    fetchData = async () => {
        try {
            this.setState({ loading: true });
            const [statsRes, doctorsRes, allSpecialtiesRes, articlesRes] = await Promise.all([
                api.get('/api/public/home-stats'),
                api.get('/api/public/featured-doctors?limit=4'),
                api.get('/api/public/specialties'),
                api.get('/api/public/articles?limit=3')
            ]);

            const newState = {};
            if (statsRes.data.success) newState.stats = statsRes.data.data;
            if (Array.isArray(allSpecialtiesRes.data)) newState.allSpecialties = allSpecialtiesRes.data;
            if (doctorsRes.data.success) newState.doctors = doctorsRes.data.data;
            if (articlesRes.data?.articles) newState.articles = articlesRes.data.articles;

            this.setState(newState);
        } catch (error) {
            console.error('❌ Error fetching home data:', error);
        } finally {
            this.setState({ loading: false });
        }
    };

    render() {
        const { navigate } = this.props;
        const { allSpecialties, doctors, articles, stats, selectedSpecialty, loading } = this.state;

        if (loading) {
            return (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải...</p>
                </div>
            );
        }

        return (
            <div className={styles.homePage}>
                {/* Hero Section - Clean & Modern */}
                <section className={styles.hero}>
                    <div className={styles.heroContent}>
                        <div className={styles.heroText}>
                            <h1 className={styles.heroTitle}>
                                Chăm sóc sức khỏe
                                <span className={styles.highlight}> Chuyên nghiệp</span>
                            </h1>
                            <p className={styles.heroSubtitle}>
                                Đặt lịch khám bệnh online nhanh chóng với đội ngũ bác sĩ giàu kinh nghiệm
                            </p>

                            {/* Simple Booking Form */}
                            <div className={styles.bookingForm}>
                                <select
                                    value={selectedSpecialty}
                                    onChange={(e) => this.setState({ selectedSpecialty: e.target.value })}
                                    className={styles.selectField}
                                >
                                    <option value="">Chọn chuyên khoa</option>
                                    {allSpecialties.map(sp => (
                                        <option key={sp.id} value={sp.id}>{sp.name}</option>
                                    ))}
                                </select>
                                <button
                                    className={styles.bookBtn}
                                    onClick={() => {
                                        const params = selectedSpecialty ? `?specialty=${selectedSpecialty}` : '';
                                        navigate(`/booking${params}`);
                                    }}
                                >
                                    <i className="fas fa-calendar-plus"></i> Đặt lịch ngay
                                </button>
                            </div>

                            {/* Quick Stats */}
                            <div className={styles.quickStats}>
                                <div className={styles.quickStat}>
                                    <span className={styles.statNum}>{stats.totalDoctors}+</span>
                                    <span className={styles.statText}>Bác sĩ</span>
                                </div>
                                <div className={styles.quickStat}>
                                    <span className={styles.statNum}>{stats.totalPatients.toLocaleString()}+</span>
                                    <span className={styles.statText}>Bệnh nhân</span>
                                </div>
                                <div className={styles.quickStat}>
                                    <span className={styles.statNum}>{stats.yearsOfExperience}+</span>
                                    <span className={styles.statText}>Năm KN</span>
                                </div>
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

                {/* Specialties - Compact Grid */}
                <section className={styles.specialtiesSection}>
                    <div className={styles.container}>
                        <h2 className={styles.sectionTitle}>Chuyên khoa</h2>
                        <div className={styles.specialtyChips}>
                            {allSpecialties.slice(0, 8).map((specialty) => (
                                <button
                                    key={specialty.id}
                                    className={styles.specialtyChip}
                                    onClick={() => navigate(`/doctors?specialty=${specialty.id}`)}
                                >
                                    {specialty.name}
                                </button>
                            ))}
                            {allSpecialties.length > 8 && (
                                <button
                                    className={`${styles.specialtyChip} ${styles.moreChip}`}
                                    onClick={() => navigate('/doctors')}
                                >
                                    +{allSpecialties.length - 8} khoa khác
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Featured Doctors - Modern Cards */}
                {doctors.length > 0 && (
                    <section className={styles.doctorsSection}>
                        <div className={styles.container}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Bác sĩ nổi bật</h2>
                                <button className={styles.viewAllBtn} onClick={() => navigate('/doctors')}>
                                    Xem tất cả →
                                </button>
                            </div>
                            <div className={styles.doctorGrid}>
                                {doctors.map((doctor) => (
                                    <div
                                        key={doctor.id}
                                        className={styles.doctorCard}
                                        onClick={() => navigate(`/doctors/${doctor.id}`)}
                                    >
                                        <img
                                            className={styles.doctorAvatar}
                                            src={doctor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.full_name || 'BS')}&background=0ea5e9&color=fff&size=120`}
                                            alt={doctor.full_name}
                                        />
                                        <h3 className={styles.doctorName}>{doctor.full_name}</h3>
                                        <p className={styles.doctorSpec}>{doctor.specialty_name}</p>
                                        <div className={styles.doctorMeta}>
                                            <span><i className="fas fa-briefcase"></i> {doctor.experience || 0} năm</span>
                                            {parseFloat(doctor.avg_rating) > 0 && (
                                                <span><i className="fas fa-star"></i> {doctor.avg_rating}</span>
                                            )}
                                        </div>
                                        <button className={styles.bookDoctorBtn}>Đặt khám</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* News Section */}
                {articles.length > 0 && (
                    <section className={styles.newsSection}>
                        <div className={styles.container}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Tin tức sức khỏe</h2>
                                <button className={styles.viewAllBtn} onClick={() => navigate('/news')}>
                                    Xem tất cả →
                                </button>
                            </div>
                            <div className={styles.newsGrid}>
                                {articles.map((article) => (
                                    <div
                                        key={article.id}
                                        className={styles.newsCard}
                                        onClick={() => navigate(`/news/${article.slug}`)}
                                    >
                                        <img
                                            className={styles.newsImage}
                                            src={article.thumbnail || 'https://via.placeholder.com/400x250?text=Tin+tức'}
                                            alt={article.title}
                                        />
                                        <div className={styles.newsContent}>
                                            <span className={styles.newsCategory}>{article.category_name || 'Tin tức'}</span>
                                            <h3 className={styles.newsTitle}>{article.title}</h3>
                                            <p className={styles.newsExcerpt}>{article.excerpt}</p>
                                            <div className={styles.newsMeta}>
                                                <span><i className="far fa-calendar"></i> {new Date(article.published_date).toLocaleDateString('vi-VN')}</span>
                                                <span><i className="far fa-eye"></i> {article.views || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* CTA Banner */}
                <section className={styles.ctaBanner}>
                    <div className={styles.container}>
                        <div className={styles.ctaContent}>
                            <div className={styles.ctaText}>
                                <h2>Cần tư vấn sức khỏe?</h2>
                                <p>Đội ngũ bác sĩ sẵn sàng hỗ trợ bạn</p>
                            </div>
                            <div className={styles.ctaActions}>
                                <button className={styles.ctaPrimary} onClick={() => navigate('/booking')}>
                                    <i className="fas fa-calendar-check"></i> Đặt lịch khám
                                </button>
                                <a href="tel:02812345678" className={styles.ctaSecondary}>
                                    <i className="fas fa-phone"></i> (028) 1234 5678
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Info - Minimal */}
                <section className={styles.contactBar}>
                    <div className={styles.container}>
                        <div className={styles.contactItems}>
                            <div className={styles.contactItem}>
                                <i className="fas fa-map-marker-alt"></i>
                                <span>123 Đường ABC, Quận 1, TP.HCM</span>
                            </div>
                            <div className={styles.contactItem}>
                                <i className="fas fa-clock"></i>
                                <span>T2-T6: 7:00-20:00 | T7: 7:00-17:00</span>
                            </div>
                            <div className={styles.contactItem}>
                                <i className="fas fa-envelope"></i>
                                <span>contact@tclinic.vn</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }
}

export default withRouter(HomePage);
