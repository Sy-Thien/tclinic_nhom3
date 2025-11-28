'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('tn_booking', 'time_slot_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'tn_time_slots',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'Liên kết với time slot'
        });

        await queryInterface.addIndex('tn_booking', ['time_slot_id'], {
            name: 'idx_booking_time_slot'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('tn_booking', 'time_slot_id');
    }
};
