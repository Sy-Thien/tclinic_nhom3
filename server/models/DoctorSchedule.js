module.exports = (sequelize, DataTypes) => {
    const DoctorSchedule = sequelize.define('DoctorSchedule', {
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
        }
    }, {
        tableName: 'doctor_schedules',
        timestamps: false  // ✅ FIX: Bảng không có created_at/updated_at
    });

    DoctorSchedule.associate = (models) => {
        DoctorSchedule.belongsTo(models.Doctor, {
            foreignKey: 'doctor_id',
            as: 'doctor'
        });
    };

    return DoctorSchedule;
};
