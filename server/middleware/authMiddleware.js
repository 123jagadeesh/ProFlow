// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer token

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).populate("company");
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Admin access required" });
  next();
};

exports.isAdminOrEmployee = (req, res, next) => {
  console.log('isAdminOrEmployee middleware: req.user:', req.user);
  console.log('isAdminOrEmployee middleware: req.user.role:', req.user?.role);
  if (req.user?.role !== 'admin' && req.user?.role !== 'employee') {
    return res.status(403).json({ error: "Access denied. Admin or Employee access required" });
  }
  next();
};
