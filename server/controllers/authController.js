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
    const { companyName, companyLocation, adminName, email, password } = req.body;

    // Input validation
    if (!companyName || !companyLocation || !adminName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if company already exists
    let company = await Company.findOne({ name: companyName });
    if (company) {
      return res.status(400).json({ message: "Company with this name already exists." });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Create new company
    company = new Company({
      name: companyName,
      location: companyLocation,
      adminName,
      adminEmail: email
    });
    await company.save();

    // Create admin user
    const admin = new User({
      name: adminName,
      email,
      password,
      role: 'admin',
      company: company._id,
    });

    await admin.save();

    // Generate token for immediate login
    const token = jwt.sign(
      { 
        id: admin._id, 
        role: admin.role,
        company: company._id 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      message: "Company and admin registered successfully", 
      token, 
      user: { 
        id: admin._id, 
        name: admin.name,
        email: admin.email, 
        role: admin.role, 
        company: {
          id: company._id,
          name: company.name
        }
      } 
    });
  } catch (err) {
    console.error('Admin signup error:', err);
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: "Email is already registered." 
      });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ 
        message: 'Validation error',
        errors: messages 
      });
    }
    
    res.status(500).json({ 
      message: "Server error during registration" 
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/signin
// @access  Public
exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Sign-in attempt for email:', email);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).populate('company');
    if (!user) {
      console.log(`User not found with email: ${email}`);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }
    
    console.log('User found:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      company: user.company ? user.company._id : 'No company'
    });

    // Check if password matches using the model's comparePassword method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Invalid password for user: ${email}`);
      console.log('Provided password length:', password ? password.length : 0);
      console.log('Stored password hash:', user.password ? 'exists' : 'missing');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check if user is active
    if (user.isActive === false) {
      console.log(`Login attempt for deactivated user: ${email}`);
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }
    
    console.log('User is active and credentials are valid');

    // Update last login timestamp
    user.lastLogin = Date.now();
    await user.save();

    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role, 
        company: user.company?._id 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // Prepare user response object
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company ? {
        id: user.company._id,
        name: user.company.name
      } : null
    };

    res.json({ 
      token, 
      user: userResponse 
    });
  } catch (err) {
    console.error('Sign in error:', err);
    res.status(500).json({ 
      message: err.message || 'Server error during authentication' 
    });
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
