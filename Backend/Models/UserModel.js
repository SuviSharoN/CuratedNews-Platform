// backend/models/UserModel.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
     username: {
        type: String,
        required: [true, 'Please provide a username'],
        unique: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
     password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false
    },
    profilePicture: {
        type: String, // URL or base64
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    interests: {
        type: [String],
        default: []
    },
    emailOptOut: {
        type: Boolean,
        default: false
    }
    // Add any other fields your user needs (name, etc.)
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        // console.log(`[User Model Pre-Save] Password not modified for ${this.username}, skipping hash.`);
        return next();
    }
    // console.log(`[User Model Pre-Save] Hashing password for: ${this.username}`);
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        // console.log(`[User Model Pre-Save] Password hashed successfully for: ${this.username}`);
        next();
    } catch (error) {
        console.error(`[User Model Pre-Save] Error hashing password for ${this.username}:`, error);
        next(error);
    }
});

// Method to compare entered password with hashed password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;    