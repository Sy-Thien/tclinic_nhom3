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
        appointment_date: '',
        appointment_time: '',
        doctor_id: null, // null = không chỉ định, admin sẽ gán
        symptoms: '',
        note: ''
    });

    const [specialties, setSpecialties] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Load specialties
    useEffect(() => {
        fetchSpecialties();
    }, []);

    // Load bác sĩ và giờ khi chọn chuyên khoa
    useEffect(() => {
        if (formData.specialty_id) {
            fetchDoctorsBySpecialty(formData.specialty_id);
        }
    }, [formData.specialty_id]);

    // Load giờ rảnh khi chọn ngày
    useEffect(() => {
        if (formData.appointment_date) {
            if (selectedDoctor) {
                // Nếu chọn bác sĩ, lấy giờ rảnh của bác sĩ đó
                fetchAvailableSlotsForDoctor(selectedDoctor, formData.appointment_date);
            } else if (formData.specialty_id) {
                // Nếu không chọn bác sĩ, lấy tất cả giờ rảnh của tất cả bác sĩ trong chuyên khoa
                fetchDefaultSlots(formData.appointment_date);
            }
        }
    }, [formData.appointment_date, selectedDoctor]);

    const fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            setSpecialties(response.data);
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    // Lấy danh sách bác sĩ theo chuyên khoa
    const fetchDoctorsBySpecialty = async (specialtyId) => {
        try {
            setLoading(true);
            const response = await api.get('/api/bookings/doctors-by-specialty', {
                params: { specialtyId }
            });
            setDoctors(response.data);
            setSelectedDoctor(null);
            setFormData(prev => ({ ...prev, doctor_id: null }));
        } catch (error) {
            console.error('Error fetching doctors:', error);
            setDoctors([]);
        } finally {
            setLoading(false);
        }
    };

    // Lấy giờ rảnh mặc định (tất cả bác sĩ trong chuyên khoa)
    const fetchDefaultSlots = async (date) => {
        // Hiển thị tất cả giờ làm việc của phòng khám (8h-17h, nghỉ 12h-13h)
        setAvailableSlots([
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
        ]);
    };

    // Lấy giờ rảnh của bác sĩ cụ thể
    const fetchAvailableSlotsForDoctor = async (doctorId, date) => {
        try {
            setLoading(true);
            const response = await api.get('/api/bookings/available-slots', {
                params: { doctorId, date }
            });
            setAvailableSlots(response.data.availableSlots.map(s => s.start));
        } catch (error) {
            console.error('Error fetching doctor slots:', error);
            setAvailableSlots([]);
        } finally {
            setLoading(false);
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

        // Reset time when date changes
        if (name === 'appointment_date') {
            setFormData(prev => ({ ...prev, appointment_time: '' }));
        }
    };

    const handleSelectDoctor = (doctorId) => {
        if (selectedDoctor === doctorId) {
            // Bỏ chọn bác sĩ
            setSelectedDoctor(null);
            setFormData(prev => ({
                ...prev,
                doctor_id: null,
                appointment_time: ''
            }));
            if (formData.appointment_date) {
                fetchDefaultSlots(formData.appointment_date);
            }
        } else {
            // Chọn bác sĩ
            setSelectedDoctor(doctorId);
            setFormData(prev => ({
                ...prev,
                doctor_id: doctorId,
                appointment_time: ''
            }));
            if (formData.appointment_date) {
                fetchAvailableSlotsForDoctor(doctorId, formData.appointment_date);
            }
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
                specialty_id: searchParams.get('specialty') || '',
                appointment_date: '',
                appointment_time: '',
                doctor_id: null,
                symptoms: '',
                note: ''
            });
            setSelectedDoctor(null);

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
                        {/* Chuyên khoa - Bắt buộc */}
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

                        {/* Ngày khám - Bắt buộc */}
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

                        {/* Chọn bác sĩ - Tùy chọn */}
                        {formData.specialty_id && (
                            <div style={{ gridColumn: '1 / -1' }} className={styles.formGroup}>
                                <label>👨‍⚕️ Chọn bác sĩ (tùy chọn - nếu không chọn admin sẽ gán)</label>
                                {loading ? (
                                    <p>⏳ Đang tải danh sách bác sĩ...</p>
                                ) : doctors.length > 0 ? (
                                    <div className={styles.doctorsList}>
                                        {/* Option "Chưa chọn" */}
                                        <div
                                            className={`${styles.doctorOption} ${selectedDoctor === null ? styles.selected : ''}`}
                                            onClick={() => handleSelectDoctor(null)}
                                        >
                                            <h4>❌ Chưa chọn bác sĩ</h4>
                                            <p>Admin sẽ tự động gán bác sĩ phù hợp với lịch rảnh</p>
                                        </div>

                                        {/* Các bác sĩ */}
                                        {doctors.map(doc => (
                                            <div
                                                key={doc.id}
                                                className={`${styles.doctorOption} ${selectedDoctor === doc.id ? styles.selected : ''}`}
                                                onClick={() => handleSelectDoctor(doc.id)}
                                            >
                                                <h4>👨‍⚕️ {doc.full_name}</h4>
                                                <p>📞 {doc.phone || 'Không có'}</p>
                                                {doc.schedules && doc.schedules.length > 0 && (
                                                    <p className={styles.info}>Lịch làm việc: {doc.schedules.map(s => s.day_of_week).join(', ')}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={styles.warning}>Không có bác sĩ nào trong chuyên khoa này</p>
                                )}
                            </div>
                        )}

                        {/* Giờ khám - Hiển thị nếu chọn ngày */}
                        {formData.appointment_date && (
                            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                <label>Giờ khám</label>
                                {loading ? (
                                    <p>⏳ Đang tải giờ rảnh...</p>
                                ) : availableSlots.length > 0 ? (
                                    <>
                                        <div className={styles.slotsGrid}>
                                            {availableSlots.map(slot => (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    className={`${styles.slotBtn} ${formData.appointment_time === slot ? styles.selected : ''}`}
                                                    onClick={() => setFormData(prev => ({ ...prev, appointment_time: slot }))}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                        <p className={styles.info}>💡 {selectedDoctor ? 'Chọn giờ rảnh của bác sĩ' : 'Chọn giờ khám phù hợp hoặc để trống để admin sắp xếp'}</p>
                                    </>
                                ) : (
                                    <p className={styles.warning}>⚠️ {selectedDoctor ? 'Bác sĩ này không có giờ rảnh vào ngày được chọn' : 'Không có giờ rảnh vào ngày này'}</p>
                                )}
                            </div>
                        )}

                        {/* Triệu chứng - Bắt buộc */}
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

                        {/* Ghi chú - Tùy chọn */}
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
                    <p>💡 <strong>Hướng dẫn:</strong></p>
                    <ul>
                        <li>
                            <strong>Chuyên khoa:</strong> Bắt buộc chọn - chuyên môn của bác sĩ mà bạn muốn khám
                        </li>
                        <li>
                            <strong>Bác sĩ:</strong> Tùy chọn - nếu bạn không chọn, admin sẽ tự động gán bác sĩ phù hợp nhất dựa trên lịch rảnh
                        </li>
                        <li>
                            <strong>Giờ khám:</strong> Nếu chọn bác sĩ cụ thể, bạn sẽ thấy giờ rảnh của bác sĩ đó. Nếu không chọn bác sĩ, hiển thị tất cả giờ làm việc của phòng khám.
                        </li>
                        <li>
                            Admin sẽ xác nhận lịch của bạn trong thời gian sớm nhất. Bạn sẽ nhận thông báo xác nhận qua số điện thoại.
                        </li>
                    </ul>
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
