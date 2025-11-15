const sequelize = require('../config/database');

const Admin = require('./Admin');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Specialty = require('./Specialty');
const Service = require('./Service');
const Booking = require('./Booking');

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

    console.log('✅ Models and relationships loaded successfully');
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
    Booking
};