// controllers/employeeController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const employee = new User({
      name,
      email,
      password: hashedPassword,
      role: 'employee',
      company: req.user.company._id, // Get from logged-in admin
    });

    await employee.save();
    res.status(201).json({ message: "Employee created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
