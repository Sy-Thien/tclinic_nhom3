const express = require('express');
const router = express.Router();

// Auth routes
router.use('/', require('./authRoutes'));

module.exports = router;
