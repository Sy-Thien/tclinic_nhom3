/**
 * Socket.io Service
 * Quản lý kết nối realtime và gửi thông báo đến các role
 */

let io = null;

// Map lưu userId → socketId để gửi thông báo đến user cụ thể
const connectedUsers = new Map(); // key: "role_id", value: Set of socketIds

const initSocket = (httpServer) => {
    const { Server } = require('socket.io');

    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // Client gửi thông tin khi đăng nhập
        socket.on('join', ({ role, userId }) => {
            if (!role || !userId) return;

            // Tham gia room theo role và userId
            socket.join(`${role}_${userId}`);   // room riêng: "doctor_5", "patient_12"
            socket.join(role);                   // room chung: "admin", "doctor"

            // Lưu vào map
            const key = `${role}_${userId}`;
            if (!connectedUsers.has(key)) connectedUsers.set(key, new Set());
            connectedUsers.get(key).add(socket.id);

            console.log(`✅ User joined rooms: ${key}, ${role}`);
        });

        socket.on('disconnect', () => {
            // Xóa khỏi map khi ngắt kết nối
            for (const [key, socketIds] of connectedUsers.entries()) {
                socketIds.delete(socket.id);
                if (socketIds.size === 0) connectedUsers.delete(key);
            }
            console.log(`🔌 Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIo = () => io;

/**
 * Gửi thông báo đến một user cụ thể
 * @param {string} role - 'admin' | 'doctor' | 'patient'
 * @param {number} userId
 * @param {string} event
 * @param {object} data
 */
const emitToUser = (role, userId, event, data) => {
    if (!io) return;
    io.to(`${role}_${userId}`).emit(event, data);
};

/**
 * Gửi thông báo đến tất cả user của một role
 * @param {string} role - 'admin' | 'doctor' | 'patient'
 * @param {string} event
 * @param {object} data
 */
const emitToRole = (role, event, data) => {
    if (!io) return;
    io.to(role).emit(event, data);
};

module.exports = { initSocket, getIo, emitToUser, emitToRole };
