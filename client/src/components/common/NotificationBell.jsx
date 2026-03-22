import { useState, useEffect, useCallback, useRef } from 'react';
import useSocket from '../../hooks/useSocket';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleNotification = useCallback((data) => {
        setNotifications(prev => [
            { ...data, id: Date.now(), read: false, time: new Date() },
            ...prev.slice(0, 49) // giữ tối đa 50 thông báo
        ]);
    }, []);

    useSocket(handleNotification);

    // Đóng panel khi click ra ngoài
    useEffect(() => {
        const handleClick = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAll = () => {
        setNotifications([]);
        setOpen(false);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'new_booking': return '📅';
            case 'new_appointment': return '🗓️';
            case 'booking_confirmed': return '✅';
            case 'booking_rejected': return '❌';
            case 'schedule_approved': return '✅';
            case 'schedule_rejected': return '❌';
            default: return '🔔';
        }
    };

    const formatTime = (date) => {
        const d = new Date(date);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={styles.wrapper} ref={panelRef}>
            <button
                className={styles.bell}
                onClick={() => {
                    setOpen(v => !v);
                    if (!open) markAllRead();
                }}
                title="Thông báo"
            >
                🔔
                {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <div className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <span>Thông báo</span>
                        {notifications.length > 0 && (
                            <button className={styles.clearBtn} onClick={clearAll}>Xóa tất cả</button>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div className={styles.empty}>Không có thông báo mới</div>
                    ) : (
                        <ul className={styles.list}>
                            {notifications.map(n => (
                                <li key={n.id} className={`${styles.item} ${!n.read ? styles.unread : ''}`}>
                                    <span className={styles.icon}>{getIcon(n.type)}</span>
                                    <div className={styles.content}>
                                        <div className={styles.title}>{n.title}</div>
                                        <div className={styles.message}>{n.message}</div>
                                        <div className={styles.time}>{formatTime(n.time)}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
