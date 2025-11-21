import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Services.module.css';

export default function Services() {
    const [specialties, setSpecialties] = useState([]);
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [selectedSpecialty, setSelectedSpecialty] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const specialtyParam = searchParams.get('specialty');
        if (specialtyParam) {
            setSelectedSpecialty(specialtyParam);
        }
    }, [searchParams]);

    useEffect(() => {
        if (selectedSpecialty === 'all') {
            let filtered = services;
            if (searchTerm) {
                filtered = filtered.filter(service =>
                    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            setFilteredServices(filtered);
        } else {
            let filtered = services.filter(
                service => service.specialty_id === parseInt(selectedSpecialty)
            );
            if (searchTerm) {
                filtered = filtered.filter(service =>
                    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            setFilteredServices(filtered);
        }
    }, [selectedSpecialty, services, searchTerm]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [specialtiesRes, servicesRes] = await Promise.all([
                api.get('/api/public/specialties'),
                api.get('/api/public/services')
            ]);
            setSpecialties(specialtiesRes.data);
            setServices(servicesRes.data);
            setFilteredServices(servicesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = (serviceId) => {
        navigate(`/booking?service=${serviceId}`);
    };

    const getSpecialtyIcon = (specialtyName) => {
        const icons = {
            'Cơ Xương Khớp': '🦴',
            'Thần kinh': '🧠',
            'Tiêu hóa': '🫀',
            'Tim mạch': '❤️',
            'Tai Mũi Họng': '👂',
            'Cột sống': '🦴',
            'Y học Cổ truyền': '🌿',
            'Châm cứu': '💉',
            'Sản Phụ khoa': '👶',
            'Siêu âm thai': '🤰',
            'Nhi khoa': '👶',
            'Da liễu': '🔬'
        };
        return icons[specialtyName] || '🏥';
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* BREADCRUMB */}
            <div className={styles.breadcrumb}>
                <a href="/">🏠</a>
                <span>/</span>
                <span>Dịch vụ</span>
            </div>

            {/* SPECIALTIES GRID */}
            <section className={styles.specialtiesSection}>
                <h2 className={styles.sectionTitle}>
                    🏥 Khám Chuyên khoa
                </h2>
                <div className={styles.specialtyGrid}>
                    {specialties.map(specialty => (
                        <div
                            key={specialty.id}
                            className={styles.specialtyCard}
                            onClick={() => setSelectedSpecialty(specialty.id.toString())}
                        >
                            <div className={styles.specialtyIcon}>
                                <span>{getSpecialtyIcon(specialty.name)}</span>
                            </div>
                            <h3>{specialty.name}</h3>
                        </div>
                    ))}
                </div>
            </section>

            {/* SERVICES LIST */}
            <section className={styles.servicesSection}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        💊 Dịch vụ toàn diện
                    </h2>
                </div>

                <div className={styles.filterBar}>
                    <input
                        type="text"
                        placeholder="🔍 Tìm kiếm dịch vụ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                    <select
                        className={styles.filterSelect}
                        value={selectedSpecialty}
                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                    >
                        <option value="all">Tất cả chuyên khoa</option>
                        {specialties.map(specialty => (
                            <option key={specialty.id} value={specialty.id}>
                                {specialty.name}
                            </option>
                        ))}
                    </select>
                </div>

                {filteredServices.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>🔍</span>
                        <h3>Không tìm thấy dịch vụ</h3>
                        <p>Vui lòng chọn chuyên khoa khác</p>
                    </div>
                ) : (
                    <div className={styles.serviceGrid}>
                        {filteredServices.map(service => (
                            <div key={service.id} className={styles.serviceCard}>
                                <div className={styles.serviceIcon}>
                                    <span>{getSpecialtyIcon(service.specialty?.name)}</span>
                                </div>
                                <div className={styles.serviceContent}>
                                    <h3 className={styles.serviceName}>
                                        {service.name}
                                    </h3>
                                    {service.description && (
                                        <p className={styles.serviceDesc}>
                                            {service.description}
                                        </p>
                                    )}
                                    <div className={styles.serviceFooter}>
                                        <div className={styles.servicePrice}>
                                            <span className={styles.priceLabel}>Giá:</span>
                                            <span className={styles.priceValue}>
                                                {service.price?.toLocaleString('vi-VN')} đ
                                            </span>
                                        </div>
                                        <button
                                            className={styles.btnBook}
                                            onClick={() => handleBooking(service.id)}
                                        >
                                            Đặt lịch
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* INFO BANNER */}
            <section className={styles.infoBanner}>
                <div className={styles.bannerContent}>
                    <div className={styles.bannerIcon}>📞</div>
                    <div>
                        <h3>Cần tư vấn thêm?</h3>
                        <p>Liên hệ hotline: <strong>1900 1234</strong></p>
                    </div>
                    <button className={styles.btnContact} onClick={() => navigate('/contact')}>
                        Liên hệ ngay
                    </button>
                </div>
            </section>
        </div>
    );
}