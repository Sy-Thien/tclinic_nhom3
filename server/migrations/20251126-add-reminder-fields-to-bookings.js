'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('tn_booking', 'reminder_sent', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            comment: 'Đã gửi email nhắc lịch chưa'
        });

        await queryInterface.addColumn('tn_booking', 'reminder_sent_at', {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'Thời điểm gửi email nhắc lịch'
        });

        console.log('✅ Added reminder_sent and reminder_sent_at columns to tn_booking table');
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('tn_booking', 'reminder_sent');
        await queryInterface.removeColumn('tn_booking', 'reminder_sent_at');
    }
};