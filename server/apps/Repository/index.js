// Export all repositories

const AdminRepository = require('./AdminRepository');
const PatientRepository = require('./PatientRepository');
const DoctorRepository = require('./DoctorRepository');
const BookingRepository = require('./BookingRepository');
const SpecialtyRepository = require('./SpecialtyRepository');
const ServiceRepository = require('./ServiceRepository');
const TimeSlotRepository = require('./TimeSlotRepository');
const DrugRepository = require('./DrugRepository');
const PrescriptionRepository = require('./PrescriptionRepository');
const RoomRepository = require('./RoomRepository');
const BaseRepository = require('./BaseRepository');

module.exports = {
    BaseRepository,
    AdminRepository,
    PatientRepository,
    DoctorRepository,
    BookingRepository,
    SpecialtyRepository,
    ServiceRepository,
    TimeSlotRepository,
    DrugRepository,
    PrescriptionRepository,
    RoomRepository
};
