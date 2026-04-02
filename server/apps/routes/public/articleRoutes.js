const express = require('express');
const router = express.Router();
const articleController = require('../../controllers/articleController');
const { verifyToken, isAdmin } = require('../../middlewares/auth');

// ========== ADMIN routes - Cần đăng nhập Admin ==========
// (Phải đặt trước các routes có :slug để tránh conflict)
router.get('/admin/list', verifyToken, isAdmin, articleController.adminGetArticles);  // GET /api/articles/admin/list
router.get('/admin/article/:id', verifyToken, isAdmin, articleController.adminGetArticleById);  // GET /api/articles/admin/article/:id
router.post('/admin/article', verifyToken, isAdmin, articleController.adminCreateArticle);  // POST /api/articles/admin/article
router.put('/admin/article/:id', verifyToken, isAdmin, articleController.adminUpdateArticle);  // PUT /api/articles/admin/article/:id
router.delete('/admin/article/:id', verifyToken, isAdmin, articleController.adminDeleteArticle);  // DELETE /api/articles/admin/article/:id

// Admin category management
router.get('/admin/categories', verifyToken, isAdmin, articleController.adminGetCategories);  // GET /api/articles/admin/categories
router.post('/admin/category', verifyToken, isAdmin, articleController.adminCreateCategory);  // POST /api/articles/admin/category
router.delete('/admin/category/:id', verifyToken, isAdmin, articleController.adminDeleteCategory);  // DELETE /api/articles/admin/category/:id

// ========== Public routes - Không cần đăng nhập ==========
router.get('/', articleController.getArticles);  // GET /api/articles
router.get('/featured', articleController.getFeaturedArticles);  // GET /api/articles/featured
router.get('/popular', articleController.getPopularArticles);  // GET /api/articles/popular
router.get('/categories', articleController.getCategories);  // GET /api/articles/categories
router.get('/:slug', articleController.getArticleDetail);  // GET /api/articles/:slug (đặt cuối cùng)

module.exports = router;



