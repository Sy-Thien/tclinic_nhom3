module.exports = (sequelize, DataTypes) => {
    const TimeSlot = sequelize.define('TimeSlot', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        doctor_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'tn_doctors',
                key: 'id'
            }
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Ngày khám (YYYY-MM-DD)'
        },
        start_time: {
            type: DataTypes.TIME,
            allowNull: false,
            comment: 'Giờ bắt đầu khung giờ'
        },
        end_time: {
            type: DataTypes.TIME,
            allowNull: false,
            comment: 'Giờ kết thúc khung giờ'
        },
        max_patients: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: 'Số lượng bệnh nhân tối đa trong khung giờ này'
        },
        current_patients: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Số lượng bệnh nhân đã đặt'
        },
        is_available: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Trạng thái có sẵn hay không'
        },
        room_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'tn_rooms',
                key: 'id'
            }
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Ghi chú'
        }
    }, {
        tableName: 'tn_time_slots',
        timestamps: true,
        underscored: true,  // Sử dụng snake_case cho timestamps
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['doctor_id', 'date', 'start_time'],
                unique: true
            },
            {
                fields: ['date']
            }
        ]
    });

    TimeSlot.associate = (models) => {
        TimeSlot.belongsTo(models.Doctor, {
            foreignKey: 'doctor_id',
            as: 'doctor'
        });

        TimeSlot.belongsTo(models.Room, {
            foreignKey: 'room_id',
            as: 'room'
        });

        // Quan hệ với booking
        TimeSlot.hasMany(models.Booking, {
            foreignKey: 'time_slot_id',
            as: 'bookings'
        });
    };

    return TimeSlot;
};
