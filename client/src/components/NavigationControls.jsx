import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './NavigationControls.module.css';

const NavigationControls = ({ showRestart = true, restartPath = '/' }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleBack = () => {
        navigate(-1); // Quay lại trang trước
    };

    const handleForward = () => {
        navigate(1); // Tiến tới trang sau
    };

    const handleRestart = () => {
        navigate(restartPath); // Về trang chủ hoặc trang khởi đầu
        window.scrollTo(0, 0);
    };

    return (
        <div className={styles.navControls}>
            <button
                onClick={handleBack}
                className={styles.navButton}
                title="Quay lại trang trước"
            >
                <span className={styles.icon}>←</span>
                <span className={styles.label}>Quay lại</span>
            </button>

            <button
                onClick={handleForward}
                className={styles.navButton}
                title="Tiến tới trang sau"
            >
                <span className={styles.icon}>→</span>
                <span className={styles.label}>Tiếp theo</span>
            </button>

            {showRestart && (
                <button
                    onClick={handleRestart}
                    className={`${styles.navButton} ${styles.restartButton}`}
                    title="Về trang chủ"
                >
                    <span className={styles.icon}>🏠</span>
                    <span className={styles.label}>Trang chủ</span>
                </button>
            )}
        </div>
    );
};

export default NavigationControls;
