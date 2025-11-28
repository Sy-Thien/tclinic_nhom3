'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Thêm cột floor
        await queryInterface.addColumn('tn_rooms', 'floor', {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 1,
            comment: 'Số tầng'
        });

        // Thêm cột specialty_id (liên kết với chuyên khoa)
        await queryInterface.addColumn('tn_rooms', 'specialty_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'tn_specialties',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'Chuyên khoa của phòng khám'
        });

        // Thêm cột room_number (số phòng cụ thể)
        await queryInterface.addColumn('tn_rooms', 'room_number', {
            type: Sequelize.STRING(10),
            allowNull: true,
            comment: 'Số phòng (VD: 101, 102, A01...)'
        });

        // Thêm cột status
        await queryInterface.addColumn('tn_rooms', 'status', {
            type: Sequelize.ENUM('active', 'inactive', 'maintenance'),
            allowNull: false,
            defaultValue: 'active',
            comment: 'Trạng thái phòng'
        });

        // Thêm cột description
        await queryInterface.addColumn('tn_rooms', 'description', {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Mô tả phòng khám'
        });

        // Thêm cột capacity (sức chứa)
        await queryInterface.addColumn('tn_rooms', 'capacity', {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 1,
            comment: 'Số bệnh nhân có thể khám cùng lúc'
        });

        // Tăng độ dài name để chứa tên đầy đủ hơn
        await queryInterface.changeColumn('tn_rooms', 'name', {
            type: Sequelize.STRING(100),
            allowNull: false
        });

        console.log('✅ Updated tn_rooms table with new columns');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('tn_rooms', 'floor');
        await queryInterface.removeColumn('tn_rooms', 'specialty_id');
        await queryInterface.removeColumn('tn_rooms', 'room_number');
        await queryInterface.removeColumn('tn_rooms', 'status');
        await queryInterface.removeColumn('tn_rooms', 'description');
        await queryInterface.removeColumn('tn_rooms', 'capacity');

        await queryInterface.changeColumn('tn_rooms', 'name', {
            type: Sequelize.STRING(15),
            allowNull: false
        });
    }
};
