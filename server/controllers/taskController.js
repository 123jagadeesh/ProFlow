const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Sprint= require('../models/Sprint')
const multer = require('multer');
const path = require('path');

// Helper: check if user is admin or reporter
function isAdminOrReporter(user) {
  return user.role === 'admin' || user.role === 'reporter';
}

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup for attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types
    cb(null, true);
  }
});

exports.uploadMiddleware = upload.single('file');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (admin/reporter only)
exports.createTask = async (req, res) => {
  try {
    const { title, description, project: projectId, parentTask, assignee, priority, status, plannedDateStart, plannedDateEnd, sprint } = req.body;
    if (!title || !projectId) {
      return res.status(400).json({ message: 'Title and project are required' });
    }
    // Only admin or reporter can create tasks
    if (!isAdminOrReporter(req.user)) {
      return res.status(403).json({ message: 'Only admin or reporter can create tasks' });
    }
    // Ensure project exists and belongs to the user's company
    const project = await Project.findById(projectId);
    if (!project || project.company.toString() !== req.user.company._id.toString()) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }
    // Validate status against project's defined statuses
    const taskStatus = status || 'Todo';
    if (!project.statuses.includes(taskStatus)) {
      return res.status(400).json({ message: `Invalid status: ${taskStatus}. Must be one of ${project.statuses.join(', ')}` });
    }
    // Validate assignees (can be empty)
    let assignees = [];
    if (assignee && assignee.length > 0) {
      for (const id of assignee) {
        const user = await User.findById(id);
        if (!user || user.company.toString() !== req.user.company._id.toString()) {
          return res.status(404).json({ message: `Assignee with ID ${id} not found or unauthorized` });
        }
        assignees.push(user._id);
      }
    }
    // Validate parentTask (if provided)
    let parent = null;
    if (parentTask) {
      parent = await Task.findById(parentTask);
      if (!parent || parent.project.toString() !== projectId || parent.company.toString() !== req.user.company._id.toString()) {
        return res.status(404).json({ message: 'Parent task not found or unauthorized' });
      }
    }
    // reporter is always the logged-in user
    const reporter = req.user._id;
    const task = new Task({
      title,
      description,
      project: projectId,
      parentTask: parentTask || null,
      assignee: assignees,
      reporter,
      priority,
      status: taskStatus,
      plannedDateStart,
      plannedDateEnd,
      sprint: sprint || null,
      company: req.user.company,
    });
    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all tasks for a specific project or user
// @route   GET /api/tasks?projectId=XYZ&assigneeId=ABC
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = { company: req.user.company._id }; // Ensure company is always filtered by ID

    console.log('Received getTasks request. Query Params:', { projectId, userRole: req.user.role });
    console.log('Authenticated user company ID:', req.user.company._id);

    // Add project filter if provided
    if (projectId) {
      filter.project = projectId;
    }

    // For employees, only show their assigned tasks
    if (req.user.role !== 'admin') {
      filter.assignee = req.user._id;
    } else if (req.query.assigneeId) {
      // Only allow admins to filter by assigneeId
      filter.assignee = { $in: [req.query.assigneeId] };
    }

    console.log('MongoDB Filter object:', filter);

    const tasks = await Task.find(filter)
      .populate('project', 'name')
      .populate('assignee', 'name email')
      .populate('parentTask', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error in getTasks:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get a single task by ID
// @route   GET /api/tasks/:id
// @access  Private
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name')
      .populate('assignee', 'name email')
      .populate('parentTask', 'title')
      .populate('reporter', 'name email')
      .populate('sprint', 'title')
      .populate({
        path: 'comments.user',
        select: 'name email',
        // Remove the nested avatar population for now
      })
      .sort({ createdAt: -1 });

    if (!task || task.company.toString() !== req.user.company._id.toString()) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private (admin/reporter only)
exports.updateTask = async (req, res) => {
  try {
    const { title, description, assignee, priority, status, plannedDateStart, plannedDateEnd, sprint } = req.body;
    let task = await Task.findById(req.params.id);
    if (!task || task.company.toString() !== req.user.company._id.toString()) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }
    // Only admin or reporter can update tasks
    if (!isAdminOrReporter(req.user)) {
      return res.status(403).json({ message: 'Only admin or reporter can update tasks' });
    }
    // Validate status against project's defined statuses
    const project = await Project.findById(task.project);
    if (!project || !project.statuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status: ${status}. Must be one of ${project.statuses.join(', ')}` });
    }
    // Update fields only if provided
    task.title = title || task.title;
    task.description = description || task.description;
    task.priority = priority || task.priority;
    task.status = status || task.status;
    task.plannedDateStart = plannedDateStart || task.plannedDateStart;
    task.plannedDateEnd = plannedDateEnd || task.plannedDateEnd;
    task.sprint = sprint || task.sprint;
    // Validate assignees (can be empty)
    let assignees = [];
    if (assignee && assignee.length > 0) {
      for (const id of assignee) {
        const user = await User.findById(id);
        if (!user || user.company.toString() !== req.user.company._id.toString()) {
          return res.status(404).json({ message: `Assignee with ID ${id} not found or unauthorized` });
        }
        assignees.push(id);
      }
    }
    console.log(req.body.assignee);
    task.assignee = assignees;
    const updatedTask = await task.save();
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (admin/reporter only)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.company.toString() !== req.user.company._id.toString()) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }
    // Only admin or reporter can delete tasks
    if (!isAdminOrReporter(req.user)) {
      return res.status(403).json({ message: 'Only admin or reporter can delete tasks' });
    }
    await task.deleteOne();
    res.status(200).json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add a comment to a task
// @route   POST /api/tasks/:id/comments
// @access  Private (assignee, reporter, or admin)
exports.addComment = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const task = await Task.findById(req.params.id)
      .populate('comments.user', 'name email')
      .populate('assignee', 'name email')
      .populate('reporter', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check if user is authorized (assignee, reporter, or admin)
    const isAssignee = task.assignee.some(assignee => 
      assignee._id.toString() === req.user._id.toString()
    );
    const isReporter = task.reporter._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isAssignee && !isReporter && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to comment on this task' 
      });
    }

    const newComment = {
      user: req.user._id,
      message: message.trim(),
      createdAt: new Date()
    };

    console.log('New comment data before save:', newComment);
    task.comments.push(newComment);
    const savedTask = await task.save();
    console.log('Task after saving comment:', JSON.stringify(savedTask.comments, null, 2));

    // Populate the user details in the response
    const populatedComment = {
      ...newComment,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    };

    res.status(201).json({ 
      success: true, 
      comment: populatedComment,
      message: 'Comment added successfully' 
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Upload an attachment to a task
// @route   POST /api/tasks/:id/attachments
// @access  Private (admin, reporter, or assignee)
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded or file upload failed' 
      });
    }

    const task = await Task.findById(req.params.id)
      .populate('attachments.uploadedBy', 'name email')
      .populate('assignee', 'name email')
      .populate('reporter', 'name email');

    if (!task) {
      // Clean up the uploaded file if task not found
      const fs = require('fs');
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check if user is authorized (admin, reporter, or assignee)
    const isAssignee = task.assignee.some(assignee => 
      assignee._id.toString() === req.user._id.toString()
    );
    const isReporter = task.reporter._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isAssignee && !isReporter && !isAdmin) {
      // Clean up the uploaded file if not authorized
      const fs = require('fs');
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to upload attachments to this task' 
      });
    }

    const fileSizeInMB = (req.file.size / (1024 * 1024)).toFixed(2);
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

    const newAttachment = {
      filename: req.file.originalname,
      path: req.file.path.replace(/\\/g, '/'), // Convert Windows paths to forward slashes
      fileType: fileExtension,
      fileSize: fileSizeInMB,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    task.attachments.push(newAttachment);
    await task.save();

    // Populate the uploadedBy field in the response
    const populatedAttachment = {
      ...newAttachment.toObject ? newAttachment.toObject() : newAttachment,
      uploadedBy: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    };

    res.status(201).json({ 
      success: true, 
      attachment: populatedAttachment,
      message: 'File uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    
    // Clean up the uploaded file if an error occurred
    if (req.file) {
      const fs = require('fs');
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};