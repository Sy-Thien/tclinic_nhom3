const { Model, DataTypes } = require('sequelize');
const sequelize = require('../DatabaseConnection');

class Room extends Model { }

Room.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Tên phòng khám'
    },
    room_number: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: 'Số phòng (VD: 101, 102, A01...)'
    },
    floor: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
        comment: 'Số tầng'
    },
    specialty_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tn_specialties',
            key: 'id'
        },
        comment: 'Chuyên khoa của phòng khám'
    },
    location: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Vị trí chi tiết'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
        allowNull: false,
        defaultValue: 'active',
        comment: 'Trạng thái phòng'
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
        comment: 'Số bệnh nhân có thể khám cùng lúc'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Mô tả phòng khám'
    }
}, {
    sequelize,
    modelName: 'Room',
    tableName: 'tn_rooms',
    timestamps: false
});

module.exports = Room;
