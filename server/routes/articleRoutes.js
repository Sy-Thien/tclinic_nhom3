const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

// Public routes - Không cần đăng nhập
router.get('/', articleController.getArticles);  // GET /api/articles
router.get('/featured', articleController.getFeaturedArticles);  // GET /api/articles/featured
router.get('/popular', articleController.getPopularArticles);  // GET /api/articles/popular
router.get('/categories', articleController.getCategories);  // GET /api/articles/categories
router.get('/:slug', articleController.getArticleDetail);  // GET /api/articles/:slug

module.exports = router;
