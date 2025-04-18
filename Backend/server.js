// server.js
import dotenv from 'dotenv';
import express from 'express';
// import mongoose from 'mongoose'; // Keep commented if not using DB yet
import cors from 'cors';
import HomeNewsRoutes from "../Backend/Routes/HomeNewsRoutes.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
// const MONGODB_URI = process.env.MONGODB_URI; // Keep commented

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// --- Routes ---
// Mount the imported router
app.use('/api/news', HomeNewsRoutes); // Use the imported newsRoutes

// Basic root route
app.get('/', (req, res) => {
  res.send('News Platform Backend (ESM) is running!');
});

// --- Database Connection (Commented Out) ---
/*
if (!MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined in .env file.');
  process.exit(1);
}

console.log('Attempting to connect to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    // Start the server only after successful DB connection (if uncommented)
    // app.listen(PORT, () => {
    //   console.log(`🚀 Server listening on port ${PORT}`);
    //   console.log(`API endpoints available at http://localhost:${PORT}/api/news`);
    // });
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
*/

// --- Start Server (since DB connection is commented out) ---
// If you are not waiting for the DB, you can start listening directly.
app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/news`);
});