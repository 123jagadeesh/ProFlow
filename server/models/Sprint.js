const mongoose = require('mongoose');

const SprintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  // Alias for backward compatibility
  name: {
    type: String,
    trim: true,
  },
  goal: {
    type: String,
    trim: true,
  },
  duration: {
    type: Number, // in weeks
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  issues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  }],
  status: {
    type: String,
    enum: ['Created', 'Started', 'Completed'],
    default: 'Created',
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Sprint', SprintSchema); 