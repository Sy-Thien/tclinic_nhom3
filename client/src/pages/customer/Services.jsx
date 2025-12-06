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
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null); // ✅ NEW: Selected doctor
    const [doctors, setDoctors] = useState([]); // ✅ NEW: Doctors list
    const [loadingDoctors, setLoadingDoctors] = useState(false);
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

    // ✅ NEW: Select service first before booking
    const handleSelectService = (service) => {
        setSelectedService(service);
        setSelectedDoctor(null); // Reset doctor when service changes
        // Fetch doctors for this service's specialty
        if (service.specialty_id) {
            fetchDoctorsBySpecialty(service.specialty_id);
        }
        // Scroll to top to show selected service
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ✅ NEW: Fetch doctors by specialty
    const fetchDoctorsBySpecialty = async (specialtyId) => {
        try {
            setLoadingDoctors(true);
            const response = await api.get('/api/bookings/doctors-by-specialty', {
                params: { specialtyId }
            });
            setDoctors(response.data || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            setDoctors([]);
        } finally {
            setLoadingDoctors(false);
        }
    };

    // ✅ NEW: Select doctor
    const handleSelectDoctor = (doctor) => {
        setSelectedDoctor(doctor);
    };

    // ✅ NEW: Clear selected service
    const handleClearService = () => {
        setSelectedService(null);
        setSelectedDoctor(null);
        setDoctors([]);
    };

    // ✅ NEW: Clear selected doctor
    const handleClearDoctor = () => {
        setSelectedDoctor(null);
    };

    // ✅ NEW: Proceed to booking with selected service and doctor
    const handleProceedBooking = () => {
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
                            onClick={handleClearService}
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
                            onClick={handleClearDoctor}
                        >
                            Đổi bác sĩ
                        </button>
                    </div>
                    <p className={styles.bookingNote}>
                        ✨ Bạn chỉ cần chọn <strong>ngày khám</strong> và <strong>khung giờ</strong> phù hợp
                    </p>
                </div>
            )}

            {/* ✅ DOCTORS LIST - Show when service selected but no doctor yet */}
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
                                    onClick={() => handleSelectDoctor(doctor)}
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

                    {/* Button to skip doctor selection */}
                    <div className={styles.skipDoctorSection}>
                        <p>Hoặc để phòng khám sắp xếp bác sĩ cho bạn</p>
                        <button
                            className={styles.btnSkipDoctor}
                            onClick={handleProceedBooking}
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
                        onClick={handleProceedBooking}
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
                                            className={`${styles.btnBook} ${selectedService?.id === service.id ? styles.btnSelected : ''}`}
                                            onClick={() => handleSelectService(service)}
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