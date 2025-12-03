'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('tn_article_categories', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false,
                comment: 'Tên danh mục'
            },
            slug: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true,
                comment: 'URL-friendly name'
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Mô tả danh mục'
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        }, {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
            comment: 'Danh mục bài viết (sức khỏe, tin tức phòng khám, v.v.)'
        });

        // Seed initial categories
        await queryInterface.bulkInsert('tn_article_categories', [
            {
                name: 'Sức khỏe tổng quát',
                slug: 'suc-khoe-tong-quat',
                description: 'Bài viết về chăm sóc sức khỏe hàng ngày',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                name: 'Dinh dưỡng',
                slug: 'dinh-duong',
                description: 'Hướng dẫn về chế độ ăn uống lành mạnh',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                name: 'Tin tức phòng khám',
                slug: 'tin-tuc-phong-kham',
                description: 'Thông báo và sự kiện của phòng khám',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                name: 'Bệnh thường gặp',
                slug: 'benh-thuong-gap',
                description: 'Thông tin về các bệnh phổ biến và cách phòng ngừa',
                created_at: new Date(),
                updated_at: new Date()
            }
        ], {});

        console.log('✅ Created tn_article_categories table with sample data');
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('tn_article_categories');
    }
};
