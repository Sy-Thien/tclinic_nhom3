import { useState } from 'react';
import styles from './Contact.module.css';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
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
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Họ và tên *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Nhập họ tên của bạn"
                                required
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

                        <button type="submit" className={styles.submitBtn}>
                            📤 Gửi tin nhắn
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}