import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socketInstance = null;

/**
 * Hook kết nối Socket.io — chỉ kết nối 1 lần cho toàn app
 * @param {function} onNotification - callback nhận notification object
 */
export default function useSocket(onNotification) {
    const handlerRef = useRef(onNotification);
    handlerRef.current = onNotification;

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (!token || !userStr) return;

        let user;
        try { user = JSON.parse(userStr); } catch { return; }

        // Tạo kết nối socket nếu chưa có
        if (!socketInstance) {
            socketInstance = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 3000
            });
        }

        const socket = socketInstance;

        const handleConnect = () => {
            console.log('🔌 Socket connected');
            socket.emit('join', { role: user.role, userId: user.id });
        };

        const handleNotification = (data) => {
            console.log('🔔 Notification received:', data);
            if (handlerRef.current) handlerRef.current(data);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', () => console.log('🔌 Socket disconnected'));

        // Lắng nghe các sự kiện theo role
        socket.on('new_booking', handleNotification);
        socket.on('new_appointment', handleNotification);
        socket.on('booking_confirmed', handleNotification);
        socket.on('booking_rejected', handleNotification);
        socket.on('schedule_approved', handleNotification);
        socket.on('schedule_rejected', handleNotification);

        // Nếu đã kết nối rồi thì join ngay
        if (socket.connected) {
            socket.emit('join', { role: user.role, userId: user.id });
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('new_booking', handleNotification);
            socket.off('new_appointment', handleNotification);
            socket.off('booking_confirmed', handleNotification);
            socket.off('booking_rejected', handleNotification);
            socket.off('schedule_approved', handleNotification);
            socket.off('schedule_rejected', handleNotification);
        };
    }, []);
}
