import React, { Component } from 'react';
import styles from './NavigationControls.module.css';
import withRouter from '../utils/withRouter';

class NavigationControls extends Component {
    handleBack = () => {
        this.props.navigate(-1); // Quay lại trang trước
    };

    handleForward = () => {
        this.props.navigate(1); // Tiến tới trang sau
    };

    handleRestart = () => {
        const restartPath = this.props.restartPath || '/';
        this.props.navigate(restartPath); // Về trang chủ hoặc trang khởi đầu
        window.scrollTo(0, 0);
    };

    render() {
        const { showRestart = true } = this.props;

        return (
            <div className={styles.navControls}>
                <button
                    onClick={this.handleBack}
                    className={styles.navButton}
                    title="Quay lại trang trước"
                >
                    <span className={styles.icon}>←</span>
                    <span className={styles.label}>Quay lại</span>
                </button>

                <button
                    onClick={this.handleForward}
                    className={styles.navButton}
                    title="Tiến tới trang sau"
                >
                    <span className={styles.icon}>→</span>
                    <span className={styles.label}>Tiếp theo</span>
                </button>

                {showRestart && (
                    <button
                        onClick={this.handleRestart}
                        className={`${styles.navButton} ${styles.restartButton}`}
                        title="Về trang chủ"
                    >
                        <span className={styles.icon}>🏠</span>
                        <span className={styles.label}>Trang chủ</span>
                    </button>
                )}
            </div>
        );
    }
}

export default withRouter(NavigationControls);
