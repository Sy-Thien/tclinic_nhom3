const { Model, DataTypes } = require('sequelize');
const sequelize = require('../DatabaseConnection');

class ConsultationRequest extends Model { }

ConsultationRequest.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    patient_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'NULL nếu là guest user'
    },
    guest_name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    guest_email: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    guest_phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    subject: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('general', 'medical_inquiry', 'appointment', 'complaint', 'other'),
        defaultValue: 'general'
    },
    specialty_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    assigned_doctor_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    assigned_by_admin_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    assigned_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'assigned', 'in_progress', 'resolved', 'closed'),
        defaultValue: 'pending'
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
    },
    admin_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    doctor_response: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    responded_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    resolved_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'ConsultationRequest',
    tableName: 'tn_consultation_requests',
    timestamps: true,
    underscored: true
});

module.exports = ConsultationRequest;

