'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Kiểm tra bảng tn_treatments có tồn tại không
        const tables = await queryInterface.showAllTables();

        if (tables.includes('tn_treatments')) {
            // Đổi tên cột appointment_id → booking_id
            await queryInterface.renameColumn('tn_treatments', 'appointment_id', 'booking_id');
            console.log('✅ Renamed appointment_id → booking_id in tn_treatments');
        } else {
            // Tạo bảng mới nếu chưa tồn tại
            await queryInterface.createTable('tn_treatments', {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                booking_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'tn_booking',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE'
                },
                type: {
                    type: Sequelize.STRING(20),
                    allowNull: true
                },
                times: {
                    type: Sequelize.INTEGER,
                    allowNull: true
                },
                purpose: {
                    type: Sequelize.STRING(50),
                    allowNull: true
                },
                instruction: {
                    type: Sequelize.STRING(255),
                    allowNull: true
                },
                repeat_days: {
                    type: Sequelize.STRING(255),
                    allowNull: true
                },
                repeat_time: {
                    type: Sequelize.STRING(5),
                    allowNull: true
                }
            });
            console.log('✅ Created tn_treatments table with correct booking_id FK');
        }
    },

    async down(queryInterface, Sequelize) {
        const tables = await queryInterface.showAllTables();
        if (tables.includes('tn_treatments')) {
            try {
                await queryInterface.renameColumn('tn_treatments', 'booking_id', 'appointment_id');
            } catch (e) {
                // Nếu không đổi được thì xóa bảng
                await queryInterface.dropTable('tn_treatments');
            }
        }
    }
};
