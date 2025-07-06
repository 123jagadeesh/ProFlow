const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  // Original filename
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  // Stored filename (with unique ID)
  storedFilename: {
    type: String,
    required: [true, 'Stored filename is required'],
    trim: true
  },
  // Public URL to access the file
  url: {
    type: String,
    required: [true, 'File URL is required'],
    trim: true
  },
  // MIME type of the file
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    trim: true
  },
  // File size in bytes
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [1, 'File size must be greater than 0']
  },
  // Reference to the user who uploaded the file
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader user ID is required']
  },
  // Timestamp of when the file was uploaded
  uploadedAt: { 
    type: Date, 
    default: Date.now,
    required: true
  },
  // Optional description for the attachment
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be longer than 500 characters']
  }
}, {
  // Add createdAt and updatedAt timestamps
  timestamps: true,
  // Enable virtuals for JSON output
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add a virtual for formatted file size
AttachmentSchema.virtual('formattedSize').get(function() {
  if (this.size < 1024) return `${this.size} B`;
  if (this.size < 1024 * 1024) return `${(this.size / 1024).toFixed(1)} KB`;
  return `${(this.size / (1024 * 1024)).toFixed(1)} MB`;
});

// Add a virtual for file icon based on MIME type
AttachmentSchema.virtual('icon').get(function() {
  const type = this.mimeType.split('/')[0];
  const icons = {
    'image': 'image',
    'application/pdf': 'picture_as_pdf',
    'application/msword': 'description',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'description',
    'application/vnd.ms-excel': 'table_chart',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'table_chart',
    'application/vnd.ms-powerpoint': 'slideshow',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'slideshow',
    'text/': 'description',
    'default': 'insert_drive_file'
  };
  
  return icons[this.mimeType] || icons[type] || icons['default'];
});

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot be longer than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot be longer than 2000 characters']
  },
  customer: {
    type: String,
    trim: true,
    maxlength: [100, 'Customer name cannot be longer than 100 characters']
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required'],
    index: true
  },
  statuses: {
    type: [String],
    default: ['Todo', 'In Progress', 'Done'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one status is required'
    }
  },
  attachments: [AttachmentSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  // Add createdAt and updatedAt timestamps
  timestamps: true,
  // Enable virtuals for JSON output
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
ProjectSchema.index({ name: 'text', description: 'text', customer: 'text' });
ProjectSchema.index({ company: 1, isActive: 1 });

// Virtual for project duration in days
ProjectSchema.virtual('durationDays').get(function() {
  if (!this.endDate) return null;
  const diffTime = Math.abs(this.endDate - this.startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Add a pre-save hook to validate end date
ProjectSchema.pre('save', function(next) {
  if (this.endDate && this.endDate < this.startDate) {
    next(new Error('End date must be after start date'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Project', ProjectSchema);