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

        // ✅ Set timezone cho MySQL session (Vietnam time)
        return sequelize.query("SET time_zone = '+07:00'");
    })
    .then(() => {
        console.log('🕐 MySQL timezone set to +07:00 (Vietnam)');
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
const doctorScheduleRoutes = require('./routes/doctorScheduleRoutes');
const bookingAvailabilityRoutes = require('./routes/bookingAvailabilityRoutes');
const adminDoctorScheduleRoutes = require('./routes/adminDoctorScheduleRoutes');
const adminDrugRoutes = require('./routes/adminDrugRoutes');  // ✅ NEW
const adminTimeSlotRoutes = require('./routes/adminTimeSlotRoutes');  // ✅ NEW: Admin time slot management
const adminServiceRoutes = require('./routes/adminServiceRoutes');  // ✅ NEW: Admin service management
const doctorPrescriptionRoutes = require('./routes/doctorPrescriptionRoutes');  // ✅ NEW
const doctorProfileRoutes = require('./routes/doctorProfileRoutes');  // ✅ NEW
const patientProfileRoutes = require('./routes/patientProfileRoutes');  // ✅ NEW
const timeSlotRoutes = require('./routes/timeSlotRoutes');  // ✅ NEW: Time slot management
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');  // ✅ NEW: Medical records
const medicalHistoryRoutes = require('./routes/medicalHistoryRoutes');  // ✅ NEW: Medical history
const reminderRoutes = require('./routes/reminderRoutes');  // ✅ NEW: Appointment reminders
const reviewRoutes = require('./routes/reviewRoutes');  // ✅ NEW: Reviews & ratings
const consultationRequestRoutes = require('./routes/consultationRequestRoutes');  // ✅ NEW: Consultation/Support
const adminConsultationRoutes = require('./routes/adminConsultationRoutes');  // ✅ NEW
const doctorConsultationRoutes = require('./routes/doctorConsultationRoutes');  // ✅ NEW

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api', timeSlotRoutes);  // ✅ NEW: Time slot routes
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/patient-profile', patientProfileRoutes);  // ✅ NEW: Patient profile routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/customer', bookingRoutes);  // ✅ Added: /api/customer routes
app.use('/api/doctor/appointments', doctorAppointmentRoutes);
app.use('/api/admin', adminBookingRoutes);
app.use('/api/admin', adminDoctorRoutes);
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/admin', adminPatientRoutes);
app.use('/api/admin', adminSpecialtyRoutes);
app.use('/api/admin', adminRoomRoutes);

app.use('/api/admin', adminReportRoutes);
app.use('/api/doctor-schedule', doctorScheduleRoutes);
app.use('/api/bookings', bookingAvailabilityRoutes);
app.use('/api/admin', adminDoctorScheduleRoutes);
app.use('/api/admin', adminDrugRoutes);  // ✅ NEW: Drug management
app.use('/api/admin/time-slots', adminTimeSlotRoutes);  // ✅ NEW: Admin time slot management
app.use('/api/admin/services', adminServiceRoutes);  // ✅ NEW: Admin service management
app.use('/api/doctor/prescriptions', doctorPrescriptionRoutes);  // ✅ NEW: Prescription management
app.use('/api/doctor', doctorProfileRoutes);  // ✅ NEW: Doctor profile management
app.use('/api/medical-records', medicalRecordRoutes);  // ✅ NEW: Medical history
app.use('/api/medical-history', medicalHistoryRoutes);  // ✅ NEW: Patient medical history
app.use('/api/reminders', reminderRoutes);  // ✅ NEW: Appointment reminders
app.use('/api/reviews', reviewRoutes);  // ✅ NEW: Reviews & ratings
app.use('/api/articles', require('./routes/articleRoutes'));  // ✅ NEW: News & articles
app.use('/api/consultation-requests', consultationRequestRoutes);  // ✅ NEW: Consultation/Support
app.use('/api/admin/consultations', adminConsultationRoutes);  // ✅ NEW: Admin manage consultations
app.use('/api/doctor/consultations', doctorConsultationRoutes);  // ✅ NEW: Doctor consultations
app.use('/api/invoices', require('./routes/invoiceRoutes'));  // ✅ NEW: Invoice management
app.use('/api/vnpay', require('./routes/vnpayRoutes'));  // ✅ NEW: VNPay payment

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên port ${PORT}`);

    // ✅ Start appointment reminder scheduler (only in production/development, not in CI)
    if (process.env.NODE_ENV !== 'ci' && process.env.SKIP_REMINDER !== 'true') {
        try {
            const reminderService = require('./services/reminderService');
            reminderService.startScheduler();
        } catch (err) {
            console.log('⚠️ Reminder service skipped:', err.message);
        }
    } else {
        console.log('⏭️ Reminder service skipped in CI environment');
    }
});