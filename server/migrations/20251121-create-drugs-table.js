'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Kiểm tra và xóa bảng nếu tồn tại
        await queryInterface.dropTable('tn_drugs', { force: true }).catch(() => { });

        // Tạo bảng mới
        await queryInterface.createTable('tn_drugs', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true
            },
            ingredient: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            unit: {
                type: Sequelize.STRING(50),
                allowNull: true,
                defaultValue: 'viên'
            },
            expiry_date: {
                type: Sequelize.DATE,
                allowNull: true
            },
            warning_level: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 10,
                comment: 'Cảnh báo khi tồn kho dưới mức này'
            },
            price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: Sequelize.NOW
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('tn_drugs');
    }
};
