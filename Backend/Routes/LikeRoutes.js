// backend/routes/likeRoutes.js
import express from 'express';
import { protect } from '../Middleware/authMiddleware.js'; // Make sure this path is correct
// Remove checkLikeStatus if not needed for this route
// import { checkLikeStatus } from '../Middleware/LikesAuth.js';
import {
    toggleLike,
    getBatchLikeStatusAndCounts,
    getUserLikedArticles // <-- IMPORT the new controller function
} from '../Controllers/LikesController.js'; // Make sure this path is correct

const router = express.Router();

// Existing routes
router.post('/toggle', protect, /* checkLikeStatus maybe not needed here if handled in controller? */ toggleLike); // Check if checkLikeStatus is needed before toggleLike
router.post('/batch-status', protect, getBatchLikeStatusAndCounts);

// --- NEW ROUTE ---
// GET request to fetch all articles liked by the logged-in user
router.get('/user', protect, getUserLikedArticles); // Protect ensures req.user exists

export default router;