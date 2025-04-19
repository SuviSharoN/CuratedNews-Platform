// backend/models/UserModel.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'], // Added custom message
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'Username must be at least 3 characters long'], // Optional: Add minlength
        // Optional: Add regex for allowed characters if needed
        // match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    // --- ADDED EMAIL FIELD ---
    email: {
        type: String,
        required: [true, 'Email is required'], // Added custom message
        unique: true,
        trim: true,
        lowercase: true, // Store emails consistently
        // Basic email format validation using regex
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please fill a valid email address'
        ]
    },
    // --- END EMAIL FIELD ---
    password: {
        type: String,
        required: [true, 'Password is required'], // Added custom message
        minlength: [6, 'Password must be at least 6 characters long'] // Keep or adjust minlength
        // Note: Don't store the password directly if hashing in pre-save hook
        // select: false // Optionally hide password by default on queries
    }
    // Add any other fields your user needs (e.g., name, role, etc.)
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

// Hash password before saving
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10); // Generate salt
        this.password = await bcrypt.hash(this.password, salt); // Hash password
        next(); // Proceed to save
    } catch (error) {
        console.error(`[User Model Pre-Save] Error hashing password for ${this.username || this.email}:`, error);
        next(error); // Pass error to the next middleware/save operation
    }
});

// Method to compare entered password with hashed password in the database
userSchema.methods.comparePassword = async function(candidatePassword) {
    // 'this.password' refers to the hashed password stored in the document
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;