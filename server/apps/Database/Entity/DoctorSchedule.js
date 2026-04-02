const { Model, DataTypes } = require('sequelize');
const sequelize = require('../DatabaseConnection');

class DoctorSchedule extends Model { }

DoctorSchedule.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    doctor_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    day_of_week: {
        type: DataTypes.ENUM('Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'),
        allowNull: false
    },
    start_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    end_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    break_start: {
        type: DataTypes.TIME,
        allowNull: true
    },
    break_end: {
        type: DataTypes.TIME,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    room: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Phòng khám'
    },
    approval_status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'approved',
        comment: 'Trạng thái phê duyệt: pending (chờ duyệt), approved (đã duyệt), rejected (từ chối)'
    },
    approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID admin phê duyệt'
    },
    approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Thời gian phê duyệt'
    },
    rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Lý do từ chối (nếu rejected)'
    }
}, {
    sequelize,
    modelName: 'DoctorSchedule',
    tableName: 'tn_doctor_schedules',
    timestamps: true,
    underscored: false
});

module.exports = DoctorSchedule;

