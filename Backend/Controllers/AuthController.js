// backend/controllers/AuthController.js
import User from '../Models/UserModel.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

// Helper to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide username, email and password' });
    }

    try {
        // Check if username exists
        const userExists = await User.findOne({ username: username.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        // Check if email exists
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        // Create user
        const user = await User.create({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password,
        });

        if (user) {
            const token = generateToken(user._id);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                token: token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                },
            });
        } else {
            throw new Error('Invalid user data');
        }
    } catch (error) {
        console.error('Register Error:', error);
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
        const user = await User.findOne({ username: username.toLowerCase() }).select('+password');

        if (user && (await user.comparePassword(password))) {
            const token = generateToken(user._id);
            res.status(200).json({
                success: true,
                message: 'Login successful',
                token: token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
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

// Get current user profile
export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// Update user info (name, bio, etc.)
export const updateUserInfo = async (req, res) => {
    try {
        const updates = {};
        if (req.body.username) updates.username = req.body.username;
        if (req.body.bio) updates.bio = req.body.bio;
        if (typeof req.body.emailOptOut !== 'undefined') updates.emailOptOut = req.body.emailOptOut;
        // Add more fields as needed
        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// Update user interests
export const updateUserInterests = async (req, res) => {
    try {
        const { interests } = req.body;
        const user = await User.findByIdAndUpdate(req.user._id, { interests }, { new: true }).select('-password');
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// Profile picture upload setup
const storage = multer.memoryStorage();
const upload = multer({ storage });
export const uploadProfilePictureMiddleware = upload.single('profilePicture');

// Update profile picture
export const updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
        // For demo: store as base64 string. In production, use cloud storage and store the URL.
        const base64 = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
        const user = await User.findByIdAndUpdate(req.user._id, { profilePicture: dataUrl }, { new: true }).select('-password');
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};