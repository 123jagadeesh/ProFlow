const mongoose = require('mongoose');
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');
const Project = require('../models/Project');

// Helper: check if user is admin or reporter
function isAdminOrReporter(user) {
  return user.role === 'admin' || user.role === 'reporter';
}

// Create a new sprint
exports.createSprint = async (req, res) => {
  try {
    const { title, goal, duration, project, startDate, endDate, company } = req.body;
    if (!title || !duration || !startDate || !endDate || !project || !company) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Only admin or reporter can create sprints
    if (!isAdminOrReporter(req.user)) {
      return res.status(403).json({ error: 'Only admin or reporter can create sprints' });
    }
    const sprint = new Sprint({
      title,
      goal,
      duration,
      project,
      startDate,
      endDate,
      company,
      status: 'Created',
    });
    await sprint.save();
    res.status(201).json(sprint);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all sprints for a project
// GET /api/projects/sprints?projectId=xxxx
exports.getSprints = async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ error: 'Invalid or missing projectId' });
    }
    // Optionally, check if the project belongs to the user's company
    const project = await Project.findOne({ _id: projectId, company: req.user.company });
    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }
    const sprints = await Sprint.find({ project: projectId });
    res.json(sprints);
  } catch (err) {
    console.error('Error in getSprints:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get a single sprint by ID
exports.getSprintById = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id).populate('issues');
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });
    res.json(sprint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a sprint (status transitions, goal, etc.)
exports.updateSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });
    // Only admin or reporter can update sprints
    if (!isAdminOrReporter(req.user)) {
      return res.status(403).json({ error: 'Only admin or reporter can update sprints' });
    }
    // Only allow status transitions in order
    if (req.body.status && req.body.status !== sprint.status) {
      const allowed =
        (sprint.status === 'Created' && req.body.status === 'Started') ||
        (sprint.status === 'Started' && req.body.status === 'Completed');
      if (!allowed) {
        return res.status(400).json({ error: 'Invalid status transition' });
      }
      sprint.status = req.body.status;
    }
    // Allow updating goal, duration, dates
    if (req.body.goal !== undefined) sprint.goal = req.body.goal;
    if (req.body.duration !== undefined) sprint.duration = req.body.duration;
    if (req.body.startDate !== undefined) sprint.startDate = req.body.startDate;
    if (req.body.endDate !== undefined) sprint.endDate = req.body.endDate;
    if (req.body.title !== undefined) sprint.title = req.body.title;
    await sprint.save();
    res.json(sprint);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a sprint
exports.deleteSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findByIdAndDelete(req.params.id);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });
    // Optionally, update tasks to remove sprint reference
    await Task.updateMany({ sprint: sprint._id }, { $set: { sprint: null } });
    res.json({ message: 'Sprint deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add an issue to a sprint
exports.addIssueToSprint = async (req, res) => {
  try {
    const { sprintId, taskId } = req.body;
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });
    if (!sprint.issues.includes(taskId)) {
      sprint.issues.push(taskId);
      await sprint.save();
      await Task.findByIdAndUpdate(taskId, { sprint: sprintId });
    }
    res.json(sprint);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Remove an issue from a sprint
exports.removeIssueFromSprint = async (req, res) => {
  try {
    const { sprintId, taskId } = req.body;
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });
    sprint.issues = sprint.issues.filter(id => id.toString() !== taskId);
    await sprint.save();
    await Task.findByIdAndUpdate(taskId, { sprint: null });
    res.json(sprint);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};