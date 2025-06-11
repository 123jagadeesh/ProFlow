const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // <-- Load env variables

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

// Dummy route
app.get("/", (req, res) => {
  res.send("API Running");
});

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const employeeRoutes = require('./routes/employeeRoutes');
app.use('/api/employees', employeeRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
