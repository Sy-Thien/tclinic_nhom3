import React, { Component } from 'react';
import api from '../../utils/api';
import styles from './Contact.module.css';

class Contact extends Component {
    constructor(props) {
        super(props);
        this.state = {
            formData: {
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: '',
                category: 'general',
                specialty_id: ''
            },
            specialties: [],
            loading: false,
            user: null
        };
    }

    componentDidMount() {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                this.setState({ user: userData });
                if (userData.role === 'patient') {
                    this.setState(prevState => ({
                        formData: {
                            ...prevState.formData,
                            name: userData.full_name || userData.name || '',
                            email: userData.email || '',
                            phone: userData.phone || ''
                        }
                    }));
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }

        this.fetchSpecialties();
    }

    fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            this.setState({ specialties: response.data.specialties || [] });
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    handleSubmit = async (e) => {
        e.preventDefault();

        if (this.state.loading) return;

        try {
            this.setState({ loading: true });

            const { formData, user } = this.state;

            const payload = {
                subject: formData.subject,
                message: formData.message,
                category: formData.category,
                specialty_id: formData.specialty_id || null
            };

            if (!user) {
                payload.guest_name = formData.name;
                payload.guest_email = formData.email;
                payload.guest_phone = formData.phone;
            }

            await api.post('/api/patient/consultations', payload);

            alert('✅ Gửi yêu cầu thành công! Chúng tôi sẽ phản hồi sớm nhất.');

            if (user) {
                this.setState(prevState => ({
                    formData: {
                        name: prevState.formData.name,
                        email: prevState.formData.email,
                        phone: prevState.formData.phone,
                        subject: '',
                        message: '',
                        category: 'general',
                        specialty_id: ''
                    }
                }));
            } else {
                this.setState({
                    formData: {
                        name: '',
                        email: '',
                        phone: '',
                        subject: '',
                        message: '',
                        category: 'general',
                        specialty_id: ''
                    }
                });
            }

        } catch (error) {
            console.error('Error submitting request:', error);
            alert('❌ ' + (error.response?.data?.message || 'Có lỗi xảy ra! Vui lòng thử lại.'));
        } finally {
            this.setState({ loading: false });
        }
    };

    handleChange = (e) => {
        const { name, value } = e.target;
        this.setState(prevState => ({
            formData: { ...prevState.formData, [name]: value }
        }));
    };

    render() {
        const { formData, specialties, loading, user } = this.state;

        return (
            <div className={styles.container}>
                <div className={styles.hero}>
                    <h1>📞 Liên hệ với chúng tôi</h1>
                    <p>Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn</p>
                </div>

                <div className={styles.content}>
                    <div className={styles.infoSection}>
                        <div className={styles.infoCard}>
                            <span className={styles.infoIcon}>📍</span>
                            <h3>Địa chỉ</h3>
                            <p>Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM</p>
                        </div>

                        <div className={styles.infoCard}>
                            <span className={styles.infoIcon}>📞</span>
                            <h3>Điện thoại</h3>
                            <p>(028) 1234 5678</p>
                            <p>0901 234 567</p>
                        </div>

                        <div className={styles.infoCard}>
                            <span className={styles.infoIcon}>📧</span>
                            <h3>Email</h3>
                            <p>contact@tclinic.com</p>
                            <p>support@tclinic.com</p>
                        </div>

                        <div className={styles.infoCard}>
                            <span className={styles.infoIcon}>🕐</span>
                            <h3>Giờ làm việc</h3>
                            <p>Thứ 2 - Thứ 6: 7:00 - 20:00</p>
                            <p>Thứ 7: 7:00 - 17:00</p>
                            <p>Chủ nhật: Nghỉ</p>
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <h2>💬 Gửi tin nhắn cho chúng tôi</h2>
                        {user && (
                            <div style={{
                                padding: '12px',
                                background: '#e8f5e9',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                color: '#2e7d32'
                            }}>
                                ✅ Đang đăng nhập với tài khoản: <strong>{user.email}</strong>
                            </div>
                        )}
                        <form onSubmit={this.handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Phân loại yêu cầu *</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={this.handleChange}
                                    required
                                >
                                    <option value="general">Tổng quát</option>
                                    <option value="medical_inquiry">Tư vấn y tế</option>
                                    <option value="appointment">Đặt lịch khám</option>
                                    <option value="complaint">Khiếu nại</option>
                                    <option value="other">Khác</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Chuyên khoa liên quan</label>
                                <select
                                    name="specialty_id"
                                    value={formData.specialty_id}
                                    onChange={this.handleChange}
                                >
                                    <option value="">-- Chọn chuyên khoa (nếu có) --</option>
                                    {specialties.map(specialty => (
                                        <option key={specialty.id} value={specialty.id}>
                                            {specialty.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Họ và tên *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={this.handleChange}
                                    placeholder="Nhập họ tên của bạn"
                                    required
                                    disabled={!!user}
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={this.handleChange}
                                        placeholder="email@example.com"
                                        required
                                        disabled={!!user}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Số điện thoại</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={this.handleChange}
                                        placeholder="0901234567"
                                        disabled={!!user}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Chủ đề *</label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={this.handleChange}
                                    placeholder="Nhập chủ đề"
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Nội dung *</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={this.handleChange}
                                    placeholder="Nhập nội dung tin nhắn..."
                                    rows="6"
                                    required
                                ></textarea>
                            </div>

                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? '⏳ Đang gửi...' : '📤 Gửi yêu cầu'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

export default Contact;
