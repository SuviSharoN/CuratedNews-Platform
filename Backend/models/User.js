// backend/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    // ... schema fields ...
     username: { type: String, required: true, unique: true, trim: true, lowercase: true },
     password: { type: String, required: true, minlength: 6 }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    // Only hash if modified
    if (!this.isModified('password')) {
        console.log(`[User Model Pre-Save] Password not modified for ${this.username}, skipping hash.`);
        return next(); // MUST call next() here too
    }
    console.log(`[User Model Pre-Save] Hashing password for: ${this.username}`);
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log(`[User Model Pre-Save] Password hashed successfully for: ${this.username}`);
        next(); // Proceed to save
    } catch (error) {
        console.error(`[User Model Pre-Save] Error hashing password for ${this.username}:`, error);
        next(error); // Pass error to Mongoose to prevent saving and bubble up error
    }
});

// ... comparePassword method and export ...
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
const User = mongoose.model('User', userSchema);
export default User;