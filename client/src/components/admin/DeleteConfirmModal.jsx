import React from 'react';
import styles from './DeleteConfirmModal.module.css';

/**
 * Component modal xác nhận xóa - Dùng chung cho tất cả trang admin
 * 
 * @param {Object} props
 * @param {boolean} props.show - Hiển thị modal
 * @param {function} props.onClose - Callback khi đóng modal
 * @param {function} props.onConfirm - Callback khi xác nhận xóa
 * @param {string} props.title - Tiêu đề modal (mặc định: "Xác nhận xóa")
 * @param {string} props.itemName - Tên item cần xóa
 * @param {string} props.itemType - Loại item (vd: "chuyên khoa", "bác sĩ")
 * @param {string} props.warningMessage - Thông báo cảnh báo (nếu có)
 * @param {boolean} props.loading - Trạng thái đang xóa
 */
function DeleteConfirmModal({
    show,
    onClose,
    onConfirm,
    title = 'Xác nhận xóa',
    itemName,
    itemType,
    warningMessage,
    loading = false
}) {
    if (!show) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Icon cảnh báo lớn */}
                <div className={styles.iconWrapper}>
                    <div className={styles.warningIcon}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h2 className={styles.title}>{title}</h2>

                {/* Content */}
                <div className={styles.content}>
                    <p className={styles.question}>
                        Bạn có chắc chắn muốn xóa {itemType}:
                    </p>
                    <p className={styles.itemName}>{itemName}</p>

                    {warningMessage && (
                        <div className={styles.warningBox}>
                            <span className={styles.warningIconSmall}>⚠️</span>
                            <span className={styles.warningText}>{warningMessage}</span>
                        </div>
                    )}

                    <p className={styles.note}>
                        ⚠️ Thao tác này không thể hoàn tác!
                    </p>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button
                        onClick={onClose}
                        className={styles.btnCancel}
                        disabled={loading}
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={onConfirm}
                        className={styles.btnDelete}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className={styles.spinner}></span>
                                Đang xóa...
                            </>
                        ) : (
                            <>
                                <span className={styles.deleteIcon}>🗑️</span>
                                Xác nhận xóa
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DeleteConfirmModal;
