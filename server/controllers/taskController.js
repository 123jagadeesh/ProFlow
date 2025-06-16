const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId, parentTaskId, assigneeIds, priority, status, plannedDateStart, plannedDateEnd } = req.body;

    console.log('Received task creation request for projectId:', projectId);
    console.log('Authenticated user company ID:', req.user.company);

    // Ensure project exists and belongs to the user's company
    const project = await Project.findById(projectId);
    
    if (!project) {
      console.error('Project not found in DB for ID:', projectId);
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }

    console.log('Found project company ID:', project.company);
    
    if (project.company.toString() !== req.user.company._id.toString()) {
      console.error('Authorization failed: Project company ID does not match user company ID.', {
        projectCompany: project.company.toString(),
        userCompany: req.user.company._id.toString()
      });
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }

    // Validate status against project's defined statuses
    if (!project.statuses.includes(status)) {
      console.error('Invalid task status provided:', status, 'Allowed statuses:', project.statuses);
      return res.status(400).json({ message: `Invalid status: ${status}. Must be one of ${project.statuses.join(', ')}` });
    }

    // Ensure assignee exists and belongs to the same company
    let assignees = [];
    if (assigneeIds && assigneeIds.length > 0) {
      for (const id of assigneeIds) {
        const assignee = await User.findById(id);
        if (!assignee || assignee.company.toString() !== req.user.company._id.toString()) {
          console.error('Assignee not found or unauthorized:', id);
          return res.status(404).json({ message: `Assignee with ID ${id} not found or unauthorized` });
        }
        assignees.push(assignee._id);
      }
    }

    // Ensure parent task exists and belongs to the same project and company (for sub-tasks)
    let parentTask = null;
    if (parentTaskId) {
      parentTask = await Task.findById(parentTaskId);
      if (!parentTask || parentTask.project.toString() !== projectId || parentTask.company.toString() !== req.user.company._id.toString()) {
        console.error('Parent task not found or unauthorized:', parentTaskId);
        return res.status(404).json({ message: 'Parent task not found or unauthorized' });
      }
    }

    const task = new Task({
      title,
      description,
      project: projectId,
      parentTask: parentTaskId || null,
      assignee: assignees,
      priority,
      status,
      plannedDateStart,
      plannedDateEnd,
      company: req.user.company,
    });

    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    console.error('Server Error during task creation:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all tasks for a specific project or user
// @route   GET /api/tasks?projectId=XYZ&assigneeId=ABC
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { projectId, assigneeId } = req.query;
    const filter = { company: req.user.company._id }; // Ensure company is always filtered by ID

    console.log('Received getTasks request. Query Params:', { projectId, assigneeId });
    console.log('Authenticated user company ID:', req.user.company._id);

    if (projectId) {
      filter.project = projectId;
    }
    if (assigneeId) {
      filter.assignee = { $in: [assigneeId] };
    }

    console.log('MongoDB Filter object:', filter);

    const tasks = await Task.find(filter)
      .populate('project', 'name')
      .populate('assignee', 'name email')
      .populate('parentTask', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
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
      .populate('parentTask', 'title');

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
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const { title, description, assigneeIds, priority, status, plannedDateStart, plannedDateEnd } = req.body;

    let task = await Task.findById(req.params.id);

    if (!task || task.company.toString() !== req.user.company._id.toString()) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    // Validate status against project's defined statuses
    const project = await Project.findById(task.project);
    if (!project || !project.statuses.includes(status)) {
      console.error('Invalid status for update:', status, 'Allowed statuses:', project.statuses);
      return res.status(400).json({ message: `Invalid status: ${status}. Must be one of ${project.statuses.join(', ')}` });
    }

    // Update fields only if provided
    task.title = title || task.title;
    task.description = description || task.description;
    task.priority = priority || task.priority;
    task.status = status || task.status;
    task.plannedDateStart = plannedDateStart || task.plannedDateStart;
    task.plannedDateEnd = plannedDateEnd || task.plannedDateEnd;

    // Ensure assignee exists and belongs to the same company
    let assignees = [];
    if (assigneeIds && assigneeIds.length > 0) {
      for (const id of assigneeIds) {
        const assignee = await User.findById(id);
        if (!assignee || assignee.company.toString() !== req.user.company._id.toString()) {
          console.error('Assignee not found or unauthorized during update:', id);
          return res.status(404).json({ message: `Assignee with ID ${id} not found or unauthorized` });
        }
        assignees.push(id);
      }
    }
    task.assignee = assignees;

    const updatedTask = await task.save();
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Server Error during task update:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task || task.company.toString() !== req.user.company._id.toString()) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    await task.deleteOne();
    res.status(200).json({ message: 'Task removed' });
  } catch (error) {
    console.error('Server Error during task deletion:', error);
    res.status(500).json({ message: 'Server Error' });
  }
}; 