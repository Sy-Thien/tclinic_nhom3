const { Article, ArticleCategory } = require('../Database/Entity');
const { Op } = require('sequelize');

// Public - Lấy danh sách bài viết

class ArticleController {
    constructor() {
        this.adminCreateArticle = this.adminCreateArticle.bind(this);
        this.adminUpdateArticle = this.adminUpdateArticle.bind(this);
        this.adminCreateCategory = this.adminCreateCategory.bind(this);
    }

    async getArticles(req, res) {
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
    async getArticleDetail(req, res) {
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
    async getCategories(req, res) {
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
    async getFeaturedArticles(req, res) {
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
    async getPopularArticles(req, res) {
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

    // ========== ADMIN APIs ==========

    // Helper: Generate slug from title
    generateSlug(title) {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    // Admin - Lấy tất cả bài viết (bao gồm draft)
    async adminGetArticles(req, res) {
        console.log('📰 [Admin] getArticles called');
        try {
            const { category, search, status, page = 1, limit = 20 } = req.query;

            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;

            const where = {};

            if (status && status !== 'all') {
                where.status = status;
            }

            if (category && category !== 'all') {
                where.category_id = category;
            }

            if (search) {
                where[Op.or] = [
                    { title: { [Op.like]: `%${search}%` } },
                    { excerpt: { [Op.like]: `%${search}%` } }
                ];
            }

            const articles = await Article.findAndCountAll({
                where,
                include: [{
                    model: ArticleCategory,
                    as: 'category',
                    attributes: ['id', 'name', 'slug']
                }],
                order: [['created_at', 'DESC']],
                limit: limitNum,
                offset: offset
            });

            const totalPages = Math.ceil(articles.count / limitNum);

            res.json({
                success: true,
                articles: articles.rows,
                pagination: {
                    total: articles.count,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: totalPages
                }
            });

        } catch (error) {
            console.error('❌ [Admin] Get articles error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    };

    // Admin - Lấy chi tiết bài viết theo ID
    async adminGetArticleById(req, res) {
        try {
            const { id } = req.params;

            const article = await Article.findByPk(id, {
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

            res.json({
                success: true,
                data: article
            });

        } catch (error) {
            console.error('❌ [Admin] Get article by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    };

    // Admin - Tạo bài viết mới
    async adminCreateArticle(req, res) {
        try {
            const { title, content, excerpt, category_id, thumbnail, status, is_featured } = req.body;

            if (!title || !content) {
                return res.status(400).json({
                    success: false,
                    message: 'Tiêu đề và nội dung là bắt buộc'
                });
            }

            // Generate unique slug
            let baseSlug = this.generateSlug(title);
            let slug = baseSlug;
            let counter = 1;

            while (await Article.findOne({ where: { slug } })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }

            const article = await Article.create({
                title,
                slug,
                content,
                excerpt: excerpt || content.substring(0, 200),
                category_id: category_id || null,
                thumbnail: thumbnail || null,
                status: status || 'draft',
                is_featured: is_featured || false,
                author_id: req.user?.id || null,
                published_at: status === 'published' ? new Date() : null,
                views: 0
            });

            console.log('✅ [Admin] Article created:', article.id);

            res.status(201).json({
                success: true,
                message: 'Tạo bài viết thành công',
                data: article
            });

        } catch (error) {
            console.error('❌ [Admin] Create article error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    };

    // Admin - Cập nhật bài viết
    async adminUpdateArticle(req, res) {
        try {
            const { id } = req.params;
            const { title, content, excerpt, category_id, thumbnail, status, is_featured } = req.body;

            const article = await Article.findByPk(id);

            if (!article) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy bài viết'
                });
            }

            // Update slug if title changed
            let slug = article.slug;
            if (title && title !== article.title) {
                let baseSlug = this.generateSlug(title);
                slug = baseSlug;
                let counter = 1;

                while (await Article.findOne({ where: { slug, id: { [Op.ne]: id } } })) {
                    slug = `${baseSlug}-${counter}`;
                    counter++;
                }
            }

            // Check if publishing for the first time
            const isNewlyPublished = status === 'published' && article.status !== 'published';

            await article.update({
                title: title || article.title,
                slug,
                content: content || article.content,
                excerpt: excerpt || article.excerpt,
                category_id: category_id !== undefined ? category_id : article.category_id,
                thumbnail: thumbnail !== undefined ? thumbnail : article.thumbnail,
                status: status || article.status,
                is_featured: is_featured !== undefined ? is_featured : article.is_featured,
                published_at: isNewlyPublished ? new Date() : article.published_at,
                updated_at: new Date()
            });

            console.log('✅ [Admin] Article updated:', article.id);

            res.json({
                success: true,
                message: 'Cập nhật bài viết thành công',
                data: article
            });

        } catch (error) {
            console.error('❌ [Admin] Update article error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    };

    // Admin - Xóa bài viết
    async adminDeleteArticle(req, res) {
        try {
            const { id } = req.params;

            const article = await Article.findByPk(id);

            if (!article) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy bài viết'
                });
            }

            await article.destroy();

            console.log('✅ [Admin] Article deleted:', id);

            res.json({
                success: true,
                message: 'Xóa bài viết thành công'
            });

        } catch (error) {
            console.error('❌ [Admin] Delete article error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    };

    // Admin - Quản lý danh mục
    async adminGetCategories(req, res) {
        try {
            const categories = await ArticleCategory.findAll({
                order: [['name', 'ASC']],
                include: [{
                    model: Article,
                    as: 'articles',
                    attributes: ['id'],
                    required: false
                }]
            });

            // Add article count to each category
            const categoriesWithCount = categories.map(cat => ({
                ...cat.toJSON(),
                articleCount: cat.articles?.length || 0
            }));

            res.json({
                success: true,
                data: categoriesWithCount
            });

        } catch (error) {
            console.error('❌ [Admin] Get categories error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    };

    // Admin - Tạo danh mục
    async adminCreateCategory(req, res) {
        try {
            const { name, description } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên danh mục là bắt buộc'
                });
            }

            const slug = this.generateSlug(name);

            // Check if slug exists
            const existing = await ArticleCategory.findOne({ where: { slug } });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Danh mục đã tồn tại'
                });
            }

            const category = await ArticleCategory.create({
                name,
                slug,
                description: description || null
            });

            res.status(201).json({
                success: true,
                message: 'Tạo danh mục thành công',
                data: category
            });

        } catch (error) {
            console.error('❌ [Admin] Create category error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    };

    // Admin - Xóa danh mục
    async adminDeleteCategory(req, res) {
        try {
            const { id } = req.params;

            const category = await ArticleCategory.findByPk(id);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy danh mục'
                });
            }

            // Check if there are articles using this category
            const articleCount = await Article.count({ where: { category_id: id } });
            if (articleCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Không thể xóa danh mục đang có ${articleCount} bài viết`
                });
            }

            await category.destroy();

            res.json({
                success: true,
                message: 'Xóa danh mục thành công'
            });

        } catch (error) {
            console.error('❌ [Admin] Delete category error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    };

}

module.exports = new ArticleController();



