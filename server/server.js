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

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên port ${PORT}`);
});