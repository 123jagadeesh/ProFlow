// routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const { getEmployees,createEmployee } = require('../controllers/employeeController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.post('/', protect, isAdmin, createEmployee);
router.get('/', protect, isAdmin, getEmployees);

module.exports = router;
