// Backend/routes/theoryRoutes.js
import express from 'express';
import { protect, authenticateToken } from '../Middleware/authMiddleware.js';
import {
    createTheory,
    getTheoriesForArticle,
    addReplyToTheory,
    voteTheory,
    voteReply
} from '../Controllers/TheoryController.js';

const router = express.Router();

router.post('/', protect, createTheory);

// --- CHANGE THIS ROUTE ---
// Change from path parameter to a fixed path
// The URL will now be passed as a query parameter (e.g., /api/theories/article?url=ENCODED_URL)
router.get('/article', getTheoriesForArticle);
// --- END CHANGE ---

// Add a reply to a specific theory
router.post('/:theoryId/replies', protect, addReplyToTheory);

// --- START VOTE ROUTES ---
// Vote on a main theory
router.put('/:theoryId/vote', protect, voteTheory);

// Vote on a specific reply to a theory
router.put('/:theoryId/replies/:replyId/vote', protect, voteReply);
// --- END VOTE ROUTES ---

export default router;