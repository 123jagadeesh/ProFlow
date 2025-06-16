const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createPersonalTask, getPersonalTasks, getPersonalTaskById, updatePersonalTask, deletePersonalTask } = require('../controllers/personalTaskController');

// All personal task routes are private and require user authentication
router.post('/', protect, createPersonalTask);
router.get('/', protect, getPersonalTasks);
router.get('/:id', protect, getPersonalTaskById);
router.put('/:id', protect, updatePersonalTask);
router.delete('/:id', protect, deletePersonalTask);

module.exports = router; 