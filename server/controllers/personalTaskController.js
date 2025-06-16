const PersonalTask = require('../models/PersonalTask');

// @desc    Create a new personal task
// @route   POST /api/personal-tasks
// @access  Private
exports.createPersonalTask = async (req, res) => {
  try {
    const { title, description, priority, status } = req.body;

    const personalTask = new PersonalTask({
      title,
      description,
      priority,
      status,
      user: req.user.id,
      company: req.user.company._id, // Ensure to use _id for company
    });

    const createdTask = await personalTask.save();
    res.status(201).json(createdTask);
  } catch (error) {
    console.error('Server Error during personal task creation:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all personal tasks for the authenticated user
// @route   GET /api/personal-tasks
// @access  Private
exports.getPersonalTasks = async (req, res) => {
  try {
    const personalTasks = await PersonalTask.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json(personalTasks);
  } catch (error) {
    console.error('Server Error during fetching personal tasks:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get a single personal task by ID
// @route   GET /api/personal-tasks/:id
// @access  Private
exports.getPersonalTaskById = async (req, res) => {
  try {
    const personalTask = await PersonalTask.findById(req.params.id);

    if (!personalTask || personalTask.user.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Personal task not found or unauthorized' });
    }

    res.status(200).json(personalTask);
  } catch (error) {
    console.error('Server Error during fetching single personal task:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a personal task
// @route   PUT /api/personal-tasks/:id
// @access  Private
exports.updatePersonalTask = async (req, res) => {
  try {
    const { title, description, priority, status } = req.body;

    let personalTask = await PersonalTask.findById(req.params.id);

    if (!personalTask || personalTask.user.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Personal task not found or unauthorized' });
    }

    // Update fields only if provided
    personalTask.title = title || personalTask.title;
    personalTask.description = description || personalTask.description;
    personalTask.priority = priority || personalTask.priority;
    personalTask.status = status || personalTask.status;

    const updatedTask = await personalTask.save();
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Server Error during personal task update:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a personal task
// @route   DELETE /api/personal-tasks/:id
// @access  Private
exports.deletePersonalTask = async (req, res) => {
  try {
    const personalTask = await PersonalTask.findById(req.params.id);

    if (!personalTask || personalTask.user.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Personal task not found or unauthorized' });
    }

    await personalTask.deleteOne();
    res.status(200).json({ message: 'Personal task removed' });
  } catch (error) {
    console.error('Server Error during personal task deletion:', error);
    res.status(500).json({ message: 'Server Error' });
  }
}; 