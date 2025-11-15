import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Booking.module.css';

export default function Booking() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        birthday: '',
        gender: 0,
        address: '',
        specialty_id: searchParams.get('specialty') || '',
        service_id: searchParams.get('service') || '',
        date: '',
        time: '',
        symptoms: ''
    });

    const [specialties, setSpecialties] = useState([]);
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Load specialties
    useEffect(() => {
        fetchSpecialties();
    }, []);

    // Load services when specialty changes
    useEffect(() => {
        if (formData.specialty_id) {
            fetchServicesBySpecialty(formData.specialty_id);
        }
    }, [formData.specialty_id]);

    // Load available time slots when date changes
    useEffect(() => {
        if (formData.date) {
            fetchAvailableSlots(formData.date);
        }
    }, [formData.date]);

    const fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            setSpecialties(response.data);
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    const fetchServicesBySpecialty = async (specialtyId) => {
        try {
            const response = await api.get('/api/public/services');
            const filtered = response.data.filter(
                service => service.specialty_id === parseInt(specialtyId)
            );
            setFilteredServices(filtered);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const fetchAvailableSlots = async (date) => {
        try {
            const response = await api.get(`/api/public/available-slots?date=${date}`);
            setAvailableSlots(response.data);
        } catch (error) {
            console.error('Error fetching slots:', error);
            // Default time slots if API fails
            setAvailableSlots([
                '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
                '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'
            ]);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Reset service when specialty changes
        if (name === 'specialty_id') {
            setFormData(prev => ({ ...prev, service_id: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Vui lòng nhập họ tên';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại';
        } else if (!/^[0-9]{10}$/.test(formData.phone)) {
            newErrors.phone = 'Số điện thoại không hợp lệ (10 chữ số)';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.specialty_id) {
            newErrors.specialty_id = 'Vui lòng chọn chuyên khoa';
        }

        if (!formData.service_id) {
            newErrors.service_id = 'Vui lòng chọn dịch vụ';
        }

        if (!formData.date) {
            newErrors.date = 'Vui lòng chọn ngày khám';
        } else {
            const selectedDate = new Date(formData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                newErrors.date = 'Không thể chọn ngày trong quá khứ';
            }
        }

        if (!formData.time) {
            newErrors.time = 'Vui lòng chọn giờ khám';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/api/public/booking', formData);

            if (response.data.success) {
                alert('✅ Đặt lịch thành công! Vui lòng kiểm tra email để xác nhận.');

                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    birthday: '',
                    gender: 0,
                    address: '',
                    specialty_id: '',
                    service_id: '',
                    date: '',
                    time: '',
                    symptoms: ''
                });

                // Redirect to appointments page if logged in
                const user = localStorage.getItem('user');
                if (user) {
                    setTimeout(() => {
                        navigate('/my-appointments');
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Booking error:', error);
            alert(error.response?.data?.message || '❌ Có lỗi xảy ra khi đặt lịch!');
        } finally {
            setLoading(false);
        }
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>📅 Đặt Lịch Khám</h1>
                <p>Điền thông tin để đặt lịch khám bệnh trực tuyến</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* THÔNG TIN BỆNH NHÂN */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>👤 Thông tin bệnh nhân</h2>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Họ và tên <span className={styles.required}>*</span></label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Nguyễn Văn A"
                                className={errors.name ? styles.inputError : ''}
                            />
                            {errors.name && <span className={styles.error}>{errors.name}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>Số điện thoại <span className={styles.required}>*</span></label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="0901234567"
                                className={errors.phone ? styles.inputError : ''}
                            />
                            {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="email@example.com"
                                className={errors.email ? styles.inputError : ''}
                            />
                            {errors.email && <span className={styles.error}>{errors.email}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>Ngày sinh</label>
                            <input
                                type="date"
                                name="birthday"
                                value={formData.birthday}
                                onChange={handleChange}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Giới tính</label>
                            <select name="gender" value={formData.gender} onChange={handleChange}>
                                <option value={0}>Nam</option>
                                <option value={1}>Nữ</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Địa chỉ</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Số nhà, đường, quận, thành phố"
                            />
                        </div>
                    </div>
                </section>

                {/* THÔNG TIN LỊCH KHÁM */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>🏥 Thông tin lịch khám</h2>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Chuyên khoa <span className={styles.required}>*</span></label>
                            <select
                                name="specialty_id"
                                value={formData.specialty_id}
                                onChange={handleChange}
                                className={errors.specialty_id ? styles.inputError : ''}
                            >
                                <option value="">-- Chọn chuyên khoa --</option>
                                {specialties.map(sp => (
                                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                                ))}
                            </select>
                            {errors.specialty_id && <span className={styles.error}>{errors.specialty_id}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>Dịch vụ <span className={styles.required}>*</span></label>
                            <select
                                name="service_id"
                                value={formData.service_id}
                                onChange={handleChange}
                                disabled={!formData.specialty_id}
                                className={errors.service_id ? styles.inputError : ''}
                            >
                                <option value="">-- Chọn dịch vụ --</option>
                                {filteredServices.map(sv => (
                                    <option key={sv.id} value={sv.id}>
                                        {sv.name} - {sv.price?.toLocaleString('vi-VN')}đ
                                    </option>
                                ))}
                            </select>
                            {errors.service_id && <span className={styles.error}>{errors.service_id}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>Ngày khám <span className={styles.required}>*</span></label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                min={today}
                                className={errors.date ? styles.inputError : ''}
                            />
                            {errors.date && <span className={styles.error}>{errors.date}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>Giờ khám <span className={styles.required}>*</span></label>
                            <select
                                name="time"
                                value={formData.time}
                                onChange={handleChange}
                                disabled={!formData.date}
                                className={errors.time ? styles.inputError : ''}
                            >
                                <option value="">-- Chọn giờ khám --</option>
                                {availableSlots.map(slot => (
                                    <option key={slot} value={slot}>{slot}</option>
                                ))}
                            </select>
                            {errors.time && <span className={styles.error}>{errors.time}</span>}
                        </div>

                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                            <label>Triệu chứng / Lý do khám</label>
                            <textarea
                                name="symptoms"
                                value={formData.symptoms}
                                onChange={handleChange}
                                placeholder="Mô tả triệu chứng hoặc lý do khám bệnh..."
                                rows={4}
                            />
                        </div>
                    </div>
                </section>

                {/* SUBMIT BUTTON */}
                <div className={styles.submitSection}>
                    <button
                        type="submit"
                        className={styles.btnSubmit}
                        disabled={loading}
                    >
                        {loading ? '⏳ Đang xử lý...' : '✅ Xác nhận đặt lịch'}
                    </button>
                </div>
            </form>
        </div>
    );
}