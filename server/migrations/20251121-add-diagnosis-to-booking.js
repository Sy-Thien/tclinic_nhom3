'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('tn_booking', 'diagnosis', {
            type: Sequelize.TEXT,
            allowNull: true,
            after: 'symptoms'
        });

        await queryInterface.addColumn('tn_booking', 'conclusion', {
            type: Sequelize.TEXT,
            allowNull: true,
            after: 'diagnosis'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('tn_booking', 'diagnosis');
        await queryInterface.removeColumn('tn_booking', 'conclusion');
    }
};
