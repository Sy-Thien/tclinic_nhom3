/**
 * Socket.io Service
 * Quản lý kết nối realtime và gửi thông báo đến các role
 */

class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // key: "role_id", value: Set of socketIds

        // Bind methods for destructuring compatibility
        this.emitToUser = this.emitToUser.bind(this);
        this.emitToRole = this.emitToRole.bind(this);
        this.initSocket = this.initSocket.bind(this);
        this.getIo = this.getIo.bind(this);
    }

    initSocket(httpServer) {
        const { Server } = require('socket.io');

        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:5173',
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`🔌 Socket connected: ${socket.id}`);

            socket.on('join', ({ role, userId }) => {
                if (!role || !userId) return;

                socket.join(`${role}_${userId}`);
                socket.join(role);

                const key = `${role}_${userId}`;
                if (!this.connectedUsers.has(key)) this.connectedUsers.set(key, new Set());
                this.connectedUsers.get(key).add(socket.id);

                console.log(`✅ User joined rooms: ${key}, ${role}`);
            });

            socket.on('disconnect', () => {
                for (const [key, socketIds] of this.connectedUsers.entries()) {
                    socketIds.delete(socket.id);
                    if (socketIds.size === 0) this.connectedUsers.delete(key);
                }
                console.log(`🔌 Socket disconnected: ${socket.id}`);
            });
        });

        return this.io;
    }

    getIo() {
        return this.io;
    }

    async emitToUser(role, userId, event, data) {
        if (!this.io) return;
        
        // Emit real-time notification
        this.io.to(`${role}_${userId}`).emit(event, data);
        
        // Persist notification to database for offline users or history
        try {
            const { Notification } = require('../Database/Entity');
            
            // Only save for patients (extend for other roles if needed)
            if (role === 'patient' && userId && data.message) {
                await Notification.create({
                    message: data.message,
                    patient_id: userId,
                    record_type: event,
                    record_id: data.id || null,
                    is_read: false
                });
                console.log(`✅ Notification saved to DB for patient ${userId}`);
            }
        } catch (err) {
            console.error('❌ Failed to save notification:', err.message);
        }
    }

    emitToRole(role, event, data) {
        if (!this.io) return;
        this.io.to(role).emit(event, data);
    }
}

module.exports = new SocketService();

