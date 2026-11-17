const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

router.get('/login', AuthController.showTenantLogin);
router.post('/login', AuthController.handleTenantLogin);

router.get('/admin/login', AuthController.showAdminLogin);
router.post('/admin/login', AuthController.handleAdminLogin);

router.get('/logout', AuthController.logout);

module.exports = router;
