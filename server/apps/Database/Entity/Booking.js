const { Model, DataTypes } = require('sequelize');
const sequelize = require('../DatabaseConnection');

class Booking extends Model { }

Booking.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    patient_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tn_patients',
            key: 'id'
        }
    },
    booking_code: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    patient_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    patient_email: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    patient_phone: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    patient_gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true
    },
    patient_dob: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    patient_address: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    specialty_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tn_specialties',
            key: 'id'
        }
    },
    service_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // ✅ Cho phép null - service có thể được chọn sau hoặc không bắt buộc
        references: {
            model: 'tn_services',
            key: 'id'
        }
    },
    doctor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tn_doctors',
            key: 'id'
        }
    },
    appointment_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    appointment_time: {
        type: DataTypes.STRING(5),
        allowNull: true
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    symptoms: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    diagnosis: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Chẩn đoán từ bác sĩ'
    },
    conclusion: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Kết luận từ bác sĩ'
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM(
            'pending',                      // Chờ xử lý (legacy)
            'waiting_doctor_assignment',    // Chờ admin gán bác sĩ (Option 1: Đặt luôn)
            'waiting_doctor_confirmation',  // Chờ bác sĩ xác nhận (Option 2: Chọn bác sĩ)
            'confirmed',                    // Đã xác nhận
            'completed',                    // Đã hoàn thành khám
            'cancelled',                    // Đã hủy
            'doctor_rejected'               // Bác sĩ từ chối
        ),
        allowNull: true,
        defaultValue: 'pending'
    },
    cancel_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Lý do hủy'
    },
    reject_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Lý do bác sĩ từ chối'
    },
    price: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: true
    },
    time_slot_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tn_time_slots',
            key: 'id'
        }
    },
    reminder_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Đã gửi email nhắc lịch chưa'
    },
    reminder_sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Thời điểm gửi email nhắc lịch'
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'Booking',
    tableName: 'tn_booking',
    timestamps: false
});

module.exports = Booking;
