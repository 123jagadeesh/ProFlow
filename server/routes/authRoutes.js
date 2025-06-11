const express = require('express');
const router = express.Router();
const { registerCompany, login } = require('../controllers/authController');

router.post('/register', registerCompany);
router.post('/login', login);

module.exports = router;
