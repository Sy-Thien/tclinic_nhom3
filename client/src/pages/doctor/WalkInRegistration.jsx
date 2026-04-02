import React, { Component } from 'react';
import withRouter from '../../utils/withRouter';
import api from '../../utils/api';
import styles from './WalkInRegistration.module.css';

class WalkInRegistration extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            searchPhone: '',
            searchResults: [],
            searching: false,
            selectedPatient: null,
            specialties: [],
            services: [],
            doctorInfo: null,
            selectedService: null,
            formData: {
                full_name: '',
                phone: '',
                email: '',
                gender: 'male',
                birthday: '',
                address: '',
                specialty_id: '',
                service_id: '',
                symptoms: '',
                note: ''
            },
            errors: {}
        };
        this.searchTimer = null;
    }

    componentDidMount() {
        this.fetchDoctorInfo();
        this.fetchSpecialties();
        this.fetchServices();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.searchPhone !== this.state.searchPhone) {
            clearTimeout(this.searchTimer);
            this.searchTimer = setTimeout(() => {
                if (this.state.searchPhone.length >= 4) {
                    this.searchPatient(this.state.searchPhone);
                } else {
                    this.setState({ searchResults: [] });
                }
            }, 500);
        }
    }

    componentWillUnmount() {
        clearTimeout(this.searchTimer);
    }

    fetchDoctorInfo = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            console.log('👤 Current user:', user);

            if (user && user.role === 'doctor') {
                const response = await api.get('/api/doctor/profile');
                const doctor = response.data.data;
                console.log('👨‍⚕️ Doctor profile:', doctor);
                this.setState({ doctorInfo: doctor });

                if (doctor.specialty_id) {
                    console.log('✅ Setting specialty_id:', doctor.specialty_id);
                    this.setState(prevState => ({
                        formData: {
                            ...prevState.formData,
                            specialty_id: doctor.specialty_id.toString()
                        }
                    }));
                }
            }
        } catch (error) {
            console.error('❌ Error fetching doctor info:', error);
            console.error('Error details:', error.response?.data);
        }
    };

    fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            this.setState({ specialties: response.data || [] });
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    fetchServices = async () => {
        try {
            const response = await api.get('/api/public/services');
            this.setState({ services: response.data || [] });
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    searchPatient = async (phone) => {
        try {
            this.setState({ searching: true });
            const response = await api.get(`/api/doctor/search-patient?phone=${phone}`);
            this.setState({ searchResults: response.data.patients || [] });
        } catch (error) {
            console.error('Error searching patient:', error);
        } finally {
            this.setState({ searching: false });
        }
    };

    handleSelectPatient = (patient) => {
        this.setState(prevState => ({
            selectedPatient: patient,
            formData: {
                ...prevState.formData,
                full_name: patient.full_name,
                phone: patient.phone,
                email: patient.email || '',
                gender: patient.gender || 'male',
                birthday: patient.birthday || '',
                address: patient.address || ''
            },
            searchPhone: '',
            searchResults: []
        }));
    };

    handleClearPatient = () => {
        this.setState(prevState => ({
            selectedPatient: null,
            formData: {
                full_name: '',
                phone: '',
                email: '',
                gender: 'male',
                birthday: '',
                address: '',
                specialty_id: prevState.formData.specialty_id,
                service_id: prevState.formData.service_id,
                symptoms: '',
                note: ''
            }
        }));
    };

    handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'birthday' && value) {
            const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!dateMatch) {
                this.setState(prevState => ({
                    formData: { ...prevState.formData, [name]: value }
                }));
                return;
            }

            const year = parseInt(dateMatch[1], 10);
            const currentYear = new Date().getFullYear();
            if (year < 1900 || year > currentYear) {
                this.setState(prevState => ({
                    formData: { ...prevState.formData, [name]: value }
                }));
                return;
            }

            const selectedDate = new Date(value + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate > today) {
                alert('⚠️ Ngày sinh không thể là ngày trong tương lai.');
                return;
            }
        }

        if (name === 'specialty_id') {
            this.setState(prevState => ({
                formData: { ...prevState.formData, [name]: value, service_id: '' },
                selectedService: null
            }));
        } else if (name === 'service_id') {
            const service = this.state.services.find(s => s.id === parseInt(value));
            this.setState(prevState => ({
                selectedService: service,
                formData: { ...prevState.formData, [name]: value }
            }));
        } else {
            this.setState(prevState => ({
                formData: { ...prevState.formData, [name]: value }
            }));
        }

        if (this.state.errors[name]) {
            this.setState(prevState => ({
                errors: { ...prevState.errors, [name]: '' }
            }));
        }
    };

    validateForm = () => {
        const { formData } = this.state;
        const newErrors = {};

        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Vui lòng nhập họ tên';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại';
        } else if (!/^[0-9]{10}$/.test(formData.phone)) {
            newErrors.phone = 'Số điện thoại không hợp lệ (10 số)';
        }

        if (!formData.symptoms.trim()) {
            newErrors.symptoms = 'Vui lòng nhập triệu chứng/lý do khám';
        }

        if (!formData.service_id) {
            newErrors.service_id = 'Vui lòng chọn dịch vụ khám';
        }

        this.setState({ errors: newErrors });
        return Object.keys(newErrors).length === 0;
    };

    handleSubmit = async (e) => {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        try {
            this.setState({ loading: true });

            const { formData } = this.state;
            const submitData = {
                ...formData,
                specialty_id: formData.specialty_id ? parseInt(formData.specialty_id) : null,
                service_id: formData.service_id ? parseInt(formData.service_id) : null
            };

            console.log('📤 Submitting walk-in data:', submitData);

            const response = await api.post('/api/doctor/walk-in', submitData);

            if (response.data.success) {
                alert(response.data.message);
                this.props.navigate(`/doctor-portal/examination?bookingId=${response.data.booking.id}`);
            }
        } catch (error) {
            console.error('Error creating walk-in:', error);
            alert(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            this.setState({ loading: false });
        }
    };

    render() {
        const { navigate } = this.props;
        const {
            loading, searchPhone, searchResults, searching,
            selectedPatient, doctorInfo, selectedService,
            formData, errors, services
        } = this.state;

        // Lọc dịch vụ theo chuyên khoa đã chọn
        const filteredServices = formData.specialty_id
            ? services.filter(svc => svc.specialty_id === parseInt(formData.specialty_id))
            : services;

        console.log('🔍 Filter Info:', {
            specialty_id: formData.specialty_id,
            total_services: services.length,
            filtered_services: filteredServices.length,
            doctorSpecialtyId: doctorInfo?.specialty_id
        });

        return (
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => navigate('/doctor-portal')}>
                        <i className="fas fa-arrow-left"></i>
                        Quay lại
                    </button>
                    <h1>🚶 Tiếp Nhận Bệnh Nhân Trực Tiếp</h1>
                </div>

                {/* Search Patient */}
                <div className={styles.searchSection}>
                    <div className={styles.searchCard}>
                        <h3>🔍 Tìm bệnh nhân có hồ sơ</h3>
                        <p className={styles.searchHint}>Nhập SĐT để kiểm tra bệnh nhân đã có hồ sơ chưa</p>

                        <div className={styles.searchInput}>
                            <input
                                type="text"
                                placeholder="Nhập số điện thoại..."
                                value={searchPhone}
                                onChange={(e) => this.setState({ searchPhone: e.target.value })}
                            />
                            {searching && <span className={styles.searchingText}>Đang tìm...</span>}
                        </div>

                        {searchResults.length > 0 && (
                            <div className={styles.searchResults}>
                                {searchResults.map(patient => (
                                    <div
                                        key={patient.id}
                                        className={styles.resultItem}
                                        onClick={() => this.handleSelectPatient(patient)}
                                    >
                                        <div className={styles.resultInfo}>
                                            <strong>{patient.full_name}</strong>
                                            <span>{patient.phone}</span>
                                        </div>
                                        <span className={styles.selectBtn}>Chọn</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedPatient && (
                            <div className={styles.selectedPatient}>
                                <div className={styles.selectedInfo}>
                                    <span className={styles.badge}>✓ Đã chọn bệnh nhân</span>
                                    <strong>{selectedPatient.full_name}</strong>
                                    <span>{selectedPatient.phone}</span>
                                </div>
                                <button className={styles.clearBtn} onClick={this.handleClearPatient}>
                                    ✕ Hủy chọn
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Registration Form */}
                <form onSubmit={this.handleSubmit} className={styles.form}>
                    <div className={styles.formGrid}>
                        {/* Thông tin bệnh nhân */}
                        <div className={styles.formSection}>
                            <h3>📋 Thông tin bệnh nhân</h3>

                            <div className={styles.formGroup}>
                                <label>Họ và tên <span className={styles.required}>*</span></label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={this.handleChange}
                                    placeholder="Nhập họ và tên"
                                    className={errors.full_name ? styles.inputError : ''}
                                />
                                {errors.full_name && <span className={styles.error}>{errors.full_name}</span>}
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Số điện thoại <span className={styles.required}>*</span></label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={this.handleChange}
                                        placeholder="0912345678"
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
                                        onChange={this.handleChange}
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Giới tính</label>
                                    <select name="gender" value={formData.gender} onChange={this.handleChange}>
                                        <option value="male">Nam</option>
                                        <option value="female">Nữ</option>
                                        <option value="other">Khác</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Ngày sinh</label>
                                    <input
                                        type="date"
                                        name="birthday"
                                        value={formData.birthday}
                                        onChange={this.handleChange}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Địa chỉ</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={this.handleChange}
                                    placeholder="Số nhà, đường, phường/xã, quận/huyện"
                                />
                            </div>
                        </div>

                        {/* Thông tin khám */}
                        <div className={styles.formSection}>
                            <h3>🩺 Thông tin khám bệnh</h3>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Chuyên khoa</label>
                                    <input
                                        type="text"
                                        value={doctorInfo?.Specialty?.name || 'Đang tải...'}
                                        disabled
                                        className={styles.autoFilled}
                                    />
                                    <span className={styles.hint}>
                                        ✓ Tự động lấy theo chuyên khoa của bạn
                                    </span>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Dịch vụ <span className={styles.required}>*</span></label>
                                    <select
                                        name="service_id"
                                        value={formData.service_id}
                                        onChange={this.handleChange}
                                        disabled={!formData.specialty_id}
                                        className={errors.service_id ? styles.inputError : ''}
                                    >
                                        <option value="">
                                            {formData.specialty_id
                                                ? '-- Chọn dịch vụ --'
                                                : '-- Chọn chuyên khoa trước --'}
                                        </option>
                                        {filteredServices.map(svc => (
                                            <option key={svc.id} value={svc.id}>
                                                {svc.name} - {parseInt(svc.price).toLocaleString('vi-VN')}đ
                                            </option>
                                        ))}
                                    </select>
                                    {errors.service_id && <span className={styles.error}>{errors.service_id}</span>}
                                    {formData.specialty_id && filteredServices.length === 0 && (
                                        <span className={styles.hint}>Không có dịch vụ cho chuyên khoa này</span>
                                    )}
                                    {selectedService && (
                                        <div className={styles.priceInfo}>
                                            <span className={styles.priceLabel}>💰 Chi phí khám:</span>
                                            <span className={styles.priceValue}>
                                                {parseInt(selectedService.price).toLocaleString('vi-VN')} VNĐ
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Triệu chứng / Lý do khám <span className={styles.required}>*</span></label>
                                <textarea
                                    name="symptoms"
                                    value={formData.symptoms}
                                    onChange={this.handleChange}
                                    placeholder="Mô tả triệu chứng, lý do khám bệnh..."
                                    rows={4}
                                    className={errors.symptoms ? styles.inputError : ''}
                                />
                                {errors.symptoms && <span className={styles.error}>{errors.symptoms}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label>Ghi chú</label>
                                <textarea
                                    name="note"
                                    value={formData.note}
                                    onChange={this.handleChange}
                                    placeholder="Ghi chú thêm..."
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={() => navigate('/doctor-portal')}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className={styles.spinner}></span>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-user-plus"></i>
                                    Tạo hồ sơ & Bắt đầu khám
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        );
    }
}

export default withRouter(WalkInRegistration);
