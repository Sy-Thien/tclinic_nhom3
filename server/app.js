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

// Test DB connection
sequelize.authenticate()
    .then(() => {
        console.log('✅ Kết nối MySQL thành công');
        console.log('📊 Database:', sequelize.config.database);

        // ✅ Set timezone cho MySQL session (Vietnam time)
        return sequelize.query("SET time_zone = '+07:00'");
    })
    .then(() => {
        console.log('🕐 MySQL timezone set to +07:00 (Vietnam)');
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối MySQL:', err);
    });

// ============================================================
// ROUTES - New Structure (apps/routes)
// ============================================================

// Import centralized routes
const apiRoutes = require('./apps/routes');

// Mount main API routes
app.use('/api', apiRoutes);


// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên port ${PORT}`);

    // ✅ Start appointment reminder scheduler
    if (process.env.NODE_ENV !== 'ci' && process.env.SKIP_REMINDER !== 'true') {
        try {
            const reminderService = require('./apps/Services/ReminderService');
            reminderService.startScheduler();
        } catch (err) {
            console.log('⚠️ Reminder service skipped:', err.message);
        }

        // ✅ Start auto schedule service
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

module.exports = app;
