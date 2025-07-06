const express = require('express');
const router = express.Router();

console.log("taskRoutes.js is being loaded!"); // Debug log

const { createTask, getTasks, getTaskById, updateTask, deleteTask, addComment, uploadMiddleware, uploadAttachment } = require('../controllers/taskController');
const { protect, isAdminOrEmployee } = require('../middleware/authMiddleware');

// Middleware to protect routes and ensure user belongs to the company
// For tasks, both admins and employees might interact, but permissions will be handled in controllers

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
router.post('/', protect, isAdminOrEmployee, createTask);

// @desc    Get all tasks for a specific project or user
// @route   GET /api/tasks?projectId=XYZ
// @access  Private
router.get('/', protect, isAdminOrEmployee, getTasks);

// @desc    Get a single task by ID
// @route   GET /api/tasks/:id
// @access  Private
router.get('/:id', protect, isAdminOrEmployee, getTaskById);

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
router.put('/:id', protect, isAdminOrEmployee, updateTask);

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete('/:id', protect, isAdminOrEmployee, deleteTask);

// Add a comment to a task
router.post('/:id/comments', protect, addComment);

// Upload an attachment to a task
router.post('/:id/attachments', protect, uploadMiddleware, uploadAttachment);

module.exports = router; 