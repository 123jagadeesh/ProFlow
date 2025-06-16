const User = require('../models/User');
const Company = require('../models/Company');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Configure Nodemailer transporter (replace with your actual email service)
const transporter = nodemailer.createTransport({
  service: 'gmail', // e.g., 'gmail', 'outlook', etc.
  auth: {
    user: process.env.EMAIL_USER, // Your email address from .env
    pass: process.env.EMAIL_PASS, // Your email password or app-specific password from .env
  },
});

// @desc    Register a new company and admin user
// @route   POST /api/auth/admin-signup
// @access  Public
exports.adminSignUp = async (req, res) => {
  try {
    const { companyName, email, password } = req.body;

    // Check if company already exists (optional, based on your business logic)
    let company = await Company.findOne({ name: companyName });
    if (company) {
      return res.status(400).json({ message: "Company with this name already exists." });
    }

    company = new Company({ name: companyName });
    await company.save();

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new User({
      email,
      password: hashedPassword,
      role: 'admin',
      company: company._id,
    });

    await admin.save();

    // Generate token for immediate login
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: "Company and admin registered successfully", token, user: { id: admin._id, email: admin.email, role: admin.role, company: company.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/signin
// @access  Public
exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('company');
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { _id: user._id, email: user.email, role: user.role, company: user.company ? user.company.name : null } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Request password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create a reset token (simple for now, in production use a more robust method)
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '10m' });

    // In a real application, you would save this token to the user document in the database
    // For now, we'll just send it directly in the email (for testing purposes)

    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'ProFlow Password Reset Request',
      html: `<p>You requested a password reset. Please click this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset email sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
