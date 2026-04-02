// Export all services

const AuthService = require('./AuthService');
const BookingService = require('./BookingService');
const DoctorService = require('./DoctorService');
const EmailService = require('./EmailService');
const ReminderService = require('./ReminderService');
const SocketService = require('./SocketService');
const AutoScheduleService = require('./AutoScheduleService');

module.exports = {
    AuthService,
    BookingService,
    DoctorService,
    EmailService,
    ReminderService,
    SocketService,
    AutoScheduleService
};
