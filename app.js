const express = require('express');
const cors = require("cors");
const connectDB = require('./app/config/db');
const authRoutes = require('./app/routes/authRoutes');
require('dotenv').config();

const app = express();

// Connect to the database
connectDB();

// Middleware
app.use(express.json()); // for parsing JSON bodies

app.use(cors({
    origin: ["http://localhost:5173", "https://futuretech.gomemezone.com"],
    credentials: true,
}));
// Routes
app.use('/api/auth', authRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
