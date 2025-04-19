// Backend/Controllers/LikesController.js
import Like from '../Models/LikeModel.js';
import LikedNews from '../Models/LikedNewsModel.js';

/**
 * @desc    Toggle like/unlike status for an article by the logged-in user.
 * @route   POST /api/likes/toggle
 * @access  Private (Requires 'protect' and 'checkLikeStatus' middleware)
 */
export const toggleLike = async (req, res) => {
    // --- Information provided by preceding middleware ---
    const userId = req.user._id; // From 'protect'
    const existingLike = req.existingLike; // From 'checkLikeStatus'
    // --- ------------------------------------------- ---

    const { url: articleUrl, title, description, sourceName, urlToImage, publishedAt } = req.body;

    // Basic validation for articleUrl already done in middleware, but keep defensive checks if needed.
    // if (!articleUrl) { ... } // Likely redundant now

    try {
        let likedByUser = false;

        // Use the info from the middleware instead of querying again
        if (existingLike) {
            // --- UNLIKE ---
            // existingLike._id refers to the ID of the 'Like' document itself
            await Like.deleteOne({ _id: existingLike._id });
            likedByUser = false;
            // console.log(`[Toggle Like] User ${userId} unliked article via middleware check: ${articleUrl}`);

        } else {
            // --- LIKE ---
            if (!title) {
                console.warn(`[Toggle Like] Liking article without title: ${articleUrl}. Ensure frontend sends title.`);
                 // Consider stricter validation if necessary for LikedNews
            }
            await Like.create({ userId, articleUrl });
            likedByUser = true;
            // console.log(`[Toggle Like] User ${userId} liked article via middleware check: ${articleUrl}`);

            // Ensure article details are saved in LikedNews (only if it doesn't exist)
            // This logic remains the same
            await LikedNews.findOneAndUpdate(
                { url: articleUrl },
                {
                    $setOnInsert: {
                        url: articleUrl,
                        title: title || "Title Not Provided",
                        description: description || null,
                        sourceName: sourceName || null,
                        urlToImage: urlToImage || null,
                        publishedAt: publishedAt ? new Date(publishedAt) : null,
                        firstSeenAt: new Date()
                    }
                },
                { upsert: true }
            );
            // console.log(`[Toggle Like] Ensured LikedNews entry exists for: ${articleUrl}`);
        }

        // Get the NEW total like count for this specific article
        const newLikeCount = await Like.countDocuments({ articleUrl });

        // Respond
        res.status(200).json({
            success: true,
            message: likedByUser ? 'Article liked.' : 'Article unliked.',
            data: {
                likedByUser: likedByUser,
                likeCount: newLikeCount
            }
        });

    } catch (error) {
        console.error(`[Toggle Like Controller] Error for user ${userId}, article ${articleUrl}:`, error);
        // Handle potential duplicate key error on Like.create if middleware somehow misses a race condition
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Conflict: Like status may have changed concurrently.' });
        }
        res.status(500).json({ success: false, message: 'Server error processing like request.' });
    }
};

// --- getBatchLikeStatusAndCounts remains the same as it needs the userId anyway ---
export const getBatchLikeStatusAndCounts = async (req, res) => {
    // ... (Keep the previous implementation for getBatchLikeStatusAndCounts)
    const userId = req.user?._id;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    // ... rest of the function
     const { urls: articleUrls } = req.body;
    if (!articleUrls || !Array.isArray(articleUrls) || articleUrls.length === 0) {
        return res.status(400).json({ success: false, message: 'Please provide a non-empty array of URLs.' });
    }

    try {
        // Find which articles the CURRENT user has liked
        const userLikes = await Like.find({
            userId,
            articleUrl: { $in: articleUrls }
        }).select('articleUrl -_id');
        const userLikedUrlsSet = new Set(userLikes.map(like => like.articleUrl));

        // Get total like counts for ALL articles using Aggregation
        const totalCountsResult = await Like.aggregate([
            { $match: { articleUrl: { $in: articleUrls } } },
            { $group: { _id: '$articleUrl', count: { $sum: 1 } } }
        ]);
        const countsMap = totalCountsResult.reduce((map, item) => {
            map[item._id] = item.count;
            return map;
        }, {});

        // Combine results
        const responseData = articleUrls.reduce((map, url) => {
            map[url] = {
                likedByUser: userLikedUrlsSet.has(url),
                count: countsMap[url] || 0
            };
            return map;
        }, {});

        res.status(200).json({ success: true, data: responseData });

    } catch (error) {
        console.error(`[Batch Likes] Error fetching status for user ${userId}:`, error);
        res.status(500).json({ success: false, message: 'Server error fetching like status.' });
    }
}; // End of getBatchLikeStatusAndCounts