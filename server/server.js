const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database
const { sequelize } = require('./models');

// Test DB connection
sequelize.authenticate()
    .then(() => {
        console.log('✅ Kết nối MySQL thành công');
        console.log('📊 Database:', sequelize.config.database);
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối MySQL:', err);
    });

// Routes
const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const doctorAppointmentRoutes = require('./routes/doctorAppointmentRoutes');
const adminBookingRoutes = require('./routes/adminBookingRoutes');
const adminDoctorRoutes = require('./routes/adminDoctorRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const adminPatientRoutes = require('./routes/adminPatientRoutes');
const adminSpecialtyRoutes = require('./routes/adminSpecialtyRoutes');
const adminRoomRoutes = require('./routes/adminRoomRoutes');

const adminReportRoutes = require('./routes/adminReportRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/doctor/appointments', doctorAppointmentRoutes);
app.use('/api/admin', adminBookingRoutes);
app.use('/api/admin', adminDoctorRoutes);
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/admin', adminPatientRoutes);
app.use('/api/admin', adminSpecialtyRoutes);
app.use('/api/admin', adminRoomRoutes);

app.use('/api/admin', adminReportRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên port ${PORT}`);
});