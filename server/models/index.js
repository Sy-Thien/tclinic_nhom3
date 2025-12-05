const sequelize = require('../config/database');

// Import all models
const Admin = require('./Admin');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Specialty = require('./Specialty');
const Service = require('./Service');
const Booking = require('./Booking');
const Drug = require('./Drug');
const Prescription = require('./Prescription');  // ✅ NEW
const PrescriptionDetail = require('./PrescriptionDetail');  // ✅ NEW
const Review = require('./Review');
const Notification = require('./Notification');
const MedicalHistory = require('./MedicalHistory');
const Treatment = require('./Treatment');
const BookingPhoto = require('./BookingPhoto');
// const DoctorAvailability = require('./DoctorAvailability');  // ✅ DISABLED - Using DoctorSchedule instead

// Initialize DoctorSchedule model (it's a factory function)
const DoctorSchedule = require('./DoctorSchedule')(sequelize, require('sequelize').DataTypes);

// Initialize TimeSlot model (factory function)
const TimeSlot = require('./TimeSlot')(sequelize, require('sequelize').DataTypes);

// Initialize Room model (factory function)
const Room = require('./Room')(sequelize, require('sequelize').DataTypes);

// Initialize Article models (factory functions)
const Article = require('./Article')(sequelize, require('sequelize').DataTypes);
const ArticleCategory = require('./ArticleCategory')(sequelize, require('sequelize').DataTypes);

// Initialize ConsultationRequest model (factory function)
const ConsultationRequest = require('./ConsultationRequest')(sequelize, require('sequelize').DataTypes);

console.log('📦 Loading models...');

try {
    // ✅ Specialty <-> Service
    Specialty.hasMany(Service, {
        foreignKey: 'specialty_id',
        as: 'services'
    });
    Service.belongsTo(Specialty, {
        foreignKey: 'specialty_id',
        as: 'specialty'
    });

    // ✅ Doctor <-> Specialty
    Doctor.belongsTo(Specialty, {
        foreignKey: 'specialty_id',
        as: 'specialty'
    });
    Specialty.hasMany(Doctor, {
        foreignKey: 'specialty_id',
        as: 'doctors'
    });

    // ✅ Booking <-> Patient
    Booking.belongsTo(Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
    });
    Patient.hasMany(Booking, {
        foreignKey: 'patient_id',
        as: 'bookings'
    });

    // ✅ Booking <-> Service
    Booking.belongsTo(Service, {
        foreignKey: 'service_id',
        as: 'service'
    });
    Service.hasMany(Booking, {
        foreignKey: 'service_id',
        as: 'bookings'
    });

    // ✅ Booking <-> Specialty
    Booking.belongsTo(Specialty, {
        foreignKey: 'specialty_id',
        as: 'specialty'
    });
    Specialty.hasMany(Booking, {
        foreignKey: 'specialty_id',
        as: 'bookings'
    });

    // ✅ Booking <-> Doctor
    Booking.belongsTo(Doctor, {
        foreignKey: 'doctor_id',
        as: 'doctor'
    });
    Doctor.hasMany(Booking, {
        foreignKey: 'doctor_id',
        as: 'bookings'
    });

    // ✅ Review <-> Patient & Doctor
    Review.belongsTo(Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
    });
    Patient.hasMany(Review, {
        foreignKey: 'patient_id',
        as: 'reviews'
    });

    Review.belongsTo(Doctor, {
        foreignKey: 'doctor_id',
        as: 'doctor'
    });
    Doctor.hasMany(Review, {
        foreignKey: 'doctor_id',
        as: 'reviews'
    });

    // ✅ Notification <-> Patient
    Notification.belongsTo(Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
    });
    Patient.hasMany(Notification, {
        foreignKey: 'patient_id',
        as: 'notifications'
    });

    // ✅ MedicalHistory <-> Patient
    MedicalHistory.belongsTo(Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
    });
    Patient.hasMany(MedicalHistory, {
        foreignKey: 'patient_id',
        as: 'medicalHistories'
    });

    // ✅ MedicalHistory <-> Doctor
    MedicalHistory.belongsTo(Doctor, {
        foreignKey: 'doctor_id',
        as: 'doctor'
    });
    Doctor.hasMany(MedicalHistory, {
        foreignKey: 'doctor_id',
        as: 'medicalHistories'
    });

    // ✅ MedicalHistory <-> Booking
    MedicalHistory.belongsTo(Booking, {
        foreignKey: 'booking_id',
        as: 'booking'
    });
    Booking.hasOne(MedicalHistory, {
        foreignKey: 'booking_id',
        as: 'medicalHistory'
    });

    // ✅ MedicalHistory <-> Prescription
    MedicalHistory.belongsTo(Prescription, {
        foreignKey: 'prescription_id',
        as: 'prescription'
    });
    Prescription.hasOne(MedicalHistory, {
        foreignKey: 'prescription_id',
        as: 'medicalHistory'
    });

    // ✅ BookingPhoto <-> Booking
    BookingPhoto.belongsTo(Booking, {
        foreignKey: 'booking_id',
        as: 'booking'
    });
    Booking.hasMany(BookingPhoto, {
        foreignKey: 'booking_id',
        as: 'photos'
    });

    // ✅ Prescription <-> Booking
    Prescription.belongsTo(Booking, {
        foreignKey: 'booking_id',
        as: 'booking'
    });
    Booking.hasOne(Prescription, {
        foreignKey: 'booking_id',
        as: 'prescription'
    });

    // ✅ Prescription <-> Doctor
    Prescription.belongsTo(Doctor, {
        foreignKey: 'doctor_id',
        as: 'doctor'
    });
    Doctor.hasMany(Prescription, {
        foreignKey: 'doctor_id',
        as: 'prescriptions'
    });

    // ✅ Prescription <-> Patient
    Prescription.belongsTo(Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
    });
    Patient.hasMany(Prescription, {
        foreignKey: 'patient_id',
        as: 'prescriptions'
    });

    // ✅ PrescriptionDetail <-> Prescription
    PrescriptionDetail.belongsTo(Prescription, {
        foreignKey: 'prescription_id',
        as: 'prescription'
    });
    Prescription.hasMany(PrescriptionDetail, {
        foreignKey: 'prescription_id',
        as: 'details'
    });

    // ✅ PrescriptionDetail <-> Drug
    PrescriptionDetail.belongsTo(Drug, {
        foreignKey: 'drug_id',
        as: 'drug'
    });
    Drug.hasMany(PrescriptionDetail, {
        foreignKey: 'drug_id',
        as: 'prescriptionDetails'
    });

    // ✅ DoctorSchedule <-> Doctor
    DoctorSchedule.belongsTo(Doctor, {
        foreignKey: 'doctor_id',
        as: 'doctor'
    });
    Doctor.hasMany(DoctorSchedule, {
        foreignKey: 'doctor_id',
        as: 'schedules'
    });

    // ⚠️ DoctorSchedule does NOT have room_id column - it uses 'room' string field instead
    // Do not create room association here

    // ✅ TimeSlot <-> Doctor
    TimeSlot.belongsTo(Doctor, {
        foreignKey: 'doctor_id',
        as: 'doctor'
    });
    Doctor.hasMany(TimeSlot, {
        foreignKey: 'doctor_id',
        as: 'timeSlots'
    });

    // ✅ TimeSlot <-> Room
    TimeSlot.belongsTo(Room, {
        foreignKey: 'room_id',
        as: 'room'
    });
    Room.hasMany(TimeSlot, {
        foreignKey: 'room_id',
        as: 'timeSlots'
    });

    // ✅ TimeSlot <-> Booking
    TimeSlot.hasMany(Booking, {
        foreignKey: 'time_slot_id',
        as: 'bookings'
    });
    Booking.belongsTo(TimeSlot, {
        foreignKey: 'time_slot_id',
        as: 'timeSlot'
    });

    // ✅ Room <-> Specialty
    Room.belongsTo(Specialty, {
        foreignKey: 'specialty_id',
        as: 'specialty'
    });
    Specialty.hasMany(Room, {
        foreignKey: 'specialty_id',
        as: 'rooms'
    });

    // ✅ ArticleCategory <-> Article
    ArticleCategory.hasMany(Article, {
        foreignKey: 'category_id',
        as: 'articles'
    });
    Article.belongsTo(ArticleCategory, {
        foreignKey: 'category_id',
        as: 'category'
    });

    // ✅ Admin <-> Article (author)
    Admin.hasMany(Article, {
        foreignKey: 'author_id',
        as: 'articles'
    });
    Article.belongsTo(Admin, {
        foreignKey: 'author_id',
        as: 'author'
    });

    // ✅ ConsultationRequest relationships
    ConsultationRequest.belongsTo(Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
    });
    Patient.hasMany(ConsultationRequest, {
        foreignKey: 'patient_id',
        as: 'consultationRequests'
    });

    ConsultationRequest.belongsTo(Specialty, {
        foreignKey: 'specialty_id',
        as: 'specialty'
    });
    Specialty.hasMany(ConsultationRequest, {
        foreignKey: 'specialty_id',
        as: 'consultationRequests'
    });

    ConsultationRequest.belongsTo(Doctor, {
        foreignKey: 'assigned_doctor_id',
        as: 'assignedDoctor'
    });
    Doctor.hasMany(ConsultationRequest, {
        foreignKey: 'assigned_doctor_id',
        as: 'consultationRequests'
    });

    ConsultationRequest.belongsTo(Admin, {
        foreignKey: 'assigned_by_admin_id',
        as: 'assignedByAdmin'
    });
    Admin.hasMany(ConsultationRequest, {
        foreignKey: 'assigned_by_admin_id',
        as: 'assignedConsultations'
    });

    console.log('✅ All models and relationships loaded successfully');
} catch (error) {
    console.error('❌ Error loading models:', error);
}

module.exports = {
    sequelize,
    Admin,
    Patient,
    Doctor,
    Specialty,
    Service,
    Booking,
    Drug,
    Prescription,  // ✅ NEW
    PrescriptionDetail,  // ✅ NEW
    Room,
    Review,
    Notification,
    MedicalHistory,
    Treatment,
    BookingPhoto,
    DoctorSchedule,
    TimeSlot,  // ✅ NEW
    Article,  // ✅ NEW
    ArticleCategory,  // ✅ NEW
    ConsultationRequest  // ✅ NEW: Support/Consultation system
};