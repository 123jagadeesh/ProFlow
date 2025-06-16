const express = require('express');
const router = express.Router();
const { createProject, getProjects, getProjectById, updateProjectStatuses } = require('../controllers/projectController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Admin
router.post('/', protect, isAdmin, createProject);

// @desc    Get all projects for the admin's company
// @route   GET /api/projects
// @access  Private/Admin
router.get('/', protect, isAdmin, getProjects);

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private/Admin
router.get('/:id', protect, isAdmin, getProjectById);

// @desc    Update project statuses
// @route   PUT /api/projects/:id/statuses
// @access  Private/Admin
router.put('/:id/statuses', protect, isAdmin, updateProjectStatuses);

module.exports = router; 