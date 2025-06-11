const User = require('../models/User');
const Company = require('../models/Company');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerCompany = async (req, res) => {
  try {
    const { companyName, industry, adminName, email, password } = req.body;

    const company = new Company({ name: companyName, industry });
    await company.save();

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new User({
      name: adminName,
      email,
      password: hashedPassword,
      role: 'admin',
      company: company._id,
    });

    await admin.save();

    res.status(201).json({ message: "Company & admin registered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('company');
    if (!user) return res.status(400).json({ error: "Invalid email" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user: { name: user.name, role: user.role, company: user.company.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
