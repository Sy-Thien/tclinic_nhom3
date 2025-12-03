'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('tn_articles', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            category_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'tn_article_categories',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
                comment: 'Danh mục bài viết'
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'Tiêu đề bài viết'
            },
            slug: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
                comment: 'URL-friendly slug'
            },
            excerpt: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Tóm tắt ngắn'
            },
            content: {
                type: Sequelize.TEXT('long'),
                allowNull: false,
                comment: 'Nội dung đầy đủ (HTML)'
            },
            thumbnail: {
                type: Sequelize.STRING(500),
                allowNull: true,
                comment: 'URL ảnh đại diện'
            },
            author_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'tn_admins',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
                comment: 'Admin tạo bài viết'
            },
            status: {
                type: Sequelize.ENUM('draft', 'published', 'archived'),
                allowNull: false,
                defaultValue: 'draft',
                comment: 'Trạng thái bài viết'
            },
            is_featured: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: 'Bài viết nổi bật'
            },
            views: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Số lượt xem'
            },
            published_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Thời gian xuất bản'
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
            comment: 'Bài viết, tin tức về sức khỏe'
        });

        // Add indexes
        await queryInterface.addIndex('tn_articles', ['category_id'], {
            name: 'idx_articles_category'
        });

        await queryInterface.addIndex('tn_articles', ['status', 'published_at'], {
            name: 'idx_articles_status_published'
        });

        await queryInterface.addIndex('tn_articles', ['is_featured'], {
            name: 'idx_articles_featured'
        });

        await queryInterface.addIndex('tn_articles', ['slug'], {
            name: 'idx_articles_slug'
        });

        // Seed sample articles
        const categories = await queryInterface.sequelize.query(
            'SELECT id, slug FROM tn_article_categories',
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.slug] = cat.id;
        });

        await queryInterface.bulkInsert('tn_articles', [
            {
                category_id: categoryMap['suc-khoe-tong-quat'],
                title: '10 Thói quen tốt cho sức khỏe bạn nên làm mỗi ngày',
                slug: '10-thoi-quen-tot-cho-suc-khoe',
                excerpt: 'Khám phá những thói quen đơn giản nhưng hiệu quả giúp cải thiện sức khỏe tổng thể của bạn.',
                content: '<h2>1. Uống đủ nước</h2><p>Cơ thể cần ít nhất 2 lít nước mỗi ngày...</p><h2>2. Ngủ đủ giấc</h2><p>Giấc ngủ chất lượng rất quan trọng...</p><h2>3. Vận động thường xuyên</h2><p>Tập thể dục ít nhất 30 phút mỗi ngày...</p>',
                thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
                status: 'published',
                is_featured: true,
                views: 1250,
                published_at: new Date('2024-01-15'),
                created_at: new Date('2024-01-15'),
                updated_at: new Date('2024-01-15')
            },
            {
                category_id: categoryMap['dinh-duong'],
                title: 'Chế độ ăn lành mạnh cho người bận rộn',
                slug: 'che-do-an-lanh-manh-cho-nguoi-ban-ron',
                excerpt: 'Hướng dẫn xây dựng thực đơn dinh dưỡng phù hợp với lịch trình công việc dày đặc.',
                content: '<h2>Lên kế hoạch bữa ăn</h2><p>Dành 1-2 giờ cuối tuần để chuẩn bị...</p><h2>Món ăn nhanh nhưng bổ dưỡng</h2><p>Salad, sinh tố, cơm hộp...</p>',
                thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
                status: 'published',
                is_featured: true,
                views: 890,
                published_at: new Date('2024-01-20'),
                created_at: new Date('2024-01-20'),
                updated_at: new Date('2024-01-20')
            },
            {
                category_id: categoryMap['tin-tuc-phong-kham'],
                title: 'TClinic triển khai hệ thống đặt khám trực tuyến mới',
                slug: 'tclinic-trien-khai-he-thong-dat-kham-truc-tuyen',
                excerpt: 'Đặt lịch khám nhanh chóng và tiện lợi hơn với nền tảng mới của chúng tôi.',
                content: '<h2>Tính năng mới</h2><ul><li>Đặt khám 24/7</li><li>Xem lịch bác sĩ trực tuyến</li><li>Nhận nhắc nhở qua email</li></ul>',
                thumbnail: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
                status: 'published',
                is_featured: false,
                views: 2340,
                published_at: new Date('2024-02-01'),
                created_at: new Date('2024-02-01'),
                updated_at: new Date('2024-02-01')
            },
            {
                category_id: categoryMap['benh-thuong-gap'],
                title: 'Cách phòng ngừa cảm cúm mùa hiệu quả',
                slug: 'cach-phong-ngua-cam-cum-mua',
                excerpt: 'Những biện pháp đơn giản giúp bảo vệ bạn khỏi virus cảm cúm phổ biến.',
                content: '<h2>Tiêm phòng vaccine</h2><p>Vaccine cảm cúm là biện pháp hiệu quả nhất...</p><h2>Rửa tay thường xuyên</h2><p>Xà phòng diệt khuẩn...</p>',
                thumbnail: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
                status: 'published',
                is_featured: false,
                views: 567,
                published_at: new Date('2024-02-10'),
                created_at: new Date('2024-02-10'),
                updated_at: new Date('2024-02-10')
            }
        ], {});

        console.log('✅ Created tn_articles table with sample articles');
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('tn_articles');
    }
};
