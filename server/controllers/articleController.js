const { Article, ArticleCategory } = require('../models');
const { Op } = require('sequelize');

// Public - Lấy danh sách bài viết
exports.getArticles = async (req, res) => {
    console.log('📰 getArticles called with query:', req.query);
    try {
        const { category, search, page = 1, limit = 10 } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        const where = { status: 'published' };

        if (category) {
            // Support both category ID and slug
            const cat = await ArticleCategory.findOne({
                where: {
                    [Op.or]: [
                        { id: category },
                        { slug: category }
                    ]
                }
            });
            if (cat) {
                where.category_id = cat.id;
            }
        }

        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { excerpt: { [Op.like]: `%${search}%` } },
                { content: { [Op.like]: `%${search}%` } }
            ];
        }

        const articles = await Article.findAndCountAll({
            where,
            include: [{
                model: ArticleCategory,
                as: 'category',
                attributes: ['id', 'name', 'slug']
            }],
            order: [['published_at', 'DESC']],
            limit: limitNum,
            offset: offset,
            attributes: ['id', 'title', 'slug', 'excerpt', 'thumbnail', 'published_at', 'views']
        });

        const totalPages = Math.ceil(articles.count / limitNum);

        res.json({
            articles: articles.rows,
            pagination: {
                total: articles.count,
                page: pageNum,
                limit: limitNum,
                totalPages: totalPages
            }
        });

    } catch (error) {
        console.error('❌ Get articles error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Public - Lấy chi tiết bài viết
exports.getArticleDetail = async (req, res) => {
    try {
        const { slug } = req.params;

        const article = await Article.findOne({
            where: {
                slug,
                status: 'published'
            },
            include: [{
                model: ArticleCategory,
                as: 'category',
                attributes: ['id', 'name', 'slug']
            }]
        });

        if (!article) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        // Tăng lượt xem
        await article.increment('views');

        // Lấy bài viết liên quan
        const relatedArticles = await Article.findAll({
            where: {
                category_id: article.category_id,
                id: { [Op.ne]: article.id },
                status: 'published'
            },
            limit: 3,
            order: [['published_at', 'DESC']],
            attributes: ['id', 'title', 'slug', 'excerpt', 'thumbnail', 'published_at']
        });

        res.json({
            success: true,
            data: {
                article,
                relatedArticles
            }
        });

    } catch (error) {
        console.error('❌ Get article detail error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Public - Lấy danh mục bài viết
exports.getCategories = async (req, res) => {
    try {
        const categories = await ArticleCategory.findAll({
            attributes: ['id', 'name', 'slug', 'description'],
            order: [['name', 'ASC']]
        });

        res.json({
            success: true,
            data: categories
        });

    } catch (error) {
        console.error('❌ Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Public - Bài viết nổi bật (featured)
exports.getFeaturedArticles = async (req, res) => {
    try {
        const articles = await Article.findAll({
            where: {
                status: 'published',
                is_featured: true
            },
            include: [{
                model: ArticleCategory,
                as: 'category',
                attributes: ['name', 'slug']
            }],
            order: [['published_at', 'DESC']],
            limit: 5,
            attributes: ['id', 'title', 'slug', 'excerpt', 'thumbnail', 'published_at']
        });

        res.json({
            success: true,
            data: articles
        });

    } catch (error) {
        console.error('❌ Get featured articles error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// Public - Bài viết phổ biến (most viewed)
exports.getPopularArticles = async (req, res) => {
    try {
        const articles = await Article.findAll({
            where: {
                status: 'published'
            },
            order: [['views', 'DESC']],
            limit: 5,
            attributes: ['id', 'title', 'slug', 'thumbnail', 'views', 'published_at']
        });

        res.json({
            success: true,
            data: articles
        });

    } catch (error) {
        console.error('❌ Get popular articles error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

module.exports = exports;
