const Project = require('../models/Project');
const Task = require('../models/Task');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup for attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Accept documents, images, and PDFs
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only documents, images, and PDFs are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

exports.uploadMiddleware = upload.single('attachment');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Admin
exports.createProject = async (req, res) => {
  try {
    const { name, description, customer, statuses, startDate, endDate } = req.body;

    // Ensure only admins can create projects and associate with their company
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Only administrators can create projects.' 
      });
    }

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }

    // Validate dates if provided
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const projectData = {
      name,
      description,
      customer,
      company: req.user.company,
      statuses: statuses || undefined,
      createdBy: req.user._id,
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) })
    };

    const project = new Project(projectData);
    const createdProject = await project.save();
    
    // Populate the createdBy field with user details
    await createdProject.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: createdProject,
      message: 'Project created successfully'
    });
  } catch (error) {
    console.error('Create project error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A project with this name already exists'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while creating project' 
    });
  }
};

// @desc    Get all projects for the admin's company or projects where employee has tasks
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      // For admins, return all projects in their company
      const projects = await Project.find({ company: req.user.company })
        .populate('customer', 'name email')
        .sort({ createdAt: -1 });
      return res.status(200).json(projects);
    } else {
      // For employees, only return projects where they have assigned tasks
      const tasks = await Task.find({
        'assignee': req.user._id,
        'company': req.user.company._id
      }).distinct('project');
      
      if (tasks.length === 0) {
        return res.status(200).json([]);
      }
      
      const projects = await Project.find({
        _id: { $in: tasks },
        company: req.user.company._id
      })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });
      
      return res.status(200).json(projects);
    }
  } catch (error) {
    console.error('Error in getProjects:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('company');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Ensure the project belongs to the user's company
    if (project.company._id.toString() !== req.user.company._id.toString()) {
      return res.status(403).json({ message: 'Access denied. This project does not belong to your company.' });
    }

    // If user is an employee, check if they have any tasks in this project
    if (req.user.role !== 'admin') {
      const hasTasks = await Task.exists({
        project: project._id,
        assignee: req.user._id,
        company: req.user.company._id
      });

      if (!hasTasks) {
        return res.status(403).json({ 
          message: 'Access denied. You do not have any tasks in this project.' 
        });
      }
    }

    res.status(200).json(project);
  } catch (error) {
    console.error('Error in getProjectById:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update project statuses
// @route   PUT /api/projects/:id/statuses
// @access  Private/Admin
exports.updateProjectStatuses = async (req, res) => {
  try {
    const { id } = req.params;
    const { statuses } = req.body;

    if (!Array.isArray(statuses) || statuses.some(s => typeof s !== 'string' || s.trim() === '')) {
      return res.status(400).json({ message: 'Statuses must be a non-empty array of strings.' });
    }

    const project = await Project.findById(id);

    if (!project || project.company.toString() !== req.user.company.toString()) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }

    project.statuses = statuses;
    await project.save();

    // Update all tasks in this project to ensure their status is valid
    const tasks = await Task.find({ project: id });
    for (const task of tasks) {
      if (!statuses.includes(task.status)) {
        task.status = statuses[0]; // Set to first status if invalid
        await task.save();
      }
    }

    res.status(200).json({ message: 'Project statuses updated successfully', project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Upload an attachment to a project
// @route   POST /api/projects/:id/attachments
// @access  Private (admin only)
exports.uploadAttachment = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      // Clean up the uploaded file if project not found
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error cleaning up file:', err);
        });
      }
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only admin can upload
    if (req.user.role !== 'admin') {
      // Clean up the uploaded file if not authorized
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error cleaning up file:', err);
        });
      }
      return res.status(403).json({ message: 'Not authorized to upload attachment' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or file type not supported' });
    }

    const fileInfo = {
      filename: req.file.originalname,
      storedFilename: req.file.filename,
      url: `/api/projects/${project._id}/attachments/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    };

    project.attachments.push(fileInfo);
    await project.save();

    res.status(201).json({
      message: 'File uploaded successfully',
      attachment: fileInfo
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Clean up the uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error cleaning up file after error:', err);
      });
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds the 10MB limit' });
    }
    
    res.status(500).json({ 
      message: error.message || 'Server error during file upload' 
    });
  }
};

// @desc    Get all attachments for a project
// @route   GET /api/projects/:id/attachments
// @access  Private
exports.getProjectAttachments = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).select('attachments');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user has access to this project
    if (req.user.role !== 'admin' && project.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these attachments' });
    }
    
    res.json(project.attachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Download a project attachment
// @route   GET /api/projects/:projectId/attachments/:filename
// @access  Private
exports.downloadAttachment = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user has access to this project
    if (req.user.role !== 'admin' && project.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this file' });
    }
    
    const attachment = project.attachments.find(
      att => att.storedFilename === req.params.filename
    );
    
    if (!attachment) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const filePath = path.join(__dirname, '..', 'uploads', req.params.filename);
    
    // Set appropriate headers for file download
    res.download(filePath, attachment.filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error downloading file' });
        }
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a project attachment
// @route   DELETE /api/projects/:projectId/attachments/:filename
// @access  Private/Admin
exports.deleteAttachment = async (req, res) => {
  try {
    // Only admin can delete attachments
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete attachments' });
    }
    
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const attachmentIndex = project.attachments.findIndex(
      att => att.storedFilename === req.params.filename
    );
    
    if (attachmentIndex === -1) {
      return res.status(404).json({ message: 'Attachment not found' });
    }
    
    const filePath = path.join(__dirname, '..', 'uploads', req.params.filename);
    
    // Remove file from filesystem
    fs.unlink(filePath, async (err) => {
      if (err && err.code !== 'ENOENT') { // Ignore file not found error
        console.error('Error deleting file:', err);
        return res.status(500).json({ message: 'Error deleting file' });
      }
      
      // Remove from project's attachments array
      project.attachments.splice(attachmentIndex, 1);
      await project.save();
      
      res.json({ message: 'Attachment deleted successfully' });
    });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 