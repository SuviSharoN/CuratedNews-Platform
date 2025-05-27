// Backend/Models/TheoryModel.js
import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // --- Add Votes for Replies ---
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    downvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
    // --- End Votes for Replies ---
});

const theorySchema = new mongoose.Schema({
    articleUrl: { // Link to the original news article
        type: String,
        required: [true, 'Article URL is required.'],
        trim: true,
        index: true // Index for efficient lookup
    },
    userId: { // Link to the user who wrote it
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Refers to your User model
        required: [true, 'User ID is required.'],
        index: true
    },
    username: { // Store username for easy display
        type: String,
        required: [true, 'Username is required.'],
        trim: true
    },
    content: { // The actual theory/blog content
        type: String,
        required: [true, 'Content cannot be empty.'],
        trim: true,
        maxlength: [5000, 'Content cannot exceed 5000 characters.'] // Optional length limit
    },
    // Optional: Add Title if you want users to title their theories
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters.']
    },
    replies: [replySchema], // Array to store replies
    // --- Add Votes for Main Theory ---
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    downvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
    // --- End Votes for Main Theory ---
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

const Theory = mongoose.model('Theory', theorySchema);
export default Theory;