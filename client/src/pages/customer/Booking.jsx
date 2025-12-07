import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Booking.module.css';

export default function Booking() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Lấy params từ URL
    const doctorIdFromUrl = searchParams.get('doctor');
    const doctorNameFromUrl = searchParams.get('doctor_name');
    const serviceIdFromUrl = searchParams.get('service');

    const [formData, setFormData] = useState({
        patient_name: '',
        patient_email: '',
        patient_phone: '',
        patient_dob: '',
        patient_gender: 'male',
        patient_address: '',
        specialty_id: searchParams.get('specialty') || '',
        appointment_date: searchParams.get('date') || '',
        appointment_time: searchParams.get('time') || '',
        doctor_id: doctorIdFromUrl ? Number(doctorIdFromUrl) : null, // null = không chỉ định, admin sẽ gán
        service_id: serviceIdFromUrl ? Number(serviceIdFromUrl) : null,
        symptoms: searchParams.get('symptoms') || '',
        note: ''
    });

    // Tự động chọn chế độ "with_doctor" nếu có doctor từ URL
    const [bookingType, setBookingType] = useState(doctorIdFromUrl ? 'with_doctor' : 'instant');
    const [specialties, setSpecialties] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [services, setServices] = useState([]); // ✅ NEW: List of services
    const [selectedService, setSelectedService] = useState(null); // ✅ NEW: Selected service info
    const [availableSlots, setAvailableSlots] = useState([]);
    const [doctorTimeSlots, setDoctorTimeSlots] = useState(null); // ✅ NEW: Full time slots với booking count
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // ✅ Auto-fill thông tin người dùng đã đăng nhập
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                console.log('✅ Auto-filling user info:', user);
                setFormData(prev => ({
                    ...prev,
                    patient_name: prev.patient_name || user.full_name || user.name || '',
                    patient_email: prev.patient_email || user.email || '',
                    patient_phone: prev.patient_phone || user.phone || '',
                    patient_dob: prev.patient_dob || user.birthday || user.date_of_birth || '',
                    patient_gender: prev.patient_gender || user.gender || 'male',
                    patient_address: prev.patient_address || user.address || ''
                }));
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

    // ✅ Validate params từ URL ngay khi load
    useEffect(() => {
        const validateURLParams = () => {
            let hasInvalidParams = false;
            const newParams = new URLSearchParams(searchParams);

            // Validate date từ URL
            const dateParam = searchParams.get('date');
            if (dateParam) {
                const selectedDate = new Date(dateParam + 'T00:00:00');
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (selectedDate < today) {
                    console.warn('⚠️ Ngày trong URL đã qua:', dateParam);
                    newParams.delete('date');
                    setFormData(prev => ({ ...prev, appointment_date: '' }));
                    hasInvalidParams = true;
                }
            }

            // Validate time từ URL (nếu là hôm nay)
            const timeParam = searchParams.get('time');
            if (timeParam && dateParam) {
                const selectedDate = new Date(dateParam + 'T00:00:00');
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (selectedDate.toDateString() === today.toDateString()) {
                    const [hours, minutes] = timeParam.split(':').map(Number);
                    if (!isNaN(hours) && !isNaN(minutes)) {
                        const slotTimeInMinutes = hours * 60 + minutes;
                        const currentTimeInMinutes = new Date().getHours() * 60 + new Date().getMinutes() + 30;

                        if (slotTimeInMinutes < currentTimeInMinutes) {
                            console.warn('⚠️ Giờ trong URL đã qua:', timeParam);
                            newParams.delete('time');
                            setFormData(prev => ({ ...prev, appointment_time: '' }));
                            hasInvalidParams = true;
                        }
                    }
                }
            }

            // Nếu có params không hợp lệ, update URL
            if (hasInvalidParams) {
                navigate({ search: newParams.toString() }, { replace: true });
                alert('⚠️ Một số thông tin từ URL không hợp lệ (ngày/giờ đã qua) và đã được loại bỏ. Vui lòng chọn lại.');
            }
        };

        validateURLParams();
    }, []);

    // Load specialties
    useEffect(() => {
        fetchSpecialties();
        // ✅ If service_id from URL, fetch service info
        if (serviceIdFromUrl) {
            fetchServiceInfo(serviceIdFromUrl);
        }
    }, [serviceIdFromUrl]);

    // ✅ NEW: Fetch service info when coming from service page
    const fetchServiceInfo = async (serviceId) => {
        try {
            console.log('📋 Fetching service info for ID:', serviceId);
            const response = await api.get(`/api/public/services/${serviceId}`);
            console.log('✅ Service loaded:', response.data);
            setSelectedService(response.data);
            // Auto-set specialty and service_id
            setFormData(prev => ({
                ...prev,
                service_id: Number(serviceId),
                specialty_id: response.data.specialty_id || prev.specialty_id
            }));
        } catch (error) {
            console.error('❌ Error fetching service:', error);
        }
    };

    // Load bác sĩ và giờ khi chọn chuyên khoa
    useEffect(() => {
        if (formData.specialty_id) {
            fetchDoctorsBySpecialty(formData.specialty_id);
            fetchServicesBySpecialty(formData.specialty_id);
        }
    }, [formData.specialty_id]);

    // ✅ NEW: Fetch services by specialty
    const fetchServicesBySpecialty = async (specialtyId) => {
        try {
            const response = await api.get(`/api/public/services?specialty_id=${specialtyId}`);
            setServices(response.data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
            setServices([]);
        }
    };

    // Sync selectedDoctor if doctor_id comes from URL
    useEffect(() => {
        if (formData.doctor_id) {
            setSelectedDoctor(formData.doctor_id);
            // Nếu có doctor từ URL, chuyển sang chế độ with_doctor
            setBookingType('with_doctor');
        }
        // If both doctor and date provided, try load slots
        if (formData.doctor_id && formData.appointment_date) {
            fetchAvailableSlotsForDoctor(formData.doctor_id, formData.appointment_date);
        } else if (!formData.doctor_id && formData.appointment_date) {
            fetchDefaultSlots(formData.appointment_date);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load giờ rảnh khi chọn ngày
    useEffect(() => {
        if (formData.appointment_date) {
            // ✅ Chỉ fetch slots khi ngày có format hợp lệ (YYYY-MM-DD)
            const dateMatch = formData.appointment_date.match(/^\d{4}-\d{2}-\d{2}$/);
            if (!dateMatch) {
                // Ngày chưa nhập đầy đủ, bỏ qua
                return;
            }

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
            // ✅ Chỉ reset doctor nếu KHÔNG có doctor từ URL
            if (!doctorIdFromUrl) {
                setSelectedDoctor(null);
                setFormData(prev => ({ ...prev, doctor_id: null }));
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
            setDoctors([]);
        } finally {
            setLoading(false);
        }
    };

    // Lấy giờ rảnh mặc định (tất cả bác sĩ trong chuyên khoa)
    const fetchDefaultSlots = async (date) => {
        // ✅ Kiểm tra format ngày hợp lệ (YYYY-MM-DD)
        const dateMatch = date?.match(/^\d{4}-\d{2}-\d{2}$/);
        if (!dateMatch) {
            // Ngày chưa nhập đầy đủ, bỏ qua
            return;
        }

        // ✅ Kiểm tra ngày quá khứ trước
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(date + 'T00:00:00');

        if (selectedDate < today) {
            // Ngày quá khứ - không hiển thị slots
            setDoctorTimeSlots({
                isWorking: false,
                slots: [],
                date,
                message: 'Không thể đặt lịch cho ngày trong quá khứ'
            });
            setAvailableSlots([]);
            return;
        }

        // Tạo slots mặc định với format giống API (8h-17h, nghỉ 12h-13h)
        const defaultSlots = [];
        const workingHours = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
        ];

        // ✅ Kiểm tra nếu là hôm nay thì lọc bỏ giờ đã qua
        const isToday = selectedDate.toDateString() === new Date().toDateString();
        const currentHour = new Date().getHours();
        const currentMinute = new Date().getMinutes();

        for (const startTime of workingHours) {
            const [hour, min] = startTime.split(':').map(Number);
            let endMin = min + 30;
            let endHour = hour;
            if (endMin >= 60) {
                endMin = 0;
                endHour += 1;
            }
            const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

            // Check if it's break time
            const isBreakTime = hour === 12;

            // ✅ Nếu là hôm nay, kiểm tra giờ đã qua chưa (cần trước ít nhất 30 phút)
            let isPastTime = false;
            if (isToday) {
                const slotTimeInMinutes = hour * 60 + min;
                const currentTimeInMinutes = currentHour * 60 + currentMinute + 30; // +30 phút buffer
                isPastTime = slotTimeInMinutes < currentTimeInMinutes;
            }

            defaultSlots.push({
                time: `${startTime}-${endTime}`,
                startTime,
                endTime,
                isBreakTime,
                bookingCount: 0, // Không biết số lượng booking khi chưa chọn bác sĩ
                isAvailable: !isBreakTime && !isPastTime,
                isPastTime
            });
        }

        setDoctorTimeSlots({
            isWorking: true,
            slots: defaultSlots,
            date,
            schedule: {
                start_time: '08:00',
                end_time: '17:00',
                break_start: '12:00',
                break_end: '13:00'
            }
        });
        setAvailableSlots(workingHours.filter(h => {
            if (h.startsWith('12:')) return false;
            if (isToday) {
                const [hour, min] = h.split(':').map(Number);
                const slotTimeInMinutes = hour * 60 + min;
                const currentTimeInMinutes = currentHour * 60 + currentMinute + 30;
                return slotTimeInMinutes >= currentTimeInMinutes;
            }
            return true;
        }));
    };

    // Lấy giờ rảnh của bác sĩ cụ thể với booking count
    const fetchAvailableSlotsForDoctor = async (doctorId, date) => {
        if (!doctorId || !date) {
            console.warn('fetchAvailableSlotsForDoctor: Missing doctorId or date');
            return;
        }

        // ✅ Kiểm tra format ngày hợp lệ (YYYY-MM-DD)
        const dateMatch = date?.match(/^\d{4}-\d{2}-\d{2}$/);
        if (!dateMatch) {
            // Ngày chưa nhập đầy đủ, bỏ qua
            return;
        }

        // ✅ Kiểm tra ngày quá khứ trước khi gọi API
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(date + 'T00:00:00');

        if (selectedDate < today) {
            setDoctorTimeSlots({
                isWorking: false,
                slots: [],
                date,
                message: 'Không thể đặt lịch cho ngày trong quá khứ'
            });
            setAvailableSlots([]);
            return;
        }

        try {
            setLoading(true);
            console.log('Fetching time slots for doctor:', doctorId, 'date:', date);
            const response = await api.get(`/api/bookings/doctor-time-slots/${doctorId}`, {
                params: { date }
            });

            console.log('Time slots response:', response.data);

            if (response.data.success && response.data.data.isWorking) {
                // ✅ Xử lý isPastTime cho slots từ API
                const todayCheck = new Date();
                const isToday = selectedDate.toDateString() === todayCheck.toDateString();
                const currentHour = todayCheck.getHours();
                const currentMinute = todayCheck.getMinutes();

                const processedData = {
                    ...response.data.data,
                    slots: response.data.data.slots.map(slot => {
                        let isPastTime = false;
                        if (isToday) {
                            const [hour, min] = slot.startTime.split(':').map(Number);
                            const slotTimeInMinutes = hour * 60 + min;
                            const currentTimeInMinutes = currentHour * 60 + currentMinute + 30; // +30 phút buffer
                            isPastTime = slotTimeInMinutes < currentTimeInMinutes;
                        }
                        return {
                            ...slot,
                            isPastTime,
                            isAvailable: slot.isAvailable && !isPastTime
                        };
                    })
                };

                setDoctorTimeSlots(processedData);
                // Vẫn giữ availableSlots cho backward compatibility
                setAvailableSlots(
                    processedData.slots
                        .filter(s => !s.isBreakTime && s.isAvailable && !s.isPastTime)
                        .map(s => s.startTime)
                );
            } else {
                console.log('Doctor not working on this date');
                setDoctorTimeSlots(null);
                setAvailableSlots([]);
            }
        } catch (error) {
            console.error('Error fetching doctor slots:', error);
            console.error('Error details:', error.response?.data);
            setDoctorTimeSlots(null);
            setAvailableSlots([]);
            // Show error to user
            if (error.response?.status === 404) {
                alert('Không tìm thấy lịch làm việc của bác sĩ');
            } else if (error.response?.status === 500) {
                alert('Lỗi server khi tải lịch làm việc. Vui lòng thử lại sau.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // ✅ Kiểm tra ngày quá khứ ngay khi chọn - CHỈ cho appointment_date
        if (name === 'appointment_date' && value) {
            // Kiểm tra format ngày hợp lệ (YYYY-MM-DD)
            const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!dateMatch) {
                // Ngày chưa nhập đầy đủ, chỉ cập nhật state
                setFormData(prev => ({ ...prev, [name]: value }));
                return;
            }

            // ✅ Kiểm tra năm đang được gõ (chưa đủ 4 số hợp lệ)
            const year = parseInt(dateMatch[1], 10);
            const currentYear = new Date().getFullYear();

            // Chỉ bỏ qua validation nếu năm đang gõ dở (ví dụ: 0002, 0020, 0202)
            // Năm hợp lệ phải >= currentYear (không cho đặt lịch năm trước)
            if (year < 1000) {
                // Đang gõ năm, chưa đủ 4 số
                setFormData(prev => ({ ...prev, [name]: value }));
                return;
            }

            const selectedDate = new Date(value + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Kiểm tra ngày quá khứ
            if (selectedDate < today) {
                alert('⚠️ Không thể chọn ngày trong quá khứ. Vui lòng chọn ngày hôm nay hoặc sau.');
                // Reset về ngày hôm nay
                setFormData(prev => ({ ...prev, [name]: new Date().toISOString().split('T')[0] }));
                return;
            }

            // Nếu chọn ngày hôm nay, kiểm tra còn giờ nào không
            if (selectedDate.getTime() === today.getTime()) {
                const currentHour = new Date().getHours();
                if (currentHour >= 17) {
                    alert('⚠️ Đã hết giờ làm việc hôm nay. Vui lòng chọn ngày khác.');
                    return;
                }
            }
        }

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
        console.log('handleSelectDoctor called with:', doctorId, 'current:', selectedDoctor);

        if (selectedDoctor === doctorId) {
            // Bỏ chọn bác sĩ
            setSelectedDoctor(null);
            setDoctorTimeSlots(null);
            setAvailableSlots([]);
            setFormData(prev => ({
                ...prev,
                doctor_id: null,
                appointment_time: ''
            }));
            if (formData.appointment_date) {
                fetchDefaultSlots(formData.appointment_date);
            }
        } else {
            // Chọn bác sĩ - clear old data trước
            setDoctorTimeSlots(null);
            setAvailableSlots([]);
            setSelectedDoctor(doctorId);
            setFormData(prev => ({
                ...prev,
                doctor_id: doctorId,
                appointment_time: ''
            }));
            // ✅ Clear error khi chọn bác sĩ
            setErrors(prev => ({ ...prev, doctor_id: '' }));
            console.log('Doctor selected, formData.doctor_id should be:', doctorId);

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

        // ✅ Validate appointment_time - Bắt buộc phải chọn giờ
        if (!formData.appointment_time) {
            newErrors.appointment_time = 'Vui lòng chọn giờ khám';
        }

        // ✅ Nếu chọn booking with_doctor, phải chọn bác sĩ
        if (bookingType === 'with_doctor' && !formData.doctor_id) {
            newErrors.doctor_id = 'Vui lòng chọn bác sĩ';
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
            const response = await api.post('/api/bookings/create', {
                ...formData,
                booking_type: bookingType
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            alert('✅ ' + response.data.message + '\nMã đặt lịch: ' + response.data.booking.booking_code);

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
            setBookingType('instant');

            // Redirect to appointments page if logged in
            const user = localStorage.getItem('user');
            if (user) {
                setTimeout(() => {
                    navigate('/my-appointments');
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

            {/* ✅ Summary Banner khi có dịch vụ/bác sĩ được chọn sẵn */}
            {(selectedService || doctorIdFromUrl) && (
                <div className={styles.bookingSummaryBanner}>
                    <h3>📋 Thông tin đặt lịch</h3>
                    <div className={styles.summaryItems}>
                        {selectedService && (
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>💉 Dịch vụ:</span>
                                <span className={styles.summaryValue}>{selectedService.name}</span>
                                <span className={styles.summaryPrice}>
                                    {selectedService.price?.toLocaleString('vi-VN')}đ
                                </span>
                            </div>
                        )}
                        {doctorIdFromUrl && doctorNameFromUrl && (
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>👨‍⚕️ Bác sĩ:</span>
                                <span className={styles.summaryValue}>{decodeURIComponent(doctorNameFromUrl)}</span>
                            </div>
                        )}
                    </div>
                    <p className={styles.summaryNote}>
                        ✨ Bạn chỉ cần chọn ngày giờ và xác nhận thông tin bên dưới
                    </p>
                </div>
            )}

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

                    {/* ✅ NEW: Hiển thị dịch vụ đã chọn từ URL */}
                    {selectedService && (
                        <div className={styles.selectedServiceInfo}>
                            <div className={styles.serviceBadge}>
                                <span className={styles.serviceIcon}>💉</span>
                                <div className={styles.serviceDetails}>
                                    <strong>Dịch vụ đã chọn:</strong>
                                    <span className={styles.serviceName}>{selectedService.name}</span>
                                    <span className={styles.servicePrice}>
                                        💰 {selectedService.price?.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className={styles.changeServiceBtn}
                                    onClick={() => {
                                        setSelectedService(null);
                                        setFormData(prev => ({ ...prev, service_id: null }));
                                        navigate('/services');
                                    }}
                                >
                                    Đổi dịch vụ
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Hiển thị thông tin bác sĩ đã chọn từ URL */}
                    {doctorIdFromUrl && doctorNameFromUrl && (
                        <div className={styles.selectedDoctorInfo}>
                            <div className={styles.doctorBadge}>
                                <span className={styles.doctorIcon}>👨‍⚕️</span>
                                <div className={styles.doctorDetails}>
                                    <strong>Bác sĩ đã chọn:</strong>
                                    <span className={styles.doctorName}>{decodeURIComponent(doctorNameFromUrl)}</span>
                                </div>
                                <button
                                    type="button"
                                    className={styles.changeDoctorBtn}
                                    onClick={() => {
                                        setSelectedDoctor(null);
                                        setFormData(prev => ({ ...prev, doctor_id: null }));
                                        setBookingType('instant');
                                        navigate('/booking?specialty=' + formData.specialty_id, { replace: true });
                                    }}
                                >
                                    Đổi bác sĩ
                                </button>
                            </div>
                            <p className={styles.doctorNote}>
                                ✨ Bạn chỉ cần chọn <strong>ngày khám</strong> và <strong>khung giờ</strong> phù hợp
                            </p>
                        </div>
                    )}

                    {/* Chọn kiểu đặt lịch - ẩn nếu đã chọn bác sĩ từ URL */}
                    {!doctorIdFromUrl && (
                        <div className={styles.bookingTypeSelector}>
                            <div
                                className={`${styles.typeOption} ${bookingType === 'instant' ? styles.active : ''}`}
                                onClick={() => {
                                    setBookingType('instant');
                                    setSelectedDoctor(null);
                                    setDoctorTimeSlots(null);
                                    setFormData(prev => ({
                                        ...prev,
                                        doctor_id: null,
                                        appointment_time: ''
                                    }));
                                    // Nếu đã chọn ngày, load default slots
                                    if (formData.appointment_date) {
                                        fetchDefaultSlots(formData.appointment_date);
                                    }
                                }}
                            >
                                <h3>⚡ Đặt luôn</h3>
                                <p>Chúng tôi sẽ sắp xếp bác sĩ phù hợp cho bạn</p>
                            </div>
                            <div
                                className={`${styles.typeOption} ${bookingType === 'with_doctor' ? styles.active : ''}`}
                                onClick={() => {
                                    setBookingType('with_doctor');
                                    setAvailableSlots([]);
                                    setDoctorTimeSlots(null);
                                    setFormData(prev => ({
                                        ...prev,
                                        appointment_time: ''
                                    }));
                                }}
                            >
                                <h3>👨‍⚕️ Chọn bác sĩ</h3>
                                <p>Bạn chọn bác sĩ và khung giờ mong muốn</p>
                            </div>
                        </div>
                    )}

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

                        {/* Chọn bác sĩ - CHỈ hiển thị khi chọn 'with_doctor' VÀ không có doctor từ URL */}
                        {bookingType === 'with_doctor' && formData.specialty_id && !doctorIdFromUrl && (
                            <div style={{ gridColumn: '1 / -1' }} className={styles.formGroup}>
                                <label>👨‍⚕️ Chọn bác sĩ <span className={styles.required}>*</span></label>
                                {loading ? (
                                    <p>⏳ Đang tải danh sách bác sĩ...</p>
                                ) : doctors.length > 0 ? (
                                    <div className={styles.doctorsList}>
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
                                {errors.doctor_id && <span className={styles.error}>{errors.doctor_id}</span>}
                            </div>
                        )}

                        {/* Giờ khám - Hiển thị nếu chọn ngày */}
                        {formData.appointment_date ? (
                            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                <label>Giờ khám</label>
                                {loading ? (
                                    <p>⏳ Đang tải giờ rảnh...</p>
                                ) : doctorTimeSlots && doctorTimeSlots.isWorking ? (
                                    // ✅ Hiển thị grid chi tiết với màu sắc cho cả 2 chế độ
                                    <>
                                        <div className={styles.timeSlotsGrid}>
                                            {doctorTimeSlots.slots.map((slot, index) => {
                                                // Xác định trạng thái của slot
                                                const isPast = slot.isPastTime;
                                                const isBreak = slot.isBreakTime;
                                                const isBooked = slot.bookingCount > 0;
                                                const isSelected = formData.appointment_time === slot.startTime;
                                                const isDisabled = isPast || isBreak || isBooked;

                                                return (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        className={`${styles.timeSlotBtn} ${isSelected ? styles.selectedSlot :
                                                            isPast ? styles.pastSlot :
                                                                isBreak ? styles.breakTime :
                                                                    isBooked ? styles.bookedSlot :
                                                                        styles.availableSlot
                                                            }`}
                                                        onClick={() => {
                                                            if (!isDisabled) {
                                                                setFormData(prev => ({ ...prev, appointment_time: slot.startTime }));
                                                                // Clear error khi chọn
                                                                setErrors(prev => ({ ...prev, appointment_time: '' }));
                                                                console.log('Selected slot:', slot.startTime);
                                                            }
                                                        }}
                                                        disabled={isDisabled}
                                                    >
                                                        <div className={styles.slotTime}>{slot.time}</div>
                                                        {isPast ? (
                                                            <div className={styles.slotStatus}>⏰ Đã qua</div>
                                                        ) : isBreak ? (
                                                            <div className={styles.slotStatus}>☕ Nghỉ</div>
                                                        ) : isBooked ? (
                                                            <div className={styles.slotStatus}>🔒 Đã đặt</div>
                                                        ) : (
                                                            <div className={styles.slotStatus}>✓ Trống</div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <p className={styles.info}>
                                            💡 <strong>Xanh lá</strong> = còn trống •
                                            <strong> Đen</strong> = đã đặt •
                                            <strong> Xám</strong> = đã qua/nghỉ trưa
                                            {bookingType === 'instant' && ' • (Chưa chọn bác sĩ - số lượng booking chưa chính xác)'}
                                        </p>
                                        {errors.appointment_time && <span className={styles.error}>{errors.appointment_time}</span>}
                                    </>
                                ) : (
                                    <p className={styles.warning}>
                                        ⚠️ {selectedDoctor ? 'Bác sĩ này không có giờ rảnh vào ngày được chọn' : 'Không có giờ rảnh vào ngày này'}
                                    </p>
                                )}
                            </div>
                        ) : selectedDoctor && bookingType === 'with_doctor' ? (
                            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                <p className={styles.info}>
                                    💡 Vui lòng chọn <strong>Ngày khám</strong> để xem các khung giờ còn trống của bác sĩ
                                </p>
                            </div>
                        ) : null}

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
