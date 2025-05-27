import Poll from '../Models/PollModel.js';
import mongoose from 'mongoose';

// @desc    Get all polls for a specific article
// @route   GET /api/polls?articleUrl=...
// @access  Public (or Private if you only want logged-in users to see polls)
export const getPollsByArticle = async (req, res) => {
    try {
        const { articleUrl } = req.query;
        if (!articleUrl) {
            return res.status(400).json({ success: false, message: 'Article URL is required' });
        }

        const polls = await Poll.find({ articleUrl }).populate('createdBy', 'username').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: polls });
    } catch (error) {
        console.error('Error fetching polls:', error);
        res.status(500).json({ success: false, message: 'Server error fetching polls' });
    }
};

// @desc    Create a new poll for an article
// @route   POST /api/polls
// @access  Private (requires login)
export const createPoll = async (req, res) => {
    try {
        const { articleUrl, question, options } = req.body;
        const userId = req.user._id;

        if (!articleUrl || !question || !options || !Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ success: false, message: 'Requires articleUrl, question, and at least 2 options' });
        }

        // Format options for the schema
        const formattedOptions = options.map(optionText => ({ text: optionText.trim(), votes: 0 })).filter(opt => opt.text);

        if (formattedOptions.length < 2) {
             return res.status(400).json({ success: false, message: 'At least 2 valid, non-empty options are required' });
        }

        const newPoll = new Poll({
            articleUrl,
            question,
            options: formattedOptions,
            createdBy: userId
        });

        await newPoll.save();
        // Populate createdBy before sending back
        const populatedPoll = await Poll.findById(newPoll._id).populate('createdBy', 'username');

        res.status(201).json({ success: true, data: populatedPoll });
    } catch (error) {
        console.error('Error creating poll:', error);
        res.status(500).json({ success: false, message: 'Server error creating poll' });
    }
};

// @desc    Vote on a poll option
// @route   POST /api/polls/:pollId/vote
// @access  Private (requires login)
export const voteOnPoll = async (req, res) => {
    try {
        const { pollId } = req.params;
        const { optionIndex } = req.body; // Index of the option voted for
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(pollId)) {
            return res.status(400).json({ success: false, message: 'Invalid Poll ID' });
        }

        const poll = await Poll.findById(pollId);

        if (!poll) {
            return res.status(404).json({ success: false, message: 'Poll not found' });
        }

        // Check if user has already voted
        if (poll.voters.map(id => id.toString()).includes(userId.toString())) {
            return res.status(400).json({ success: false, message: 'You have already voted on this poll' });
        }

        // Check if optionIndex is valid
        if (optionIndex === undefined || optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.status(400).json({ success: false, message: 'Invalid option selected' });
        }

        // Increment vote count and add voter
        poll.options[optionIndex].votes += 1;
        poll.voters.push(userId);

        await poll.save();
        // Populate createdBy before sending back
        const updatedPoll = await Poll.findById(pollId).populate('createdBy', 'username');

        res.status(200).json({ success: true, data: updatedPoll });
    } catch (error) {
        console.error('Error voting on poll:', error);
        res.status(500).json({ success: false, message: 'Server error voting on poll' });
    }
}; 