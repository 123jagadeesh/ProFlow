// controllers/employeeController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already exists' 
      });
    }

    // Ensure company ID is available
    const companyId = req.user.company?._id || req.user.company;
    if (!companyId) {
      return res.status(400).json({ 
        success: false,
        message: 'Company ID is missing' 
      });
    }

    // Create new employee - let the User model handle password hashing
    const employee = new User({
      name,
      email,
      password, // Let the pre-save hook hash this
      role: 'employee',
      company: companyId,
      isActive: true // Ensure new employees are active by default
    });

    await employee.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Employee created successfully',
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        company: employee.company
      }
    });
  } catch (err) {
    console.error('Error creating employee:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error while creating employee',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};



exports.getEmployees = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const employees = await User.find({
      company: req.user.company,
      role: 'employee',
    }).select('-password'); // hide password in response

    res.json({ employees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
