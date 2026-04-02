import React, { Component } from 'react';
import withRouter from '../../utils/withRouter';
import api from '../../utils/api';
import styles from './ServiceList.module.css';

class ServiceList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            services: [],
            specialties: [],
            selectedSpecialty: 'all',
            searchTerm: '',
            loading: true
        };
    }

    getSpecialtyIcon = (specialtyId) => {
        const icons = {
            1: '💊',
            2: '🔪',
            3: '🤰',
            4: '👶',
            5: '❤️',
            6: '🧠',
            7: '🫁',
            8: '😮‍💨',
            9: '👂',
            10: '👁️',
            11: '🧴',
            12: '🦷',
            13: '🦴',
            14: '🎗️',
            15: '🧘',
        };
        return icons[specialtyId] || '💡';
    };

    componentDidMount() {
        this.fetchData();
    }

    fetchData = async () => {
        try {
            this.setState({ loading: true });
            const [servicesRes, specialtiesRes] = await Promise.all([
                api.get('/api/public/services'),
                api.get('/api/public/specialties')
            ]);
            this.setState({
                services: servicesRes.data,
                specialties: specialtiesRes.data
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            this.setState({ loading: false });
        }
    };

    getFilteredServices = () => {
        const { services, selectedSpecialty, searchTerm } = this.state;
        return services.filter(service => {
            const matchSpecialty = selectedSpecialty === 'all' || service.specialty_id === parseInt(selectedSpecialty);
            const matchSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchSpecialty && matchSearch;
        });
    };

    formatPrice = (price) => {
        if (!price) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    handleBookService = (service) => {
        this.props.navigate('/booking', {
            state: {
                serviceId: service.id,
                serviceName: service.name,
                specialtyId: service.specialty_id
            }
        });
    };

    render() {
        const { services, specialties, selectedSpecialty, searchTerm, loading } = this.state;
        const { navigate } = this.props;

        if (loading) {
            return <div className={styles.loading}>Đang tải...</div>;
        }

        const filteredServices = this.getFilteredServices();

        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>🏥 Dịch Vụ Khám Chữa Bệnh</h1>
                    <p>Danh sách {services.length} dịch vụ y tế với bảng giá chi tiết</p>
                </div>

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

                <div className={styles.filters}>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="🔍 Tìm kiếm dịch vụ..."
                            value={searchTerm}
                            onChange={(e) => this.setState({ searchTerm: e.target.value })}
                        />
                    </div>

                    <div className={styles.specialtyFilter}>
                        <select
                            value={selectedSpecialty}
                            onChange={(e) => this.setState({ selectedSpecialty: e.target.value })}
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
                                <h2>{this.getSpecialtyIcon(specialty.id)} {specialty.name}</h2>
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
                                                {this.formatPrice(service.price)}
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
                                                onClick={() => this.handleBookService(service)}
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
}

export default withRouter(ServiceList);
