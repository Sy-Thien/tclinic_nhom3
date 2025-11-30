import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './ServiceList.module.css';

export default function ServiceList() {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [selectedSpecialty, setSelectedSpecialty] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [servicesRes, specialtiesRes] = await Promise.all([
                api.get('/api/public/services'),
                api.get('/api/public/specialties')
            ]);
            setServices(servicesRes.data);
            setSpecialties(specialtiesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredServices = services.filter(service => {
        const matchSpecialty = selectedSpecialty === 'all' || service.specialty_id === parseInt(selectedSpecialty);
        const matchSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchSpecialty && matchSearch;
    });

    const formatPrice = (price) => {
        if (!price) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleBookService = (service) => {
        navigate('/booking', {
            state: {
                serviceId: service.id,
                serviceName: service.name,
                specialtyId: service.specialty_id
            }
        });
    };

    if (loading) {
        return <div className={styles.loading}>Đang tải...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>🏥 Dịch Vụ Khám Chữa Bệnh</h1>
                <p>Danh sách {services.length} dịch vụ y tế với bảng giá chi tiết</p>
            </div>

            {/* Stats */}
            <div className={styles.statsBar}>
                <div className={styles.statItem}>
                    <span className={styles.statValue}>{services.length}</span>
                    <span className={styles.statLabel}>Dịch vụ</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statValue}>{specialties.length}</span>
                    <span className={styles.statLabel}>Chuyên khoa</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statValue}>
                        {Math.min(...services.filter(s => s.price).map(s => Number(s.price))).toLocaleString()}đ
                    </span>
                    <span className={styles.statLabel}>Giá từ</span>
                </div>
            </div>

            {/* Filter Section */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <input
                        type="text"
                        placeholder="🔍 Tìm kiếm dịch vụ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.specialtyFilter}>
                    <select
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
            </div>

            {/* Services by Specialty */}
            {specialties.map(specialty => {
                const specialtyServices = filteredServices.filter(
                    s => s.specialty_id === specialty.id
                );

                if (specialtyServices.length === 0 && selectedSpecialty !== 'all') {
                    return null;
                }

                if (selectedSpecialty !== 'all' && selectedSpecialty !== specialty.id.toString()) {
                    return null;
                }

                return (
                    <div key={specialty.id} className={styles.specialtySection}>
                        <div className={styles.specialtyHeader}>
                            <h2>{getSpecialtyIcon(specialty.id)} {specialty.name}</h2>
                            {specialty.description && (
                                <p>{specialty.description}</p>
                            )}
                            <span className={styles.serviceCount}>{specialtyServices.length} dịch vụ</span>
                        </div>

                        <div className={styles.servicesGrid}>
                            {specialtyServices.map(service => (
                                <div key={service.id} className={styles.serviceCard}>
                                    <div className={styles.serviceHeader}>
                                        <h3>{service.name}</h3>
                                        <div className={styles.priceTag}>
                                            {formatPrice(service.price)}
                                        </div>
                                    </div>

                                    {service.description && (
                                        <p className={styles.description}>
                                            {service.description}
                                        </p>
                                    )}

                                    <div className={styles.serviceDetails}>
                                        {service.duration && (
                                            <div className={styles.detailItem}>
                                                <span className={styles.icon}>⏱️</span>
                                                <span>{service.duration} phút</span>
                                            </div>
                                        )}
                                        <div className={styles.detailItem}>
                                            <span className={styles.icon}>🏥</span>
                                            <span>{specialty.name}</span>
                                        </div>
                                    </div>

                                    <div className={styles.cardActions}>
                                        <button
                                            className={styles.btnDetail}
                                            onClick={() => navigate(`/services/${service.id}`)}
                                        >
                                            👨‍⚕️ Xem bác sĩ
                                        </button>
                                        <button
                                            className={styles.btnBook}
                                            onClick={() => handleBookService(service)}
                                        >
                                            📅 Đặt lịch
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {filteredServices.length === 0 && (
                <div className={styles.noData}>
                    <p>Không tìm thấy dịch vụ phù hợp</p>
                </div>
            )}
        </div>
    );
}
