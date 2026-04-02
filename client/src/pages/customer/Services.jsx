import React, { Component } from 'react';
import api from '../../utils/api';
import withRouter from '../../utils/withRouter';
import styles from './Services.module.css';

class Services extends Component {
    constructor(props) {
        super(props);
        this.state = {
            specialties: [],
            services: [],
            filteredServices: [],
            selectedSpecialty: 'all',
            searchTerm: '',
            loading: true,
            selectedService: null,
            selectedDoctor: null,
            doctors: [],
            loadingDoctors: false
        };
    }

    componentDidMount() {
        this.fetchData();
        const specialtyParam = this.props.searchParams.get('specialty');
        if (specialtyParam) {
            this.setState({ selectedSpecialty: specialtyParam });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // Check if searchParams specialty changed
        const prevSpecialty = prevProps.searchParams.get('specialty');
        const currSpecialty = this.props.searchParams.get('specialty');
        if (prevSpecialty !== currSpecialty && currSpecialty) {
            this.setState({ selectedSpecialty: currSpecialty });
        }

        // Filter services when specialty, services, or searchTerm changes
        if (
            prevState.selectedSpecialty !== this.state.selectedSpecialty ||
            prevState.services !== this.state.services ||
            prevState.searchTerm !== this.state.searchTerm
        ) {
            this.filterServices();
        }
    }

    filterServices = () => {
        const { selectedSpecialty, services, searchTerm } = this.state;
        let filtered = services;

        if (selectedSpecialty !== 'all') {
            filtered = filtered.filter(
                service => service.specialty_id === parseInt(selectedSpecialty)
            );
        }

        if (searchTerm) {
            filtered = filtered.filter(service =>
                service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                service.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        this.setState({ filteredServices: filtered });
    };

    fetchData = async () => {
        try {
            this.setState({ loading: true });
            const [specialtiesRes, servicesRes] = await Promise.all([
                api.get('/api/public/specialties'),
                api.get('/api/public/services')
            ]);
            this.setState({
                specialties: specialtiesRes.data,
                services: servicesRes.data,
                filteredServices: servicesRes.data
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            this.setState({ loading: false });
        }
    };

    handleBooking = (serviceId) => {
        this.props.navigate(`/booking?service=${serviceId}`);
    };

    handleSelectService = (service) => {
        this.setState({ selectedService: service, selectedDoctor: null });
        if (service.specialty_id) {
            this.fetchDoctorsBySpecialty(service.specialty_id);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    fetchDoctorsBySpecialty = async (specialtyId) => {
        try {
            this.setState({ loadingDoctors: true });
            const response = await api.get('/api/patient/bookings/doctors', {
                params: { specialty_id: specialtyId }
            });
            this.setState({ doctors: response.data.doctors || [] });
        } catch (error) {
            console.error('Error fetching doctors:', error);
            this.setState({ doctors: [] });
        } finally {
            this.setState({ loadingDoctors: false });
        }
    };

    handleSelectDoctor = (doctor) => {
        this.setState({ selectedDoctor: doctor });
    };

    handleClearService = () => {
        this.setState({ selectedService: null, selectedDoctor: null, doctors: [] });
    };

    handleClearDoctor = () => {
        this.setState({ selectedDoctor: null });
    };

    handleProceedBooking = () => {
        const { selectedService, selectedDoctor } = this.state;
        const { navigate } = this.props;
        if (selectedService) {
            let url = `/booking?service=${selectedService.id}`;
            if (selectedService.specialty_id) {
                url += `&specialty=${selectedService.specialty_id}`;
            }
            if (selectedDoctor) {
                url += `&doctor=${selectedDoctor.id}&doctor_name=${encodeURIComponent(selectedDoctor.full_name)}`;
            }
            navigate(url);
        }
    };

    getSpecialtyIcon = (specialtyName) => {
        const icons = {
            'Cơ Xương Khớp': '🦴', 'Thần kinh': '🧠', 'Tiêu hóa': '🫀',
            'Tim mạch': '❤️', 'Tai Mũi Họng': '👂', 'Cột sống': '🦴',
            'Y học Cổ truyền': '🌿', 'Châm cứu': '💉', 'Sản Phụ khoa': '👶',
            'Siêu âm thai': '🤰', 'Nhi khoa': '👶', 'Da liễu': '🔬'
        };
        return icons[specialtyName] || '🏥';
    };

    render() {
        const { navigate } = this.props;
        const {
            specialties, filteredServices, selectedSpecialty, searchTerm, loading,
            selectedService, selectedDoctor, doctors, loadingDoctors
        } = this.state;

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

                {/* ✅ SELECTED SERVICE BANNER */}
                {selectedService && (
                    <div className={styles.selectedServiceBanner}>
                        <div className={styles.selectedServiceContent}>
                            <div className={styles.selectedServiceIcon}>
                                <span>💉</span>
                            </div>
                            <div className={styles.selectedServiceInfo}>
                                <span className={styles.selectedLabel}>DỊCH VỤ ĐÃ CHỌN:</span>
                                <h3 className={styles.selectedName}>{selectedService.name}</h3>
                                <span className={styles.selectedPrice}>
                                    💰 {selectedService.price?.toLocaleString('vi-VN')}đ
                                </span>
                            </div>
                            <button
                                className={styles.btnChangeService}
                                onClick={this.handleClearService}
                            >
                                Đổi dịch vụ
                            </button>
                        </div>
                    </div>
                )}

                {/* ✅ SELECTED DOCTOR BANNER */}
                {selectedService && selectedDoctor && (
                    <div className={styles.selectedDoctorBanner}>
                        <div className={styles.selectedDoctorContent}>
                            <div className={styles.selectedDoctorIcon}>
                                <span>👨‍⚕️</span>
                            </div>
                            <div className={styles.selectedDoctorInfo}>
                                <span className={styles.selectedLabel}>BÁC SĨ ĐÃ CHỌN:</span>
                                <h3 className={styles.selectedName}>{selectedDoctor.full_name}</h3>
                                <span className={styles.selectedSpecialty}>
                                    {selectedDoctor.specialty?.name || selectedService.specialty?.name}
                                </span>
                            </div>
                            <button
                                className={styles.btnChangeDoctor}
                                onClick={this.handleClearDoctor}
                            >
                                Đổi bác sĩ
                            </button>
                        </div>
                        <p className={styles.bookingNote}>
                            ✨ Bạn chỉ cần chọn <strong>ngày khám</strong> và <strong>khung giờ</strong> phù hợp
                        </p>
                    </div>
                )}

                {/* ✅ DOCTORS LIST */}
                {selectedService && !selectedDoctor && (
                    <div className={styles.doctorsSection}>
                        <h3 className={styles.doctorsSectionTitle}>
                            👨‍⚕️ Chọn bác sĩ {selectedService.specialty?.name && `- ${selectedService.specialty.name}`}
                        </h3>
                        {loadingDoctors ? (
                            <div className={styles.loadingDoctors}>
                                <div className={styles.spinner}></div>
                                <p>Đang tải danh sách bác sĩ...</p>
                            </div>
                        ) : doctors.length > 0 ? (
                            <div className={styles.doctorGrid}>
                                {doctors.map(doctor => (
                                    <div
                                        key={doctor.id}
                                        className={styles.doctorCard}
                                        onClick={() => this.handleSelectDoctor(doctor)}
                                    >
                                        <div className={styles.doctorAvatar}>
                                            👨‍⚕️
                                        </div>
                                        <div className={styles.doctorInfo}>
                                            <h4>{doctor.full_name}</h4>
                                            <p>{doctor.specialty?.name}</p>
                                        </div>
                                        <button className={styles.btnSelectDoctor}>
                                            Chọn
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.noDoctors}>
                                <p>Không có bác sĩ nào cho chuyên khoa này</p>
                            </div>
                        )}

                        <div className={styles.skipDoctorSection}>
                            <p>Hoặc để phòng khám sắp xếp bác sĩ cho bạn</p>
                            <button
                                className={styles.btnSkipDoctor}
                                onClick={this.handleProceedBooking}
                            >
                                ⚡ Đặt lịch ngay (không chọn bác sĩ)
                            </button>
                        </div>
                    </div>
                )}

                {/* Proceed booking button when both selected */}
                {selectedService && selectedDoctor && (
                    <div className={styles.proceedSection}>
                        <button
                            className={styles.btnProceedBooking}
                            onClick={this.handleProceedBooking}
                        >
                            📅 Tiếp tục đặt lịch →
                        </button>
                    </div>
                )}

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
                                onClick={() => this.setState({ selectedSpecialty: specialty.id.toString() })}
                            >
                                <div className={styles.specialtyIcon}>
                                    <span>{this.getSpecialtyIcon(specialty.name)}</span>
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
                            onChange={(e) => this.setState({ searchTerm: e.target.value })}
                            className={styles.searchInput}
                        />
                        <select
                            className={styles.filterSelect}
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
                                        <span>{this.getSpecialtyIcon(service.specialty?.name)}</span>
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
                                                className={`${styles.btnBook} ${selectedService?.id === service.id ? styles.btnSelected : ''}`}
                                                onClick={() => this.handleSelectService(service)}
                                            >
                                                {selectedService?.id === service.id ? '✓ Đã chọn' : 'Chọn dịch vụ'}
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
}

export default withRouter(Services);
