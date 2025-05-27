import mongoose from 'mongoose';

const pollOptionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    votes: {
        type: Number,
        default: 0
    }
});

const pollSchema = new mongoose.Schema({
    articleUrl: {
        type: String,
        required: true,
        index: true // Index for faster querying by article
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    options: [pollOptionSchema], // Array of options with text and vote counts
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    voters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }] // Array of user IDs who have voted on this poll
}, { timestamps: true });

const Poll = mongoose.model('Poll', pollSchema);

export default Poll; 