// backend/controllers/AuthController.js
import User from '../Models/UserModel.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Helper to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { // Store user's mongo _id as 'id'
        expiresIn: '1d', // Sensible default expiration
    });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
    const { username, password /*, email, name etc. */ } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }
    // Add more validation (password length, email format etc.) here

    try {
        const userExists = await User.findOne({ username: username.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        // Hash password (handled by pre-save hook in UserModel)
        const user = await User.create({
            username: username.toLowerCase(),
            password,
            // email, name...
        });

        if (user) {
            const token = generateToken(user._id);
            res.status(201).json({ // 201 Created
                success: true,
                message: 'User registered successfully',
                token: token,
                user: {
                    _id: user._id,
                    username: user.username,
                    // email: user.email, // etc.
                },
            });
        } else {
            throw new Error('Invalid user data'); // Should not happen if validation passes
        }
    } catch (error) {
        console.error('Register Error:', error);
        // Check for specific Mongoose validation errors if needed
        res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
    }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    try {
        const user = await User.findOne({ username: username.toLowerCase() });

        if (user && (await user.comparePassword(password))) {
            const token = generateToken(user._id);
            res.status(200).json({
                success: true,
                message: 'Login successful',
                token: token,
                user: {
                    _id: user._id,
                    username: user.username,
                     // email: user.email, // etc.
                },
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};