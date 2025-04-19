// server.js
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose' // <-- UNCOMMENT this
import cors from 'cors';
import HomeNewsRoutes from "./routes/HomeNewsRoutes.js";
import authRoutes from './Routes/authRoutes.js'; // <-- IMPORT Auth Routes
import LikeRoutes from './Routes/LikeRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI; // <-- UNCOMMENT this

// --- Middleware ---
app.use(cors());
app.use(express.json()); // Keep this for parsing JSON bodies from React

// Logging middleware (keep your existing one)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// --- Routes ---
app.use('/api/news', HomeNewsRoutes); // Keep your existing news routes
app.use('/api/auth', authRoutes);     // <-- ADD the authentication routes
app.use('/api/likes',LikeRoutes);


// Basic root route (keep existing)
app.get('/', (req, res) => {
  res.send('News Platform Backend (ESM) is running!');
});

// --- Database Connection ---
// UNCOMMENT and use this block (it includes better error handling)
if (!MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined in .env file.');
  process.exit(1);
}

console.log('Attempting to connect to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    // Start the server only after successful DB connection
    app.listen(PORT, () => { // <-- MOVE app.listen HERE
      console.log(`🚀 Server listening on port ${PORT}`);
      console.log(`API endpoints available at:`);
      console.log(`   - News: http://localhost:${PORT}/api/news`);
      console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
    });
  })
  .catch((err) => {
    console.error('❌ Error connecting to MongoDB:', err.message);
    process.exit(1);
  });

mongoose.connection.on('error', err => {
  console.error('MongoDB runtime connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected.');
});
// --- End Database Connection ---


// --- Start Server (Commented Out/Removed) ---
/*
// REMOVE this section, as app.listen is now inside the mongoose.connect().then() block
app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/news`);
});
*/