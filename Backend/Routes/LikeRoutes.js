// backend/routes/likeRoutes.js
import express from 'express';
import { protect } from '../Middleware/authMiddleware.js';
import { checkLikeStatus } from '../Middleware/LikesAuth.js';
import {
    toggleLike,
    getBatchLikeStatusAndCounts
} from '../Controllers/LikesController.js';

const router = express.Router();

router.post('/toggle', protect, checkLikeStatus, toggleLike);
router.post('/batch-status', protect, getBatchLikeStatusAndCounts);

export default router;