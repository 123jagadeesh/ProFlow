const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // <-- Load env variables
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB using env variable
mongoose.connect(`${process.env.MONGO_URI}`
, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected successfully"))
.catch(err => console.error("❌ MongoDB connection error:", err));

mongoose.connection.once('open', () => {
  console.log(`✅ Connected to DB: ${mongoose.connection.name}`);
});

// Serve uploads directory for attachments
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Dummy route
app.get("/", (req, res) => {
  res.send("API Running");
});

// TEMPORARY TEST ROUTE FOR DEBUGGING
app.get("/test-route", (req, res) => {
  console.log("Test route hit!");
  res.send("Test route is working!");
});

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const employeeRoutes = require('./routes/employeeRoutes');
app.use('/api/employees', employeeRoutes);

const projectRoutes = require('./routes/projectRoutes');
app.use('/api/projects', projectRoutes);

const sprintRoutes = require('./routes/sprintRoutes');
app.use('/api/sprints', sprintRoutes);

const taskRoutes = require('./routes/taskRoutes');
app.use('/api/tasks', taskRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
