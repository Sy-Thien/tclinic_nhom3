const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const app = express();
const httpServer = http.createServer(app);

// ✅ Init Socket.io
const socketService = require('./apps/Services/SocketService');
socketService.initSocket(httpServer);

// Middleware
app.use(cors());
app.use(express.json());

// Error handler middleware
const { errorHandler } = require('./apps/middlewares');

// Database
const { sequelize } = require('./apps/Database/Entity');

// ============================================================
// ROUTES
// ============================================================
const apiRoutes = require('./apps/routes');
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Error handler (must be last)
app.use(errorHandler);

// ============================================================
// STARTUP: Kết nối DB → Sync bảng → Start server → Start schedulers
// ============================================================
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Bước 1: Kết nối database
        await sequelize.authenticate();
        console.log('✅ Kết nối MySQL thành công');
        console.log('📊 Database:', sequelize.config.database);

        // Bước 2: Set timezone
        await sequelize.query("SET time_zone = '+07:00'");
        console.log('🕐 MySQL timezone set to +07:00 (Vietnam)');

        // Bước 3: Sync tất cả bảng (tạo bảng nếu chưa có)
        await sequelize.sync({ alter: true });
        console.log('✅ Database synced - tất cả bảng đã sẵn sàng');

        // Bước 4: Start HTTP server SAU KHI database đã sẵn sàng
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server đang chạy trên port ${PORT}`);

            // Bước 5: Start schedulers SAU KHI bảng đã tồn tại
            if (process.env.NODE_ENV !== 'ci' && process.env.SKIP_REMINDER !== 'true') {
                try {
                    const reminderService = require('./apps/Services/ReminderService');
                    reminderService.startScheduler();
                } catch (err) {
                    console.log('⚠️ Reminder service skipped:', err.message);
                }

                try {
                    const autoScheduleService = require('./apps/Services/AutoScheduleService');
                    autoScheduleService.startScheduler();
                } catch (err) {
                    console.log('⚠️ Auto schedule service skipped:', err.message);
                }
            } else {
                console.log('⏭️ Reminder service skipped in CI environment');
            }
        });

    } catch (err) {
        console.error('❌ Lỗi khởi động server:', err);
        process.exit(1);
    }
}

startServer();

module.exports = app;
