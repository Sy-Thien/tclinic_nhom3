import React, { Component } from 'react';
import api from '../../utils/api';
import withRouter from '../../utils/withRouter';
import styles from './Booking.module.css';

class Booking extends Component {
    constructor(props) {
        super(props);

        const { searchParams } = this.props;
        const doctorIdFromUrl = searchParams.get('doctor');
        const doctorNameFromUrl = searchParams.get('doctor_name');
        const serviceIdFromUrl = searchParams.get('service');

        this.doctorIdFromUrl = doctorIdFromUrl;
        this.doctorNameFromUrl = doctorNameFromUrl;
        this.serviceIdFromUrl = serviceIdFromUrl;

        this.state = {
            formData: {
                patient_name: '',
                patient_email: '',
                patient_phone: '',
                patient_dob: '',
                patient_gender: 'male',
                patient_address: '',
                specialty_id: searchParams.get('specialty') || '',
                appointment_date: searchParams.get('date') || '',
                appointment_time: searchParams.get('time') || '',
                doctor_id: doctorIdFromUrl ? Number(doctorIdFromUrl) : null,
                service_id: serviceIdFromUrl ? Number(serviceIdFromUrl) : null,
                symptoms: searchParams.get('symptoms') || '',
                note: ''
            },
            bookingType: doctorIdFromUrl ? 'with_doctor' : 'instant',
            specialties: [],
            doctors: [],
            services: [],
            selectedService: null,
            availableSlots: [],
            doctorTimeSlots: null,
            selectedDoctor: doctorIdFromUrl ? Number(doctorIdFromUrl) : null,
            loading: false,
            errors: {}
        };
    }

    componentDidMount() {
        const { navigate } = this.props;

        // ✅ Bắt buộc đăng nhập mới đặt lịch được
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (!token || !userStr) {
            alert('Vui lòng đăng nhập để đặt lịch khám');
            navigate('/login', { state: { from: '/booking' + window.location.search } });
            return;
        }

        // ✅ Auto-fill thông tin người dùng đã đăng nhập
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                console.log('✅ Auto-filling user info:', user);
                this.setState(prev => ({
                    formData: {
                        ...prev.formData,
                        patient_name: prev.formData.patient_name || user.full_name || user.name || '',
                        patient_email: prev.formData.patient_email || user.email || '',
                        patient_phone: prev.formData.patient_phone || user.phone || '',
                        patient_dob: prev.formData.patient_dob || user.birthday || user.date_of_birth || '',
                        patient_gender: prev.formData.patient_gender || user.gender || 'male',
                        patient_address: prev.formData.patient_address || user.address || ''
                    }
                }));
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }

        // ✅ Validate params từ URL ngay khi load
        this.validateURLParams();

        // Load specialties
        this.fetchSpecialties();

        // ✅ If service_id from URL, fetch service info
        if (this.serviceIdFromUrl) {
            this.fetchServiceInfo(this.serviceIdFromUrl);
        }

        // Load bác sĩ nếu đã có specialty
        if (this.state.formData.specialty_id) {
            this.fetchDoctorsBySpecialty(this.state.formData.specialty_id);
            this.fetchServicesBySpecialty(this.state.formData.specialty_id);
        }

        // Sync selectedDoctor if doctor_id comes from URL
        const { formData } = this.state;
        if (formData.doctor_id && formData.appointment_date) {
            this.fetchAvailableSlotsForDoctor(formData.doctor_id, formData.appointment_date);
        } else if (!formData.doctor_id && formData.appointment_date) {
            this.fetchDefaultSlots(formData.appointment_date);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const { formData: prevFormData } = prevState;
        const { formData } = this.state;

        // Load bác sĩ và dịch vụ khi chọn chuyên khoa
        if (prevFormData.specialty_id !== formData.specialty_id && formData.specialty_id) {
            this.fetchDoctorsBySpecialty(formData.specialty_id);
            this.fetchServicesBySpecialty(formData.specialty_id);
        }

        // Load giờ rảnh khi chọn ngày hoặc đổi bác sĩ
        if (prevFormData.appointment_date !== formData.appointment_date || prevState.selectedDoctor !== this.state.selectedDoctor) {
            if (formData.appointment_date) {
                const dateMatch = formData.appointment_date.match(/^\d{4}-\d{2}-\d{2}$/);
                if (dateMatch) {
                    if (this.state.selectedDoctor) {
                        this.fetchAvailableSlotsForDoctor(this.state.selectedDoctor, formData.appointment_date);
                    } else if (formData.specialty_id) {
                        this.fetchDefaultSlots(formData.appointment_date);
                    }
                }
            }
        }
    }

    validateURLParams = () => {
        const { searchParams, navigate } = this.props;
        let hasInvalidParams = false;
        const newParams = new URLSearchParams(searchParams);

        const dateParam = searchParams.get('date');
        if (dateParam) {
            const selectedDate = new Date(dateParam + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                console.warn('⚠️ Ngày trong URL đã qua:', dateParam);
                newParams.delete('date');
                this.setState(prev => ({ formData: { ...prev.formData, appointment_date: '' } }));
                hasInvalidParams = true;
            }
        }

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
                        this.setState(prev => ({ formData: { ...prev.formData, appointment_time: '' } }));
                        hasInvalidParams = true;
                    }
                }
            }
        }

        if (hasInvalidParams) {
            navigate({ search: newParams.toString() }, { replace: true });
            alert('⚠️ Một số thông tin từ URL không hợp lệ (ngày/giờ đã qua) và đã được loại bỏ. Vui lòng chọn lại.');
        }
    };

    fetchServiceInfo = async (serviceId) => {
        try {
            console.log('📋 Fetching service info for ID:', serviceId);
            const response = await api.get(`/api/public/services/${serviceId}`);
            console.log('✅ Service loaded:', response.data);
            this.setState(prev => ({
                selectedService: response.data,
                formData: {
                    ...prev.formData,
                    service_id: Number(serviceId),
                    specialty_id: response.data.specialty_id || prev.formData.specialty_id
                }
            }));
        } catch (error) {
            console.error('❌ Error fetching service:', error);
        }
    };

    fetchServicesBySpecialty = async (specialtyId) => {
        try {
            const response = await api.get(`/api/public/services?specialty_id=${specialtyId}`);
            this.setState({ services: response.data || [] });
        } catch (error) {
            console.error('Error fetching services:', error);
            this.setState({ services: [] });
        }
    };

    fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            this.setState({ specialties: response.data });
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    fetchDoctorsBySpecialty = async (specialtyId) => {
        try {
            this.setState({ loading: true });
            // Cập nhật endpoint backend mới và query parameter đúng format
            const response = await api.get('/api/patient/bookings/doctors', {
                params: { specialty_id: specialtyId }
            });
            // Endpoint mới trả về rổ data dạng { doctors: [...] }
            const newState = { doctors: response.data.doctors || [] };
            if (!this.doctorIdFromUrl) {
                newState.selectedDoctor = null;
            }
            this.setState(prev => ({
                ...newState,
                formData: this.doctorIdFromUrl ? prev.formData : { ...prev.formData, doctor_id: null }
            }));
        } catch (error) {
            console.error('Error fetching doctors:', error);
            this.setState({ doctors: [] });
        } finally {
            this.setState({ loading: false });
        }
    };

    fetchDefaultSlots = async (date) => {
        const dateMatch = date?.match(/^\d{4}-\d{2}-\d{2}$/);
        if (!dateMatch) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(date + 'T00:00:00');

        if (selectedDate < today) {
            this.setState({
                doctorTimeSlots: {
                    isWorking: false,
                    slots: [],
                    date,
                    message: 'Không thể đặt lịch cho ngày trong quá khứ'
                },
                availableSlots: []
            });
            return;
        }

        const defaultSlots = [];
        const workingHours = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
        ];

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
            const isBreakTime = hour === 12;

            let isPastTime = false;
            if (isToday) {
                const slotTimeInMinutes = hour * 60 + min;
                const currentTimeInMinutes = currentHour * 60 + currentMinute + 30;
                isPastTime = slotTimeInMinutes < currentTimeInMinutes;
            }

            defaultSlots.push({
                time: `${startTime}-${endTime}`,
                startTime,
                endTime,
                isBreakTime,
                bookingCount: 0,
                isAvailable: !isBreakTime && !isPastTime,
                isPastTime
            });
        }

        this.setState({
            doctorTimeSlots: {
                isWorking: true,
                slots: defaultSlots,
                date,
                schedule: {
                    start_time: '08:00',
                    end_time: '17:00',
                    break_start: '12:00',
                    break_end: '13:00'
                }
            },
            availableSlots: workingHours.filter(h => {
                if (h.startsWith('12:')) return false;
                if (isToday) {
                    const [hour, min] = h.split(':').map(Number);
                    const slotTimeInMinutes = hour * 60 + min;
                    const currentTimeInMinutes = currentHour * 60 + currentMinute + 30;
                    return slotTimeInMinutes >= currentTimeInMinutes;
                }
                return true;
            })
        });
    };

    fetchAvailableSlotsForDoctor = async (doctorId, date) => {
        if (!doctorId || !date) return;

        const dateMatch = date?.match(/^\d{4}-\d{2}-\d{2}$/);
        if (!dateMatch) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(date + 'T00:00:00');

        if (selectedDate < today) {
            this.setState({
                doctorTimeSlots: {
                    isWorking: false,
                    slots: [],
                    date,
                    message: 'Không thể đặt lịch cho ngày trong quá khứ'
                },
                availableSlots: []
            });
            return;
        }

        try {
            this.setState({ loading: true });
            console.log('Fetching time slots for doctor:', doctorId, 'date:', date);
            const response = await api.get(`/api/patient/bookings/doctor-time-slots/${doctorId}`, {
                params: { date }
            });

            console.log('Time slots response:', response.data);

            if (response.data.success && response.data.data.isWorking) {
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
                            const currentTimeInMinutes = currentHour * 60 + currentMinute + 30;
                            isPastTime = slotTimeInMinutes < currentTimeInMinutes;
                        }
                        return {
                            ...slot,
                            isPastTime,
                            isAvailable: slot.isAvailable && !isPastTime
                        };
                    })
                };

                this.setState({
                    doctorTimeSlots: processedData,
                    availableSlots: processedData.slots
                        .filter(s => !s.isBreakTime && s.isAvailable && !s.isPastTime)
                        .map(s => s.startTime)
                });
            } else {
                console.log('Doctor not working on this date');
                this.setState({ doctorTimeSlots: null, availableSlots: [] });
            }
        } catch (error) {
            console.error('Error fetching doctor slots:', error);
            console.error('Error details:', error.response?.data);
            this.setState({ doctorTimeSlots: null, availableSlots: [] });
            if (error.response?.status === 404) {
                alert('Không tìm thấy lịch làm việc của bác sĩ');
            } else if (error.response?.status === 500) {
                alert('Lỗi server khi tải lịch làm việc. Vui lòng thử lại sau.');
            }
        } finally {
            this.setState({ loading: false });
        }
    };

    handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'appointment_date' && value) {
            const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!dateMatch) {
                this.setState(prev => ({ formData: { ...prev.formData, [name]: value } }));
                return;
            }

            const year = parseInt(dateMatch[1], 10);
            if (year < 1000) {
                this.setState(prev => ({ formData: { ...prev.formData, [name]: value } }));
                return;
            }

            const selectedDate = new Date(value + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                alert('⚠️ Không thể chọn ngày trong quá khứ. Vui lòng chọn ngày hôm nay hoặc sau.');
                this.setState(prev => ({
                    formData: { ...prev.formData, [name]: new Date().toISOString().split('T')[0], appointment_time: '' }
                }));
                return;
            }

            if (selectedDate.getTime() === today.getTime()) {
                const currentHour = new Date().getHours();
                if (currentHour >= 17) {
                    alert('⚠️ Đã hết giờ làm việc hôm nay. Vui lòng chọn ngày khác.');
                    return;
                }
            }
        }

        this.setState(prev => {
            const newFormData = { ...prev.formData, [name]: value };
            const newErrors = { ...prev.errors };

            if (newErrors[name]) {
                delete newErrors[name];
            }

            if (name === 'appointment_date') {
                newFormData.appointment_time = '';
            }

            return { formData: newFormData, errors: newErrors };
        });
    };

    handleSelectDoctor = (doctorId) => {
        const { selectedDoctor, formData } = this.state;
        console.log('handleSelectDoctor called with:', doctorId, 'current:', selectedDoctor);

        if (selectedDoctor === doctorId) {
            this.setState(prev => ({
                selectedDoctor: null,
                doctorTimeSlots: null,
                availableSlots: [],
                formData: { ...prev.formData, doctor_id: null, appointment_time: '' }
            }), () => {
                if (this.state.formData.appointment_date) {
                    this.fetchDefaultSlots(this.state.formData.appointment_date);
                }
            });
        } else {
            this.setState(prev => ({
                doctorTimeSlots: null,
                availableSlots: [],
                selectedDoctor: doctorId,
                formData: { ...prev.formData, doctor_id: doctorId, appointment_time: '' },
                errors: { ...prev.errors, doctor_id: '' }
            }), () => {
                console.log('Doctor selected, formData.doctor_id should be:', doctorId);
                if (this.state.formData.appointment_date) {
                    this.fetchAvailableSlotsForDoctor(doctorId, this.state.formData.appointment_date);
                }
            });
        }
    };

    validateForm = () => {
        const { formData, bookingType } = this.state;
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

        if (!formData.appointment_time) {
            newErrors.appointment_time = 'Vui lòng chọn giờ khám';
        }

        if (bookingType === 'with_doctor' && !formData.doctor_id) {
            newErrors.doctor_id = 'Vui lòng chọn bác sĩ';
        }

        this.setState({ errors: newErrors });
        return Object.keys(newErrors).length === 0;
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        if (!this.validateForm()) return;

        const { navigate, searchParams } = this.props;
        const { formData, bookingType } = this.state;

        this.setState({ loading: true });

        try {
            const response = await api.post('/api/patient/bookings/create', {
                ...formData,
                booking_type: bookingType
            });

            alert('✅ ' + response.data.message + '\nMã đặt lịch: ' + response.data.booking.booking_code);

            this.setState({
                formData: {
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
                    service_id: null,
                    symptoms: '',
                    note: ''
                },
                selectedDoctor: null,
                bookingType: 'instant'
            });

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
            this.setState({ loading: false });
        }
    };

    render() {
        const { navigate } = this.props;
        const {
            formData, bookingType, specialties, doctors, selectedService,
            doctorTimeSlots, selectedDoctor, loading, errors
        } = this.state;
        const { doctorIdFromUrl, doctorNameFromUrl } = this;

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

                <form onSubmit={this.handleSubmit} className={styles.form}>
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
                                    onChange={this.handleChange}
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
                                    onChange={this.handleChange}
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
                                    onChange={this.handleChange}
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
                                    onChange={this.handleChange}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Giới tính</label>
                                <select name="patient_gender" value={formData.patient_gender} onChange={this.handleChange}>
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
                                    onChange={this.handleChange}
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
                                            this.setState(prev => ({
                                                selectedService: null,
                                                formData: { ...prev.formData, service_id: null }
                                            }));
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
                                            this.setState(prev => ({
                                                selectedDoctor: null,
                                                formData: { ...prev.formData, doctor_id: null },
                                                bookingType: 'instant'
                                            }));
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
                                        this.setState(prev => ({
                                            bookingType: 'instant',
                                            selectedDoctor: null,
                                            doctorTimeSlots: null,
                                            formData: { ...prev.formData, doctor_id: null, appointment_time: '' }
                                        }), () => {
                                            if (this.state.formData.appointment_date) {
                                                this.fetchDefaultSlots(this.state.formData.appointment_date);
                                            }
                                        });
                                    }}
                                >
                                    <h3>⚡ Đặt luôn</h3>
                                    <p>Chúng tôi sẽ sắp xếp bác sĩ phù hợp cho bạn</p>
                                </div>
                                <div
                                    className={`${styles.typeOption} ${bookingType === 'with_doctor' ? styles.active : ''}`}
                                    onClick={() => {
                                        this.setState(prev => ({
                                            bookingType: 'with_doctor',
                                            availableSlots: [],
                                            doctorTimeSlots: null,
                                            formData: { ...prev.formData, appointment_time: '' }
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
                                    onChange={this.handleChange}
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
                                    onChange={this.handleChange}
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
                                            {doctors.map(doc => (
                                                <div
                                                    key={doc.id}
                                                    className={`${styles.doctorOption} ${selectedDoctor === doc.id ? styles.selected : ''}`}
                                                    onClick={() => this.handleSelectDoctor(doc.id)}
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
                                        <>
                                            <div className={styles.timeSlotsGrid}>
                                                {doctorTimeSlots.slots.map((slot, index) => {
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
                                                                    this.setState(prev => ({
                                                                        formData: { ...prev.formData, appointment_time: slot.startTime },
                                                                        errors: { ...prev.errors, appointment_time: '' }
                                                                    }));
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
                                    onChange={this.handleChange}
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
                                    onChange={this.handleChange}
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
}

export default withRouter(Booking);
