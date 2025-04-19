// backend/middleware/likeMiddleware.js
import Like from '../Models/LikeModel.js';

export const checkLikeStatus = async (req, res, next) => {
    const userId = req.user?._id; // Assumes 'protect' ran first
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Not authorized, user information missing.' });
    }

    const { url: articleUrl } = req.body;
    if (!articleUrl) {
        return res.status(400).json({ success: false, message: 'Article URL is required in the request body.' });
    }

    try {
        // .lean() returns plain JS object, slightly faster if you don't need Mongoose methods on it later
        const existingLike = await Like.findOne({ userId, articleUrl }).lean();
        req.existingLike = existingLike; // Attach doc or null
        next();
    } catch (error) {
        console.error('[Middleware Error] Failed to check like status:', error);
        res.status(500).json({ success: false, message: 'Server error checking like status.' });
    }
};