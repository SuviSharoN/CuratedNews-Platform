// Backend/Controllers/TheoryController.js
import Theory from '../Models/TheoryModel.js';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose'; // Import mongoose

// createTheory function remains the same...
export const createTheory = asyncHandler(async (req, res) => {
    const { articleUrl, content /*, title */ } = req.body;
    const userId = req.user._id; // From protect middleware
    const username = req.user.username; // From protect middleware

    if (!articleUrl || !content) {
        res.status(400);
        throw new Error('Article URL and content are required.');
    }
    // Ensure username is available from middleware before creating
    if (!username) {
        res.status(401);
        throw new Error('User information not found, cannot post theory.');
    }
    const newTheory = await Theory.create({ articleUrl, content, userId, username });
    if (newTheory) {
        res.status(201).json({ success: true, message: 'Theory submitted successfully.', data: newTheory });
    } else {
        res.status(500);
        throw new Error('Failed to submit theory.');
    }
});

/**
 * @desc    Get all theories for a specific article URL (passed via query string)
 * @route   GET /api/theories/article?url=ENCODED_URL
 * @access  Public
 */
export const getTheoriesForArticle = asyncHandler(async (req, res) => {
    // --- CHANGE HOW URL IS READ ---
    // Read the encoded URL from the query parameter 'url'
    const encodedArticleUrl = req.query.url;
    // --- END CHANGE ---

    console.log(`[getTheoriesForArticle] Received encoded URL from query: ${encodedArticleUrl}`); // Debug log

    if (!encodedArticleUrl) {
         res.status(400);
         // Use return to prevent further execution
         return res.json({ success: false, message: 'Article URL query parameter is missing.' });
         // throw new Error('Article URL query parameter is missing.'); // Or throw
    }

    let articleUrl;
    try {
        // Decode the URL parameter received from the query string
         articleUrl = decodeURIComponent(encodedArticleUrl);
         console.log(`[getTheoriesForArticle] Decoded URL: ${articleUrl}`); // Debug log
    } catch (error) {
         console.error("[getTheoriesForArticle] Error decoding article URL parameter:", error);
         res.status(400);
          return res.json({ success: false, message: 'Invalid article URL parameter encoding.' });
         // throw new Error('Invalid article URL parameter encoding.'); // Or throw
    }

    // Find theories, populate user details for the main theory AND replies
    const theories = await Theory.find({ articleUrl: articleUrl })
                                 .populate('userId', 'username profilePicture') // Populate main author 
                                 .populate('replies.user', 'username profilePicture') // Populate replier author
                                 .sort({ createdAt: -1 });

    console.log(`[getTheoriesForArticle] Found ${theories.length} theories for URL.`); // Debug log

    res.status(200).json({
        success: true,
        count: theories.length,
        data: theories
    });
});

// @desc    Add a reply to a theory
// @route   POST /api/theories/:theoryId/replies
// @access  Private
export const addReplyToTheory = asyncHandler(async (req, res) => {
    const { theoryId } = req.params;
    const { text } = req.body;
    const userId = req.user._id; // From auth middleware

    if (!text || !text.trim()) {
        res.status(400);
        throw new Error('Reply text cannot be empty.');
    }

    if (!mongoose.Types.ObjectId.isValid(theoryId)) {
        res.status(400);
        throw new Error('Invalid Theory ID format.');
    }

    const theory = await Theory.findById(theoryId);

    if (!theory) {
        res.status(404);
        throw new Error('Theory not found.');
    }

    const reply = { user: req.user._id, text: req.body.text.trim() };
    theory.replies.push(reply);
    await theory.save();

    // Populate user info for the main theory AND ALL replies (including the new one)
    const updatedTheory = await Theory.findById(theory._id)
                                      .populate('userId', 'username profilePicture') 
                                      .populate('replies.user', 'username profilePicture');

    res.status(201).json({ 
        success: true, 
        message: 'Reply added successfully.', 
        data: updatedTheory 
    });
});

// --- START VOTE LOGIC ---

// @desc    Upvote or Downvote a theory
// @route   PUT /api/theories/:theoryId/vote
// @access  Private
export const voteTheory = asyncHandler(async (req, res) => {
    const { theoryId } = req.params;
    const { voteType } = req.body; // 'up' or 'down'
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(theoryId)) {
        res.status(400);
        throw new Error('Invalid Theory ID format.');
    }

    if (voteType !== 'up' && voteType !== 'down') {
        res.status(400);
        throw new Error('Invalid vote type. Must be "up" or "down".');
    }

    const theory = await Theory.findById(theoryId);
    if (!theory) {
        res.status(404);
        throw new Error('Theory not found.');
    }

    const upvoteIndex = theory.upvotes.indexOf(userId);
    const downvoteIndex = theory.downvotes.indexOf(userId);

    if (voteType === 'up') {
        // If already upvoted, remove upvote
        if (upvoteIndex > -1) {
            theory.upvotes.splice(upvoteIndex, 1);
        } else {
            // Add upvote
            theory.upvotes.push(userId);
            // If previously downvoted, remove downvote
            if (downvoteIndex > -1) {
                theory.downvotes.splice(downvoteIndex, 1);
            }
        }
    } else { // voteType === 'down'
        // If already downvoted, remove downvote
        if (downvoteIndex > -1) {
            theory.downvotes.splice(downvoteIndex, 1);
        } else {
            // Add downvote
            theory.downvotes.push(userId);
            // If previously upvoted, remove upvote
            if (upvoteIndex > -1) {
                theory.upvotes.splice(upvoteIndex, 1);
            }
        }
    }

    await theory.save();

    // Optionally re-populate if needed, but returning counts might be enough
    // For now, just return the updated counts
    res.status(200).json({
        success: true,
        message: `Theory vote updated successfully.`, 
        data: {
            upvotes: theory.upvotes.length,
            downvotes: theory.downvotes.length
        }
    });
});

// @desc    Upvote or Downvote a reply to a theory
// @route   PUT /api/theories/:theoryId/replies/:replyId/vote
// @access  Private
export const voteReply = asyncHandler(async (req, res) => {
    const { theoryId, replyId } = req.params;
    const { voteType } = req.body; // 'up' or 'down'
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(theoryId) || !mongoose.Types.ObjectId.isValid(replyId)) {
        res.status(400);
        throw new Error('Invalid Theory or Reply ID format.');
    }

    if (voteType !== 'up' && voteType !== 'down') {
        res.status(400);
        throw new Error('Invalid vote type. Must be "up" or "down".');
    }

    const theory = await Theory.findById(theoryId);
    if (!theory) {
        res.status(404);
        throw new Error('Theory not found.');
    }

    // Find the specific reply within the theory's replies array
    // Use .id() method provided by Mongoose subdocuments for comparison
    const reply = theory.replies.id(replyId);
    if (!reply) {
        res.status(404);
        throw new Error('Reply not found.');
    }

    // Ensure votes arrays exist (might not if created before schema update)
    reply.upvotes = reply.upvotes || [];
    reply.downvotes = reply.downvotes || [];

    const upvoteIndex = reply.upvotes.indexOf(userId);
    const downvoteIndex = reply.downvotes.indexOf(userId);

    if (voteType === 'up') {
        if (upvoteIndex > -1) {
            reply.upvotes.splice(upvoteIndex, 1);
        } else {
            reply.upvotes.push(userId);
            if (downvoteIndex > -1) {
                reply.downvotes.splice(downvoteIndex, 1);
            }
        }
    } else { // voteType === 'down'
        if (downvoteIndex > -1) {
            reply.downvotes.splice(downvoteIndex, 1);
        } else {
            reply.downvotes.push(userId);
            if (upvoteIndex > -1) {
                reply.upvotes.splice(upvoteIndex, 1);
            }
        }
    }

    await theory.save(); // Save the parent theory document

    // Return the updated counts for the specific reply
    res.status(200).json({
        success: true,
        message: `Reply vote updated successfully.`, 
        data: {
            replyId: reply._id, // Confirm which reply was updated
            upvotes: reply.upvotes.length,
            downvotes: reply.downvotes.length
        }
    });
});

// --- END VOTE LOGIC ---