const Project = require('../models/Project');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Admin
exports.createProject = async (req, res) => {
  try {
    const { name, customer, statuses } = req.body;

    // Ensure only admins can create projects and associate with their company
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only administrators can create projects.' });
    }

    const project = new Project({
      name,
      customer,
      company: req.user.company,
      statuses: statuses || undefined,
    });

    const createdProject = await project.save();
    res.status(201).json(createdProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all projects for the admin's company
// @route   GET /api/projects
// @access  Private/Admin
exports.getProjects = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only administrators can view projects.' });
    }

    const projects = await Project.find({ company: req.user.company }).sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private/Admin
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('company');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Ensure the project belongs to the admin's company
    if (project.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Access denied. This project does not belong to your company.' });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error(error);
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

    res.status(200).json({ message: 'Project statuses updated successfully', project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
}; 