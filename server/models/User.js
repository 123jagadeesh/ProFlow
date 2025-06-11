const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
});
module.exports = mongoose.model('User', UserSchema);
