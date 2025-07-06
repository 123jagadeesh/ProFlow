const express = require('express');
const router = express.Router();
const { 
  createProject, 
  getProjects, 
  getProjectById, 
  updateProjectStatuses,
  uploadMiddleware,
  uploadAttachment,
  getProjectAttachments,
  downloadAttachment,
  deleteAttachment
} = require('../controllers/projectController');
const { protect, isAdmin, isAdminOrEmployee } = require('../middleware/authMiddleware');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Admin
router.post('/', protect, isAdmin, createProject);

// @desc    Get all projects (admin gets all, employees get only their assigned projects)
// @route   GET /api/projects
// @access  Private/Admin/Employee
router.get('/', protect, isAdminOrEmployee, getProjects);

// @desc    Get single project by ID (admin or assigned employee)
// @route   GET /api/projects/:id
// @access  Private/Admin/Employee
router.get('/:id', protect, isAdminOrEmployee, getProjectById);

// @desc    Update project statuses
// @route   PUT /api/projects/:id/statuses
// @access  Private/Admin
router.put('/:id/statuses', protect, isAdmin, updateProjectStatuses);

// @desc    Upload an attachment to a project
// @route   POST /api/projects/:id/attachments
// @access  Private/Admin
router.post(
  '/:id/attachments', 
  protect, 
  isAdmin, 
  uploadMiddleware, 
  uploadAttachment
);

// @desc    Get all attachments for a project
// @route   GET /api/projects/:id/attachments
// @access  Private/Admin/Employee (with project access)
router.get(
  '/:id/attachments', 
  protect, 
  isAdminOrEmployee, 
  getProjectAttachments
);

// @desc    Download a project attachment
// @route   GET /api/projects/:projectId/attachments/:filename
// @access  Private/Admin/Employee (with project access)
router.get(
  '/:projectId/attachments/:filename', 
  protect, 
  isAdminOrEmployee, 
  downloadAttachment
);

// @desc    Delete a project attachment
// @route   DELETE /api/projects/:projectId/attachments/:filename
// @access  Private/Admin
router.delete(
  '/:projectId/attachments/:filename', 
  protect, 
  isAdmin, 
  deleteAttachment
);

module.exports = router;