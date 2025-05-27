import express from 'express';
import {
    getPollsByArticle,
    createPoll,
    voteOnPoll
} from '../Controllers/PollController.js';
import { authenticateToken } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Get polls for an article (public or protected - currently public)
router.get('/', getPollsByArticle);

// Create a new poll (protected)
router.post('/', authenticateToken, createPoll);

// Vote on a poll (protected)
router.post('/:pollId/vote', authenticateToken, voteOnPoll);

export default router; 