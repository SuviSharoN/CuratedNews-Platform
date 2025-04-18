// backend/routes/authRoutes.js
import express from 'express';
import mongoose from 'mongoose'; // Import mongoose here to check connection state
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// --- Registration Route ---
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password' });
    }

    try {
        console.log(`[Register Route] Received: username=${username}`); // Log username

        // <<< CHECK CONNECTION STATE >>>
        const connectionState = mongoose.connection.readyState;
        console.log(`[Register Route] Mongoose Connection State: ${connectionState} (0=disc, 1=conn, 2=connecting, 3=discing)`);
        if (connectionState !== 1) {
             console.error("[Register Route] Database not connected before checking user!");
             // Optionally return an error here, or just log it
             // return res.status(503).json({ message: 'Database connection issue. Please try again later.' }); // 503 Service Unavailable
        }
        // <<< END CHECK >>>

        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            console.log(`[Register Route] Conflict: Username ${username} already exists.`);
            return res.status(409).json({ message: 'Username already exists' });
        }

        console.log(`[Register Route] Creating new User instance for ${username}...`);
        const newUser = new User({ username, password });

        console.log(`[Register Route] Attempting to save user ${username}...`);
        // Save and log the result or error more explicitly
        const savedUser = await newUser.save(); // Triggers pre-save hook
        console.log(`[Register Route] User ${username} save operation completed.`);

        // <<< VERIFY SAVED USER (Optional but helpful) >>>
        if (savedUser && savedUser._id) {
             console.log(`[Register Route] Successfully saved user with ID: ${savedUser._id}`);
             res.status(201).json({ message: 'User registered successfully!' });
        } else {
             // This case is highly unusual if no error was thrown by .save()
             console.error(`[Register Route] Save completed for ${username} but user object seems invalid or lacks ID.`);
             res.status(500).json({ message: 'Server error during registration (post-save issue).' });
        }
        // <<< END VERIFY >>>


    } catch (error) {
         // Log the full error object for more details
         console.error("[Register Route] CATCH BLOCK ERROR:", error);
         if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
         }
         // Send a generic error response
         res.status(500).json({ message: 'Server error during registration' });
    }
});

// --- Login Route --- (Keep as is for now, focus on register)
router.post('/login', async (req, res) => {
    // ... existing login logic ...
});

export default router;