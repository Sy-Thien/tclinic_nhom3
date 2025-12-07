import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './WalkInRegistration.module.css';

export default function WalkInRegistration() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [searchPhone, setSearchPhone] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [specialties, setSpecialties] = useState([]);
    const [services, setServices] = useState([]);
    const [doctorInfo, setDoctorInfo] = useState(null); // ✅ Thông tin bác sĩ hiện tại

    const [formData, setFormData] = useState({
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
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchDoctorInfo(); // ✅ Lấy thông tin bác sĩ trước
        fetchSpecialties();
        fetchServices();
    }, []);

    // ✅ Lấy thông tin bác sĩ hiện tại
    const fetchDoctorInfo = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            console.log('👤 Current user:', user); // Debug

            if (user && user.role === 'doctor') {
                // Lấy thông tin chi tiết bác sĩ từ API
                const response = await api.get('/api/doctor/profile');
                const doctor = response.data;
                console.log('👨‍⚕️ Doctor profile:', doctor); // Debug
                setDoctorInfo(doctor);

                // ✅ Tự động set chuyên khoa của bác sĩ
                if (doctor.specialty_id) {
                    console.log('✅ Setting specialty_id:', doctor.specialty_id); // Debug
                    setFormData(prev => ({
                        ...prev,
                        specialty_id: doctor.specialty_id.toString()
                    }));
                }
            }
        } catch (error) {
            console.error('❌ Error fetching doctor info:', error);
            console.error('Error details:', error.response?.data);
        }
    };

    // Tìm kiếm bệnh nhân khi nhập SĐT
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchPhone.length >= 4) {
                searchPatient(searchPhone);
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchPhone]);

    const fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            setSpecialties(response.data || []);
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    const fetchServices = async () => {
        try {
            const response = await api.get('/api/public/services');
            setServices(response.data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const searchPatient = async (phone) => {
        try {
            setSearching(true);
            const response = await api.get(`/api/doctor/search-patient?phone=${phone}`);
            setSearchResults(response.data.patients || []);
        } catch (error) {
            console.error('Error searching patient:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        setFormData({
            ...formData,
            full_name: patient.full_name,
            phone: patient.phone,
            email: patient.email || '',
            gender: patient.gender || 'male',
            birthday: patient.birthday || '',
            address: patient.address || ''
        });
        setSearchPhone('');
        setSearchResults([]);
    };

    const handleClearPatient = () => {
        setSelectedPatient(null);
        setFormData({
            full_name: '',
            phone: '',
            email: '',
            gender: 'male',
            birthday: '',
            address: '',
            specialty_id: formData.specialty_id,
            service_id: formData.service_id,
            symptoms: '',
            note: ''
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // ✅ Ràng buộc ngày sinh - không cho chọn ngày tương lai và năm phải hợp lệ
        if (name === 'birthday' && value) {
            // Kiểm tra format ngày hợp lệ (YYYY-MM-DD)
            const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!dateMatch) {
                // Ngày chưa nhập đầy đủ, chỉ cập nhật state
                setFormData(prev => ({ ...prev, [name]: value }));
                return;
            }

            // Kiểm tra năm hợp lệ (1900-năm hiện tại) - tránh lỗi khi đang gõ năm
            const year = parseInt(dateMatch[1], 10);
            const currentYear = new Date().getFullYear();
            if (year < 1900 || year > currentYear) {
                // Năm chưa hợp lệ (đang gõ), chỉ cập nhật state
                setFormData(prev => ({ ...prev, [name]: value }));
                return;
            }

            const selectedDate = new Date(value + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Kiểm tra ngày tương lai
            if (selectedDate > today) {
                alert('⚠️ Ngày sinh không thể là ngày trong tương lai.');
                return;
            }
        }

        // Nếu thay đổi chuyên khoa, reset dịch vụ
        if (name === 'specialty_id') {
            setFormData(prev => ({ ...prev, [name]: value, service_id: '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Lọc dịch vụ theo chuyên khoa đã chọn
    const filteredServices = formData.specialty_id
        ? services.filter(svc => svc.specialty_id === parseInt(formData.specialty_id))
        : services;

    const validateForm = () => {
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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            const response = await api.post('/api/doctor/walk-in', formData);

            if (response.data.success) {
                alert(response.data.message);

                // Chuyển sang trang khám bệnh với bookingId trong URL
                navigate(`/doctor-portal/examination?bookingId=${response.data.booking.id}`);
            }
        } catch (error) {
            console.error('Error creating walk-in:', error);
            alert(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

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
                            onChange={(e) => setSearchPhone(e.target.value)}
                        />
                        {searching && <span className={styles.searchingText}>Đang tìm...</span>}
                    </div>

                    {searchResults.length > 0 && (
                        <div className={styles.searchResults}>
                            {searchResults.map(patient => (
                                <div
                                    key={patient.id}
                                    className={styles.resultItem}
                                    onClick={() => handleSelectPatient(patient)}
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
                            <button className={styles.clearBtn} onClick={handleClearPatient}>
                                ✕ Hủy chọn
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className={styles.form}>
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
                                onChange={handleChange}
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
                                    onChange={handleChange}
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
                                    onChange={handleChange}
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Giới tính</label>
                                <select name="gender" value={formData.gender} onChange={handleChange}>
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
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Địa chỉ</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
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
                                <select
                                    name="specialty_id"
                                    value={formData.specialty_id}
                                    onChange={handleChange}
                                    disabled={!!doctorInfo?.specialty_id} // ✅ Disable nếu đã có chuyên khoa mặc định
                                >
                                    <option value="">-- Chọn chuyên khoa --</option>
                                    {specialties.map(spec => (
                                        <option key={spec.id} value={spec.id}>{spec.name}</option>
                                    ))}
                                </select>
                                {doctorInfo?.specialty_id && (
                                    <span className={styles.hint}>
                                        ✓ Tự động chọn chuyên khoa của bạn
                                    </span>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label>Dịch vụ</label>
                                <select
                                    name="service_id"
                                    value={formData.service_id}
                                    onChange={handleChange}
                                    disabled={!formData.specialty_id}
                                >
                                    <option value="">
                                        {formData.specialty_id
                                            ? '-- Chọn dịch vụ --'
                                            : '-- Chọn chuyên khoa trước --'}
                                    </option>
                                    {filteredServices.map(svc => (
                                        <option key={svc.id} value={svc.id}>{svc.name}</option>
                                    ))}
                                </select>
                                {formData.specialty_id && filteredServices.length === 0 && (
                                    <span className={styles.hint}>Không có dịch vụ cho chuyên khoa này</span>
                                )}
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Triệu chứng / Lý do khám <span className={styles.required}>*</span></label>
                            <textarea
                                name="symptoms"
                                value={formData.symptoms}
                                onChange={handleChange}
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
                                onChange={handleChange}
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
