import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './BookingSchedule.module.css';

export default function BookingSchedule() {
    const [specialties, setSpecialties] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Booking form
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingData, setBookingData] = useState({
        patient_name: '',
        patient_email: '',
        patient_phone: '',
        patient_gender: 'male',
        patient_dob: '',
        patient_address: '',
        symptoms: '',
        note: ''
    });

    useEffect(() => {
        fetchSpecialties();
    }, []);

    useEffect(() => {
        if (selectedSpecialty) {
            fetchDoctorsBySpecialty(selectedSpecialty);
        }
    }, [selectedSpecialty]);

    useEffect(() => {
        if (selectedDate) {
            fetchAvailableTimeSlots();
        }
    }, [selectedDate, selectedDoctor, selectedSpecialty]);

    const fetchSpecialties = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/public/specialties');
            setSpecialties(response.data);
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    const fetchDoctorsBySpecialty = async (specialtyId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/public/doctors?specialty_id=${specialtyId}`);
            setDoctors(response.data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const fetchAvailableTimeSlots = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('date', selectedDate);
            if (selectedDoctor) params.append('doctor_id', selectedDoctor);
            if (selectedSpecialty) params.append('specialty_id', selectedSpecialty);

            const response = await axios.get(`http://localhost:5000/api/time-slots/available?${params}`);
            setTimeSlots(response.data);
        } catch (error) {
            console.error('Error fetching time slots:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSlot = (slot) => {
        setSelectedSlot(slot);
        setShowBookingForm(true);
    };

    const handleBookingChange = (e) => {
        const { name, value } = e.target;
        setBookingData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitBooking = async (e) => {
        e.preventDefault();

        if (!selectedSlot) {
            alert('Vui lòng chọn khung giờ');
            return;
        }

        try {
            // Giả sử bạn có API booking
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/bookings', {
                ...bookingData,
                doctor_id: selectedSlot.doctor_id,
                appointment_date: selectedSlot.date,
                appointment_time: selectedSlot.start_time,
                time_slot_id: selectedSlot.id,
                specialty_id: selectedSlot.doctor.specialty_id
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            alert('✅ Đặt lịch khám thành công!');
            setShowBookingForm(false);
            setSelectedSlot(null);
            setBookingData({
                patient_name: '',
                patient_email: '',
                patient_phone: '',
                patient_gender: 'male',
                patient_dob: '',
                patient_address: '',
                symptoms: '',
                note: ''
            });
            fetchAvailableTimeSlots();
        } catch (error) {
            alert('❌ ' + (error.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch'));
        }
    };

    const groupSlotsByDoctor = () => {
        const grouped = {};
        timeSlots.forEach(slot => {
            const doctorId = slot.doctor_id;
            if (!grouped[doctorId]) {
                grouped[doctorId] = {
                    doctor: slot.doctor,
                    slots: []
                };
            }
            grouped[doctorId].slots.push(slot);
        });
        return Object.values(grouped);
    };

    const getDayName = (dateString) => {
        const date = new Date(dateString);
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return days[date.getDay()];
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>📅 Đặt Lịch Khám Bệnh</h1>
                <p>Chọn ngày và khung giờ phù hợp để đặt lịch khám</p>
            </div>

            {/* FILTERS */}
            <div className={styles.filterSection}>
                <div className={styles.filterCard}>
                    <h3>🔍 Tìm Kiếm</h3>
                    <div className={styles.filterGrid}>
                        <div className={styles.filterGroup}>
                            <label>Chuyên khoa</label>
                            <select
                                value={selectedSpecialty}
                                onChange={(e) => {
                                    setSelectedSpecialty(e.target.value);
                                    setSelectedDoctor('');
                                }}
                            >
                                <option value="">-- Tất cả chuyên khoa --</option>
                                {specialties.map(spec => (
                                    <option key={spec.id} value={spec.id}>
                                        {spec.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedSpecialty && (
                            <div className={styles.filterGroup}>
                                <label>Bác sĩ</label>
                                <select
                                    value={selectedDoctor}
                                    onChange={(e) => setSelectedDoctor(e.target.value)}
                                >
                                    <option value="">-- Tất cả bác sĩ --</option>
                                    {doctors.map(doctor => (
                                        <option key={doctor.id} value={doctor.id}>
                                            {doctor.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className={styles.filterGroup}>
                            <label>Ngày khám</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* DATE DISPLAY */}
            <div className={styles.dateDisplay}>
                <div className={styles.dateBox}>
                    <span className={styles.dayName}>{getDayName(selectedDate)}</span>
                    <span className={styles.dateValue}>{new Date(selectedDate).toLocaleDateString('vi-VN')}</span>
                </div>
            </div>

            {/* TIME SLOTS DISPLAY */}
            <div className={styles.slotsSection}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Đang tải lịch khám...</p>
                    </div>
                ) : timeSlots.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>📭</div>
                        <h3>Không có lịch khám</h3>
                        <p>Không tìm thấy khung giờ nào cho ngày này. Vui lòng chọn ngày khác.</p>
                    </div>
                ) : (
                    <div className={styles.doctorsList}>
                        {groupSlotsByDoctor().map(({ doctor, slots }) => (
                            <div key={doctor.id} className={styles.doctorCard}>
                                <div className={styles.doctorHeader}>
                                    <div className={styles.doctorInfo}>
                                        <h3>👨‍⚕️ {doctor.full_name}</h3>
                                        <p className={styles.doctorSpecialty}>
                                            {doctor.specialty?.name}
                                        </p>
                                    </div>
                                    <div className={styles.availableCount}>
                                        <span>{slots.length} khung giờ</span>
                                    </div>
                                </div>

                                <div className={styles.timeSlotsGrid}>
                                    {slots.map(slot => {
                                        const available = slot.current_patients < slot.max_patients;
                                        const remaining = slot.max_patients - slot.current_patients;

                                        return (
                                            <button
                                                key={slot.id}
                                                className={`${styles.timeSlot} ${!available ? styles.timeSlotFull : ''}`}
                                                onClick={() => available && handleSelectSlot(slot)}
                                                disabled={!available}
                                            >
                                                <div className={styles.timeSlotTime}>
                                                    {slot.start_time} - {slot.end_time}
                                                </div>
                                                <div className={styles.timeSlotInfo}>
                                                    {available ? (
                                                        <span className={styles.available}>
                                                            ✅ Còn {remaining} chỗ
                                                        </span>
                                                    ) : (
                                                        <span className={styles.full}>❌ Đã đầy</span>
                                                    )}
                                                </div>
                                                {slot.room && (
                                                    <div className={styles.roomInfo}>
                                                        🏥 {slot.room.name}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* BOOKING MODAL */}
            {showBookingForm && selectedSlot && (
                <div className={styles.modal} onClick={() => setShowBookingForm(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>📝 Thông Tin Đặt Lịch</h2>
                            <button
                                className={styles.btnClose}
                                onClick={() => setShowBookingForm(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.selectedSlotInfo}>
                            <h3>Thông tin lịch khám đã chọn:</h3>
                            <div className={styles.infoGrid}>
                                <div>
                                    <strong>Bác sĩ:</strong>
                                    <span>{selectedSlot.doctor.full_name}</span>
                                </div>
                                <div>
                                    <strong>Chuyên khoa:</strong>
                                    <span>{selectedSlot.doctor.specialty?.name}</span>
                                </div>
                                <div>
                                    <strong>Ngày khám:</strong>
                                    <span>{selectedSlot.date}</span>
                                </div>
                                <div>
                                    <strong>Giờ khám:</strong>
                                    <span>{selectedSlot.start_time} - {selectedSlot.end_time}</span>
                                </div>
                                {selectedSlot.room && (
                                    <div>
                                        <strong>Phòng:</strong>
                                        <span>{selectedSlot.room.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleSubmitBooking} className={styles.bookingForm}>
                            <h3>Thông tin bệnh nhân:</h3>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Họ và tên <span className={styles.required}>*</span></label>
                                    <input
                                        type="text"
                                        name="patient_name"
                                        value={bookingData.patient_name}
                                        onChange={handleBookingChange}
                                        required
                                        placeholder="Nhập họ tên"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Số điện thoại <span className={styles.required}>*</span></label>
                                    <input
                                        type="tel"
                                        name="patient_phone"
                                        value={bookingData.patient_phone}
                                        onChange={handleBookingChange}
                                        required
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="patient_email"
                                        value={bookingData.patient_email}
                                        onChange={handleBookingChange}
                                        placeholder="Nhập email (tùy chọn)"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Ngày sinh</label>
                                    <input
                                        type="date"
                                        name="patient_dob"
                                        value={bookingData.patient_dob}
                                        onChange={handleBookingChange}
                                    />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Giới tính</label>
                                    <select
                                        name="patient_gender"
                                        value={bookingData.patient_gender}
                                        onChange={handleBookingChange}
                                    >
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
                                        value={bookingData.patient_address}
                                        onChange={handleBookingChange}
                                        placeholder="Nhập địa chỉ"
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Triệu chứng / Lý do khám <span className={styles.required}>*</span></label>
                                <textarea
                                    name="symptoms"
                                    value={bookingData.symptoms}
                                    onChange={handleBookingChange}
                                    required
                                    rows={4}
                                    placeholder="Mô tả triệu chứng hoặc lý do cần khám..."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Ghi chú thêm</label>
                                <textarea
                                    name="note"
                                    value={bookingData.note}
                                    onChange={handleBookingChange}
                                    rows={2}
                                    placeholder="Ghi chú thêm (nếu có)..."
                                />
                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    className={styles.btnCancel}
                                    onClick={() => setShowBookingForm(false)}
                                >
                                    Hủy
                                </button>
                                <button type="submit" className={styles.btnSubmit}>
                                    ✅ Xác Nhận Đặt Lịch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
