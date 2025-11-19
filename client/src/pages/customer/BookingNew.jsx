import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Booking.module.css';

export default function Booking() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        patient_name: '',
        patient_email: '',
        patient_phone: '',
        patient_dob: '',
        patient_gender: 'male',
        patient_address: '',
        specialty_id: searchParams.get('specialty') || '',
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        symptoms: '',
        note: ''
    });

    const [specialties, setSpecialties] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Load specialties
    useEffect(() => {
        fetchSpecialties();
    }, []);

    // Load doctors when specialty changes
    useEffect(() => {
        if (formData.specialty_id) {
            fetchDoctorsBySpecialty(formData.specialty_id);
        }
    }, [formData.specialty_id]);

    // Load available time slots when doctor and date changes
    useEffect(() => {
        if (formData.doctor_id && formData.appointment_date) {
            fetchAvailableSlots(formData.doctor_id, formData.appointment_date);
        }
    }, [formData.doctor_id, formData.appointment_date]);

    const fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            setSpecialties(response.data);
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    const fetchDoctorsBySpecialty = async (specialtyId) => {
        try {
            const response = await api.get(`/api/bookings/doctors?specialty_id=${specialtyId}`);
            setDoctors(response.data.doctors || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            setDoctors([]);
        }
    };

    const fetchAvailableSlots = async (doctorId, date) => {
        try {
            const response = await api.get(`/api/bookings/available-slots?doctor_id=${doctorId}&date=${date}`);
            setAvailableSlots(response.data.availableSlots || []);
        } catch (error) {
            console.error('Error fetching slots:', error);
            // Default time slots if API fails
            setAvailableSlots([
                '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
                '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
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

        // Reset doctor when specialty changes
        if (name === 'specialty_id') {
            setFormData(prev => ({ ...prev, doctor_id: '', appointment_time: '' }));
            setAvailableSlots([]);
        }

        // Reset time when doctor or date changes
        if (name === 'doctor_id' || name === 'appointment_date') {
            setFormData(prev => ({ ...prev, appointment_time: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.patient_name.trim()) {
            newErrors.patient_name = 'Vui lòng nhập họ tên';
        }

        if (!formData.patient_phone.trim()) {
            newErrors.patient_phone = 'Vui lòng nhập số điện thoại';
        } else if (!/^[0-9]{10}$/.test(formData.patient_phone)) {
            newErrors.patient_phone = 'Số điện thoại không hợp lệ (10 chữ số)';
        }

        if (formData.patient_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.patient_email)) {
            newErrors.patient_email = 'Email không hợp lệ';
        }

        if (!formData.specialty_id) {
            newErrors.specialty_id = 'Vui lòng chọn chuyên khoa';
        }

        if (!formData.doctor_id) {
            newErrors.doctor_id = 'Vui lòng chọn bác sĩ';
        }

        if (!formData.appointment_date) {
            newErrors.appointment_date = 'Vui lòng chọn ngày khám';
        } else {
            const selectedDate = new Date(formData.appointment_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                newErrors.appointment_date = 'Không thể chọn ngày trong quá khứ';
            }
        }

        if (!formData.appointment_time) {
            newErrors.appointment_time = 'Vui lòng chọn giờ khám';
        }

        if (!formData.symptoms.trim()) {
            newErrors.symptoms = 'Vui lòng mô tả triệu chứng';
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
            const token = localStorage.getItem('token');
            const response = await api.post('/api/bookings/create', formData, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            alert('✅ Đặt lịch thành công! Mã đặt lịch: ' + response.data.booking.booking_code);

            // Reset form
            setFormData({
                patient_name: '',
                patient_email: '',
                patient_phone: '',
                patient_dob: '',
                patient_gender: 'male',
                patient_address: '',
                specialty_id: '',
                doctor_id: '',
                appointment_date: '',
                appointment_time: '',
                symptoms: '',
                note: ''
            });

            // Redirect to appointments page if logged in
            const user = localStorage.getItem('user');
            if (user) {
                setTimeout(() => {
                    navigate('/customer/my-appointments');
                }, 2000);
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
                                name="patient_name"
                                value={formData.patient_name}
                                onChange={handleChange}
                                placeholder="Nguyễn Văn A"
                                className={errors.patient_name ? styles.inputError : ''}
                            />
                            {errors.patient_name && <span className={styles.error}>{errors.patient_name}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>Số điện thoại <span className={styles.required}>*</span></label>
                            <input
                                type="tel"
                                name="patient_phone"
                                value={formData.patient_phone}
                                onChange={handleChange}
                                placeholder="0901234567"
                                className={errors.patient_phone ? styles.inputError : ''}
                            />
                            {errors.patient_phone && <span className={styles.error}>{errors.patient_phone}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>Email</label>
                            <input
                                type="email"
                                name="patient_email"
                                value={formData.patient_email}
                                onChange={handleChange}
                                placeholder="email@example.com"
                                className={errors.patient_email ? styles.inputError : ''}
                            />
                            {errors.patient_email && <span className={styles.error}>{errors.patient_email}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>Ngày sinh</label>
                            <input
                                type="date"
                                name="patient_dob"
                                value={formData.patient_dob}
                                onChange={handleChange}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Giới tính</label>
                            <select name="patient_gender" value={formData.patient_gender} onChange={handleChange}>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Địa chỉ</label>
                            <input
                                type="text"
                                name="patient_address"
                                value={formData.patient_address}
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
                            <label>Bác sĩ <span className={styles.required}>*</span></label>
                            <select
                                name="doctor_id"
                                value={formData.doctor_id}
                                onChange={handleChange}
                                disabled={!formData.specialty_id}
                                className={errors.doctor_id ? styles.inputError : ''}
                            >
                                <option value="">-- Chọn bác sĩ --</option>
                                {doctors.map(doctor => (
                                    <option key={doctor.id} value={doctor.id}>
                                        {doctor.full_name} - {doctor.experience}
                                    </option>
                                ))}
                            </select>
                            {errors.doctor_id && <span className={styles.error}>{errors.doctor_id}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>Ngày khám <span className={styles.required}>*</span></label>
                            <input
                                type="date"
                                name="appointment_date"
                                value={formData.appointment_date}
                                onChange={handleChange}
                                min={today}
                                className={errors.appointment_date ? styles.inputError : ''}
                            />
                            {errors.appointment_date && <span className={styles.error}>{errors.appointment_date}</span>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>Giờ khám <span className={styles.required}>*</span></label>
                            <select
                                name="appointment_time"
                                value={formData.appointment_time}
                                onChange={handleChange}
                                disabled={!formData.doctor_id || !formData.appointment_date}
                                className={errors.appointment_time ? styles.inputError : ''}
                            >
                                <option value="">-- Chọn giờ khám --</option>
                                {availableSlots.map(slot => (
                                    <option key={slot} value={slot}>{slot}</option>
                                ))}
                            </select>
                            {errors.appointment_time && <span className={styles.error}>{errors.appointment_time}</span>}
                            {availableSlots.length === 0 && formData.doctor_id && formData.appointment_date && (
                                <span className={styles.info}>Không có giờ trống trong ngày này</span>
                            )}
                        </div>

                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                            <label>Triệu chứng / Lý do khám <span className={styles.required}>*</span></label>
                            <textarea
                                name="symptoms"
                                value={formData.symptoms}
                                onChange={handleChange}
                                placeholder="Mô tả triệu chứng hoặc lý do khám bệnh..."
                                rows={4}
                                className={errors.symptoms ? styles.inputError : ''}
                            />
                            {errors.symptoms && <span className={styles.error}>{errors.symptoms}</span>}
                        </div>

                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                            <label>Ghi chú thêm</label>
                            <textarea
                                name="note"
                                value={formData.note}
                                onChange={handleChange}
                                placeholder="Thông tin bổ sung (nếu có)..."
                                rows={3}
                            />
                        </div>
                    </div>
                </section>

                {/* NOTE */}
                <div className={styles.noteSection}>
                    <p>* Admin và bác sĩ sẽ xem thông tin và triệu chứng ban đầu để xác nhận lịch khám.</p>
                </div>

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
