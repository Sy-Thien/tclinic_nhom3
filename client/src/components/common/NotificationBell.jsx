import React, { Component } from 'react';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import styles from './NotificationBell.module.css';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socketInstance = null;

class NotificationBell extends Component {
    constructor(props) {
        super(props);
        this.state = {
            notifications: [],
            open: false,
            selectedDate: '', // Filter theo ngày
            allNotifications: [] // Lưu tất cả notifications để filter
        };
        this.panelRef = React.createRef();
    }

    componentDidMount() {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
            let user;
            try { user = JSON.parse(userStr); } catch { return; }

            if (!socketInstance) {
                socketInstance = io(SOCKET_URL, {
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    maxReconnectionAttempts: 10
                });
            }

            this.socket = socketInstance;

            this.handleConnect = () => {
                console.log('🔌 Socket connected');
                this.socket.emit('join', { role: user.role, userId: user.id });
            };

            this.handleSocketNotification = (data) => {
                console.log('🔔 Notification received:', data);
                this.handleNotification(data);
            };

            this.socket.on('connect', this.handleConnect);
            this.socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
            this.socket.on('new_booking', this.handleSocketNotification);
            this.socket.on('new_appointment', this.handleSocketNotification);
            this.socket.on('booking_confirmed', this.handleSocketNotification);
            this.socket.on('booking_rejected', this.handleSocketNotification);
            this.socket.on('schedule_approved', this.handleSocketNotification);
            this.socket.on('schedule_rejected', this.handleSocketNotification);

            if (this.socket.connected) {
                this.socket.emit('join', { role: user.role, userId: user.id });
            }

            // ✅ Fetch missed notifications from database on load
            this.fetchMissedNotifications();
        }

        document.addEventListener('mousedown', this.handleClickOutside);
    }

    // ✅ NEW: Fetch notifications from database
    fetchMissedNotifications = async () => {
        try {
            const response = await api.get('/api/notifications/unread');

            if (response.data.notifications && response.data.notifications.length > 0) {
                // Convert DB notifications to frontend format
                const dbNotifications = response.data.notifications.map(notif => ({
                    id: notif.id,
                    message: notif.message,
                    read: notif.is_read,
                    time: new Date(notif.create_at),
                    type: notif.record_type
                }));

                this.setState(prevState => ({
                    notifications: [
                        ...dbNotifications,
                        ...prevState.notifications
                    ],
                    allNotifications: [
                        ...dbNotifications,
                        ...prevState.allNotifications
                    ]
                }));

                console.log(`✅ Loaded ${dbNotifications.length} missed notifications from DB`);
            }
        } catch (err) {
            console.error('❌ Failed to fetch missed notifications:', err.message);
        }
    };

    componentWillUnmount() {
        if (this.socket) {
            this.socket.off('connect', this.handleConnect);
            this.socket.off('new_booking', this.handleSocketNotification);
            this.socket.off('new_appointment', this.handleSocketNotification);
            this.socket.off('booking_confirmed', this.handleSocketNotification);
            this.socket.off('booking_rejected', this.handleSocketNotification);
            this.socket.off('schedule_approved', this.handleSocketNotification);
            this.socket.off('schedule_rejected', this.handleSocketNotification);
        }
        document.removeEventListener('mousedown', this.handleClickOutside);
    }

    handleNotification = (data) => {
        const newNotif = { ...data, id: Date.now(), read: false, time: new Date() };

        this.setState(prevState => ({
            notifications: [newNotif, ...prevState.notifications.slice(0, 49)],
            allNotifications: [newNotif, ...prevState.allNotifications.slice(0, 49)]
        }));

        // Hiển thị browser notification nếu được phép
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(data.title || 'Thông báo mới', {
                body: data.message,
                icon: '/logo.png'
            });
        }
    };

    handleClickOutside = (e) => {
        if (this.panelRef.current && !this.panelRef.current.contains(e.target)) {
            this.setState({ open: false });
        }
    };

    markAllRead = async () => {
        this.setState(prevState => ({
            notifications: prevState.notifications.map(n => ({ ...n, read: true })),
            allNotifications: prevState.allNotifications.map(n => ({ ...n, read: true }))
        }));

        // Call API to mark all as read in database
        try {
            await api.put('/api/notifications/mark-all-read');
        } catch (err) {
            console.error('Failed to mark all as read:', err.message);
        }
    };

    clearAll = async () => {
        this.setState({ notifications: [], allNotifications: [], open: false });

        // Optionally delete from DB (for now just mark as read)
        try {
            await api.put('/api/notifications/mark-all-read');
        } catch (err) {
            console.error('Failed to clear notifications:', err.message);
        }
    };

    getIcon = (type) => {
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

    formatTime = (date) => {
        const d = new Date(date);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    handleDateFilter = (e) => {
        const value = e.target.value;
        this.setState({ selectedDate: value });

        if (!value) {
            // No filter - show all
            this.setState(prevState => ({
                notifications: prevState.allNotifications
            }));
        } else {
            this.setState(prevState => ({
                notifications: prevState.allNotifications.filter(n => {
                    const d = new Date(n.time);
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    return dateStr === value;
                })
            }));
        }
    };

    groupByDate = (notifications) => {
        const groups = {};
        notifications.forEach(n => {
            const d = new Date(n.time);
            const dateKey = d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(n);
        });
        return groups;
    };

    render() {
        const { notifications, open, selectedDate, allNotifications } = this.state;
        const unreadCount = allNotifications.filter(n => !n.read).length;
        const groupedNotifications = this.groupByDate(notifications);

        return (
            <div className={styles.wrapper} ref={this.panelRef}>
                <button
                    className={styles.bell}
                    onClick={() => {
                        this.setState(prevState => ({ open: !prevState.open }));
                        if (!open) this.markAllRead();
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
                                <button className={styles.clearBtn} onClick={this.clearAll}>Xóa tất cả</button>
                            )}
                        </div>

                        {/* Date Filter */}
                        <div className={styles.filterSection}>
                            <label htmlFor="dateFilter" style={{ fontSize: '13px', marginRight: '8px' }}>Lọc theo ngày:</label>
                            <input
                                id="dateFilter"
                                type="date"
                                value={selectedDate}
                                onChange={this.handleDateFilter}
                                className={styles.dateInput}
                                style={{
                                    padding: '6px 10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    flex: 1
                                }}
                            />
                            {selectedDate && (
                                <button
                                    onClick={() => this.handleDateFilter({ target: { value: '' } })}
                                    className={styles.clearFilterBtn}
                                    style={{
                                        marginLeft: '8px',
                                        padding: '6px 10px',
                                        background: '#f3f4f6',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {notifications.length === 0 ? (
                            <div className={styles.empty}>
                                {selectedDate ? 'Không có thông báo trong ngày này' : 'Không có thông báo mới'}
                            </div>
                        ) : (
                            <div className={styles.listContainer}>
                                {Object.entries(groupedNotifications).map(([dateKey, notifs]) => (
                                    <div key={dateKey} className={styles.dateGroup}>
                                        <div className={styles.dateHeader}>{dateKey}</div>
                                        <ul className={styles.list}>
                                            {notifs.map(n => (
                                                <li key={n.id} className={`${styles.item} ${!n.read ? styles.unread : ''}`}>
                                                    <span className={styles.icon}>{this.getIcon(n.type)}</span>
                                                    <div className={styles.content}>
                                                        <div className={styles.title}>{n.title}</div>
                                                        <div className={styles.message}>{n.message}</div>
                                                        <div className={styles.time}>{this.formatTime(n.time)}</div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
}

export default NotificationBell;
