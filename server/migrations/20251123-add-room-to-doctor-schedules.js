'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('doctor_schedules', 'room', {
            type: Sequelize.STRING(50),
            allowNull: true,
            comment: 'Phòng khám'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('doctor_schedules', 'room');
    }
};
