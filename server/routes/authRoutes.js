const express = require('express');
const router = express.Router();
const { adminSignUp, signIn, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/admin-signup', adminSignUp);
router.post('/signin', signIn);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
