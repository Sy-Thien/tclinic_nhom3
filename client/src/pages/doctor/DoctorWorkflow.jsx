import React from 'react';
import styles from './DoctorWorkflow.module.css';

const DoctorWorkflow = () => {
    const steps = [
        {
            number: 1,
            title: 'Xem Lịch Khám',
            description: 'Vào mục "🩺 Quản Lý Lịch Khám" để xem danh sách các bệnh nhân chờ khám.',
            icon: '📋',
            status: 'ready'
        },
        {
            number: 2,
            title: 'Tiếp Nhận Bệnh Nhân',
            description: 'Click nút "✅ Xác nhận tiếp nhận" để bắt đầu khám bệnh nhân.',
            icon: '👤',
            status: 'ready'
        },
        {
            number: 3,
            title: 'Xem Thông Tin Chi Tiết',
            description: 'Click "👁️ Xem chi tiết" để xem thông tin đặt lịch, triệu chứng ban đầu của bệnh nhân.',
            icon: '📄',
            status: 'ready'
        },
        {
            number: 4,
            title: 'Khám Bệnh Nhân',
            description: 'Khám bệnh nhân theo quy trình chuẩn. Ghi chú các triệu chứng, kết quả khám.',
            icon: '🩺',
            status: 'ready'
        },
        {
            number: 5,
            title: 'Nhập Chẩn Đoán & Kết Luận',
            description: 'Nhập chẩn đoán (bệnh gì) và kết luận khám. Sau đó click "✅ Hoàn thành khám".',
            icon: '📝',
            status: 'ready'
        },
        {
            number: 6,
            title: 'Kê Đơn Thuốc',
            description: 'Click nút "💊 Kê Đơn Thuốc" để mở form chọn thuốc từ kho.',
            icon: '💊',
            status: 'ready'
        },
        {
            number: 7,
            title: 'Chọn Thuốc Từ Kho',
            description: 'Chọn thuốc từ dropdown (hiển thị số lượng tồn), nhập liều lượng, thời gian dùng.',
            icon: '🔍',
            status: 'ready'
        },
        {
            number: 8,
            title: 'Lưu Đơn Thuốc',
            description: 'Click "💾 Lưu Đơn Thuốc". Hệ thống sẽ tự động tạo PDF và download về máy.',
            icon: '💾',
            status: 'ready'
        },
        {
            number: 9,
            title: 'Xuất PDF Toa Thuốc',
            description: 'PDF toa thuốc được download tự động với thông tin đầy đủ. Bạn có thể in hoặc gửi cho bệnh nhân.',
            icon: '📄',
            status: 'ready'
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>🏥 Hướng Dẫn Quy Trình Khám Bệnh</h1>
                <p>Làm theo các bước dưới đây để hoàn thành quy trình khám bệnh và kê đơn thuốc</p>
            </div>

            <div className={styles.stepsContainer}>
                {steps.map((step, index) => (
                    <div key={step.number} className={`${styles.step} ${styles[step.status]}`}>
                        <div className={styles.stepNumber}>
                            <span>{step.icon}</span>
                            <span className={styles.number}>{step.number}</span>
                        </div>

                        <div className={styles.stepContent}>
                            <h3>{step.title}</h3>
                            <p>{step.description}</p>
                        </div>

                        {index < steps.length - 1 && <div className={styles.connector} />}
                    </div>
                ))}
            </div>

            <div className={styles.tips}>
                <h2>💡 Lưu Ý Quan Trọng</h2>
                <ul>
                    <li>✅ Kiểm tra số lượng tồn kho của thuốc trước khi kê đơn</li>
                    <li>✅ Nhập đầy đủ thông tin liều lượng và thời gian dùng thuốc</li>
                    <li>✅ PDF toa thuốc sẽ tự động download sau khi lưu đơn</li>
                    <li>✅ Có thể xuất lại PDF bằng nút "📄 Xuất PDF" nếu cần</li>
                    <li>⚠️ Nếu tồn kho không đủ, liên hệ admin để thêm thuốc vào kho</li>
                </ul>
            </div>

            <div className={styles.quickLinks}>
                <h2>🔗 Các Tính Năng Chính</h2>
                <div className={styles.links}>
                    <div className={styles.linkItem}>
                        <span className={styles.emoji}>🩺</span>
                        <div>
                            <strong>Quản Lý Lịch Khám</strong>
                            <p>Xem và quản lý lịch khám của các bệnh nhân</p>
                        </div>
                    </div>

                    <div className={styles.linkItem}>
                        <span className={styles.emoji}>💊</span>
                        <div>
                            <strong>Kho Thuốc</strong>
                            <p>Kho dữ liệu 39 loại thuốc phổ biến</p>
                        </div>
                    </div>

                    <div className={styles.linkItem}>
                        <span className={styles.emoji}>📋</span>
                        <div>
                            <strong>Đơn Thuốc</strong>
                            <p>Tạo và quản lý đơn thuốc cho bệnh nhân</p>
                        </div>
                    </div>

                    <div className={styles.linkItem}>
                        <span className={styles.emoji}>📄</span>
                        <div>
                            <strong>Xuất PDF</strong>
                            <p>In hoặc download toa thuốc dưới dạng PDF</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorWorkflow;
