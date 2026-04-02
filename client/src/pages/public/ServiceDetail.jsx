import React, { Component } from 'react';
import withRouter from '../../utils/withRouter';
import api from '../../utils/api';
import styles from './ServiceDetail.module.css';

class ServiceDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            service: null,
            doctors: [],
            loading: true,
            selectedDoctor: null,
            showBookingModal: false,
            availableSlots: [],
            selectedDate: '',
            selectedSlot: null,
            loadingSlots: false,
            bookingForm: {
                full_name: '',
                phone: '',
                email: '',
                symptoms: ''
            },
            submitting: false
        };
    }

    componentDidMount() {
        this.fetchServiceDetail();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.params.id !== this.props.params.id) {
            this.fetchServiceDetail();
        }
    }

    fetchServiceDetail = async () => {
        const { id } = this.props.params;
        try {
            this.setState({ loading: true });
            const serviceRes = await api.get(`/api/public/services/${id}`);
            this.setState({ service: serviceRes.data });

            if (serviceRes.data.specialty_id) {
                const doctorsRes = await api.get(`/api/public/doctors?specialty_id=${serviceRes.data.specialty_id}`);
                this.setState({ doctors: doctorsRes.data });
            }
        } catch (error) {
            console.error('Error fetching service detail:', error);
        } finally {
            this.setState({ loading: false });
        }
    };

    formatPrice = (price) => {
        if (!price) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    handleSelectDoctor = (doctor) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const bookingForm = {
            full_name: user.id ? (user.full_name || '') : '',
            phone: user.id ? (user.phone || '') : '',
            email: user.id ? (user.email || '') : '',
            symptoms: ''
        };

        this.setState({
            selectedDoctor: doctor,
            showBookingModal: true,
            selectedDate: '',
            selectedSlot: null,
            availableSlots: [],
            bookingForm
        });
    };

    handleDateChange = async (date) => {
        const { selectedDoctor } = this.state;
        this.setState({ selectedDate: date, selectedSlot: null });

        if (!date || !selectedDoctor) return;

        try {
            this.setState({ loadingSlots: true });
            const res = await api.get(`/api/patient/bookings/doctor-time-slots/${selectedDoctor.id}?date=${date}`);
            this.setState({ availableSlots: res.data || [] });
        } catch (error) {
            console.error('Error fetching slots:', error);
            this.setState({ availableSlots: [] });
        } finally {
            this.setState({ loadingSlots: false });
        }
    };

    handleBooking = async (e) => {
        e.preventDefault();
        const { selectedSlot, bookingForm, service, selectedDoctor, selectedDate } = this.state;
        const { navigate } = this.props;

        if (!selectedSlot) {
            alert('Vui lòng chọn khung giờ');
            return;
        }

        if (!bookingForm.full_name || !bookingForm.phone) {
            alert('Vui lòng điền họ tên và số điện thoại');
            return;
        }

        try {
            this.setState({ submitting: true });

            const bookingData = {
                service_id: service.id,
                specialty_id: service.specialty_id,
                doctor_id: selectedDoctor.id,
                time_slot_id: selectedSlot.id,
                appointment_date: selectedDate,
                appointment_time: selectedSlot.start_time,
                full_name: bookingForm.full_name,
                phone: bookingForm.phone,
                email: bookingForm.email,
                symptoms: bookingForm.symptoms
            };

            await api.post('/api/bookings', bookingData);

            alert('🎉 Đặt lịch thành công! Chúng tôi sẽ liên hệ xác nhận.');
            this.setState({ showBookingModal: false });
            navigate('/booking-success');
        } catch (error) {
            console.error('Error booking:', error);
            alert('❌ Đặt lịch thất bại: ' + (error.response?.data?.message || 'Vui lòng thử lại'));
        } finally {
            this.setState({ submitting: false });
        }
    };

    getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    formatTime = (time) => {
        if (!time) return '';
        return time.substring(0, 5);
    };

    render() {
        const {
            service, doctors, loading, selectedDoctor, showBookingModal,
            availableSlots, selectedDate, selectedSlot, loadingSlots,
            bookingForm, submitting
        } = this.state;
        const { navigate } = this.props;

        if (loading) {
            return <div className={styles.loading}>⏳ Đang tải...</div>;
        }

        if (!service) {
            return <div className={styles.notFound}>Không tìm thấy dịch vụ</div>;
        }

        return (
            <div className={styles.container}>
                <div className={styles.breadcrumb}>
                    <span onClick={() => navigate('/services')}>Dịch vụ</span>
                    <span className={styles.separator}>›</span>
                    <span className={styles.current}>{service.name}</span>
                </div>

                <div className={styles.serviceInfo}>
                    <div className={styles.serviceHeader}>
                        <div className={styles.serviceTitle}>
                            <h1>{service.name}</h1>
                            <div className={styles.priceTag}>{this.formatPrice(service.price)}</div>
                        </div>
                        <div className={styles.specialtyBadge}>
                            🏥 {service.specialty?.name || 'Chuyên khoa'}
                        </div>
                    </div>

                    {service.description && (
                        <p className={styles.description}>{service.description}</p>
                    )}

                    <div className={styles.serviceMeta}>
                        {service.duration && (
                            <div className={styles.metaItem}>
                                <span className={styles.metaIcon}>⏱️</span>
                                <span>Thời gian: {service.duration} phút</span>
                            </div>
                        )}
                        <div className={styles.metaItem}>
                            <span className={styles.metaIcon}>👨‍⚕️</span>
                            <span>{doctors.length} bác sĩ khả dụng</span>
                        </div>
                    </div>
                </div>

                <div className={styles.doctorsSection}>
                    <h2>👨‍⚕️ Bác sĩ thực hiện dịch vụ</h2>
                    <p className={styles.sectionSubtitle}>Chọn bác sĩ để đặt lịch khám</p>

                    {doctors.length === 0 ? (
                        <div className={styles.noDoctors}>
                            <p>Hiện chưa có bác sĩ khả dụng cho dịch vụ này</p>
                            <button
                                className={styles.btnBookGeneral}
                                onClick={() => navigate('/booking', { state: { serviceId: service.id } })}
                            >
                                📅 Đặt lịch (để phòng khám phân bổ bác sĩ)
                            </button>
                        </div>
                    ) : (
                        <div className={styles.doctorsGrid}>
                            {doctors.map(doctor => (
                                <div key={doctor.id} className={styles.doctorCard}>
                                    <div className={styles.doctorAvatar}>
                                        {doctor.avatar ? (
                                            <img src={doctor.avatar} alt={doctor.full_name} />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>
                                                {doctor.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️'}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.doctorInfo}>
                                        <h3>{doctor.full_name}</h3>
                                        <p className={styles.doctorSpecialty}>
                                            {doctor.specialty?.name || service.specialty?.name}
                                        </p>

                                        {doctor.experience && (
                                            <div className={styles.doctorMeta}>
                                                <span>📅 {doctor.experience} năm kinh nghiệm</span>
                                            </div>
                                        )}

                                        {doctor.education && (
                                            <div className={styles.doctorMeta}>
                                                <span>🎓 {doctor.education}</span>
                                            </div>
                                        )}

                                        <div className={styles.ratingInfo}>
                                            <span className={styles.stars}>⭐⭐⭐⭐⭐</span>
                                            <span className={styles.ratingText}>5.0</span>
                                        </div>
                                    </div>

                                    <button
                                        className={styles.btnSelectDoctor}
                                        onClick={() => {
                                            if (!doctor || !service) {
                                                alert('❌ Thông tin không đầy đủ');
                                                return;
                                            }

                                            const params = new URLSearchParams();
                                            params.set('doctor', doctor.id);
                                            params.set('specialty', service.specialty_id);
                                            params.set('service', service.id);
                                            params.set('doctor_name', doctor.full_name);
                                            navigate(`/booking?${params.toString()}`);
                                        }}
                                    >
                                        📅 Đặt lịch với bác sĩ này
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {showBookingModal && selectedDoctor && (
                    <div className={styles.modalOverlay} onClick={() => this.setState({ showBookingModal: false })}>
                        <div className={styles.modal} onClick={e => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>📅 Đặt lịch khám</h2>
                                <button
                                    className={styles.closeBtn}
                                    onClick={() => this.setState({ showBookingModal: false })}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className={styles.modalBody}>
                                <div className={styles.bookingSummary}>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Dịch vụ:</span>
                                        <span className={styles.summaryValue}>{service.name}</span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Bác sĩ:</span>
                                        <span className={styles.summaryValue}>{selectedDoctor.full_name}</span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Giá dịch vụ:</span>
                                        <span className={styles.summaryPrice}>{this.formatPrice(service.price)}</span>
                                    </div>
                                </div>

                                <form onSubmit={this.handleBooking}>
                                    <div className={styles.formGroup}>
                                        <label>📅 Chọn ngày khám <span className={styles.required}>*</span></label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => this.handleDateChange(e.target.value)}
                                            min={this.getMinDate()}
                                            required
                                        />
                                    </div>

                                    {selectedDate && (
                                        <div className={styles.formGroup}>
                                            <label>⏰ Chọn khung giờ <span className={styles.required}>*</span></label>
                                            {loadingSlots ? (
                                                <div className={styles.loadingSlots}>Đang tải...</div>
                                            ) : availableSlots.length === 0 ? (
                                                <div className={styles.noSlots}>
                                                    Không có khung giờ trống trong ngày này
                                                </div>
                                            ) : (
                                                <div className={styles.slotsGrid}>
                                                    {availableSlots.map(slot => (
                                                        <button
                                                            key={slot.id}
                                                            type="button"
                                                            className={`${styles.slotBtn} ${selectedSlot?.id === slot.id ? styles.selected : ''} ${!slot.is_available || slot.current_patients >= slot.max_patients ? styles.disabled : ''}`}
                                                            onClick={() => slot.is_available && slot.current_patients < slot.max_patients && this.setState({ selectedSlot: slot })}
                                                            disabled={!slot.is_available || slot.current_patients >= slot.max_patients}
                                                        >
                                                            {this.formatTime(slot.start_time)} - {this.formatTime(slot.end_time)}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className={styles.formGroup}>
                                        <label>👤 Họ và tên <span className={styles.required}>*</span></label>
                                        <input
                                            type="text"
                                            value={bookingForm.full_name}
                                            onChange={(e) => this.setState({ bookingForm: { ...bookingForm, full_name: e.target.value } })}
                                            placeholder="Nhập họ và tên"
                                            required
                                        />
                                    </div>

                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label>📱 Số điện thoại <span className={styles.required}>*</span></label>
                                            <input
                                                type="tel"
                                                value={bookingForm.phone}
                                                onChange={(e) => this.setState({ bookingForm: { ...bookingForm, phone: e.target.value } })}
                                                placeholder="Nhập số điện thoại"
                                                required
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>✉️ Email</label>
                                            <input
                                                type="email"
                                                value={bookingForm.email}
                                                onChange={(e) => this.setState({ bookingForm: { ...bookingForm, email: e.target.value } })}
                                                placeholder="Nhập email (không bắt buộc)"
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>📝 Triệu chứng / Lý do khám</label>
                                        <textarea
                                            value={bookingForm.symptoms}
                                            onChange={(e) => this.setState({ bookingForm: { ...bookingForm, symptoms: e.target.value } })}
                                            placeholder="Mô tả triệu chứng hoặc lý do bạn muốn khám..."
                                            rows={3}
                                        />
                                    </div>

                                    <div className={styles.formActions}>
                                        <button
                                            type="button"
                                            className={styles.btnCancel}
                                            onClick={() => this.setState({ showBookingModal: false })}
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            type="submit"
                                            className={styles.btnSubmit}
                                            disabled={submitting || !selectedSlot}
                                        >
                                            {submitting ? '⏳ Đang xử lý...' : '✅ Xác nhận đặt lịch'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default withRouter(ServiceDetail);
