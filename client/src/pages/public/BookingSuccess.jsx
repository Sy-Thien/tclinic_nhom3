import React, { Component } from 'react';
import withRouter from '../../utils/withRouter';
import styles from './BookingSuccess.module.css';

class BookingSuccess extends Component {
    render() {
        const { navigate } = this.props;

        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.icon}>✅</div>
                    <h1>Đặt lịch thành công!</h1>
                    <p className={styles.message}>
                        Cảm ơn bạn đã đặt lịch khám tại TClinic.
                        Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.
                    </p>

                    <div className={styles.infoBox}>
                        <h3>📋 Bạn có thể:</h3>
                        <ul>
                            <li>Theo dõi lịch hẹn trong mục "Lịch hẹn của tôi"</li>
                            <li>Kiểm tra email để xem thông tin chi tiết</li>
                            <li>Liên hệ hotline nếu cần thay đổi lịch</li>
                        </ul>
                    </div>

                    <div className={styles.actions}>
                        <button
                            className={styles.btnPrimary}
                            onClick={() => navigate('/my-appointments')}
                        >
                            📅 Xem lịch hẹn của tôi
                        </button>
                        <button
                            className={styles.btnSecondary}
                            onClick={() => navigate('/')}
                        >
                            🏠 Về trang chủ
                        </button>
                    </div>

                    <div className={styles.contact}>
                        <p>Cần hỗ trợ? Gọi ngay: <strong>1900 1234</strong></p>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(BookingSuccess);
