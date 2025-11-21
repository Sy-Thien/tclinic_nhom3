'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('tn_drugs', 'ingredient', {
            type: Sequelize.TEXT,
            allowNull: true,
            after: 'name'
        });

        await queryInterface.addColumn('tn_drugs', 'price', {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('tn_drugs', 'ingredient');
        await queryInterface.removeColumn('tn_drugs', 'price');
    }
};
