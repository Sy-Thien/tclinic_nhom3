// Export all controllers organized by domain

// Admin controllers
const adminAccount = require('./adminAccountController');
const adminBooking = require('./adminBookingController');
const adminConsultation = require('./adminConsultationController');
const adminDashboard = require('./adminDashboardController');
const adminDoctor = require('./adminDoctorController');
const adminDoctorSchedule = require('./adminDoctorScheduleController');
const adminDrug = require('./adminDrugController');
const adminPatient = require('./adminPatientController');
const adminReport = require('./adminReportController');
const adminRoom = require('./adminRoomController');
const adminService = require('./adminServiceController');
const adminSpecialty = require('./adminSpecialtyController');
const adminTimeSlot = require('./adminTimeSlotController');

// Auth controllers
const auth = require('./authController');

// Doctor controllers
const doctorAppointment = require('./doctorAppointmentController');
const doctorConsultation = require('./doctorConsultationController');
const doctorPrescription = require('./doctorPrescriptionController');
const doctorProfile = require('./doctorProfileController');
const doctorSchedule = require('./doctorScheduleController');
const doctorScheduleView = require('./doctorScheduleViewController');
const doctorSelfSchedule = require('./doctorSelfScheduleController');
const doctorWalkIn = require('./doctorWalkInController');
const doctorReview = require('./doctorReviewController');

// Patient controllers
const patientBooking = require('./bookingController');
const patientBookingAvailability = require('./bookingAvailabilityController');
const patientProfile = require('./patientProfileController');
const patientMedicalHistory = require('./medicalHistoryController');
const patientMedicalRecord = require('./medicalRecordController');
const patientReview = require('./reviewController');
const patientConsultation = require('./consultationRequestController');
const patientInvoice = require('./invoiceController');
const patientVnpay = require('./vnpayController');

// Public controllers
const publicController = require('./publicController');
const publicArticle = require('./articleController');
const publicDoctor = require('./doctorController');
const publicTimeSlot = require('./timeSlotController');
const publicReminder = require('./reminderController');

module.exports = {
    // Admin
    adminAccount,
    adminBooking,
    adminConsultation,
    adminDashboard,
    adminDoctor,
    adminDoctorSchedule,
    adminDrug,
    adminPatient,
    adminReport,
    adminRoom,
    adminService,
    adminSpecialty,
    adminTimeSlot,

    // Auth
    auth,

    // Doctor
    doctorAppointment,
    doctorConsultation,
    doctorPrescription,
    doctorProfile,
    doctorSchedule,
    doctorScheduleView,
    doctorSelfSchedule,
    doctorWalkIn,
    doctorReview,

    // Patient
    patientBooking,
    patientBookingAvailability,
    patientProfile,
    patientMedicalHistory,
    patientMedicalRecord,
    patientReview,
    patientConsultation,
    patientInvoice,
    patientVnpay,

    // Public
    publicController,
    publicArticle,
    publicDoctor,
    publicTimeSlot,
    publicReminder
};
