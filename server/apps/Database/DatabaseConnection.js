const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'tn_clinic',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: process.env.DB_DIALECT || 'mysql',
        logging: false, // Tắt log SQL queries
        timezone: '+07:00', // ✅ Timezone Việt Nam (UTC+7)
        dialectOptions: {
            timezone: '+07:00', // ✅ Timezone cho MySQL connection
            dateStrings: true,
            typeCast: true
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true, // ✅ Enable timestamps mặc định
            underscored: true, // ✅ Sử dụng snake_case (created_at, updated_at)
            freezeTableName: true // ✅ Không tự động pluralize table names
        }
    }
);

module.exports = sequelize;
