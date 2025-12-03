import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './Contact.module.css';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        category: 'general',
        specialty_id: ''
    });
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Load user info if logged in
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                // Pre-fill form for logged in users
                if (userData.role === 'patient') {
                    setFormData(prev => ({
                        ...prev,
                        name: userData.full_name || userData.name || '',
                        email: userData.email || '',
                        phone: userData.phone || ''
                    }));
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }

        // Load specialties
        fetchSpecialties();
    }, []);

    const fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            setSpecialties(response.data.specialties || []);
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        try {
            setLoading(true);

            const payload = {
                subject: formData.subject,
                message: formData.message,
                category: formData.category,
                specialty_id: formData.specialty_id || null
            };

            // If not logged in, send as guest
            if (!user) {
                payload.guest_name = formData.name;
                payload.guest_email = formData.email;
                payload.guest_phone = formData.phone;
            }

            await api.post('/api/consultation-requests', payload);

            alert('✅ Gửi yêu cầu thành công! Chúng tôi sẽ phản hồi sớm nhất.');

            // Reset form (keep user info if logged in)
            if (user) {
                setFormData({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    subject: '',
                    message: '',
                    category: 'general',
                    specialty_id: ''
                });
            } else {
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    subject: '',
                    message: '',
                    category: 'general',
                    specialty_id: ''
                });
            }

        } catch (error) {
            console.error('Error submitting request:', error);
            alert('❌ ' + (error.response?.data?.message || 'Có lỗi xảy ra! Vui lòng thử lại.'));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

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
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Phân loại yêu cầu *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
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
                                onChange={handleChange}
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
                                onChange={handleChange}
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
                                    onChange={handleChange}
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
                                    onChange={handleChange}
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
                                onChange={handleChange}
                                placeholder="Nhập chủ đề"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Nội dung *</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
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