// Backend/Controllers/LikesController.js
import Like from '../Models/LikeModel.js';
import LikedNews from '../Models/LikedNewsModel.js';

/**
 * @desc    Toggle like/unlike status for an article by the logged-in user.
 * @route   POST /api/likes/toggle
 * @access  Private (Requires authentication middleware like 'authenticateToken')
 */
export const toggleLike = async (req, res) => {
    const userId = req.user._id; // From authentication middleware
    const { url: articleUrl, title, description, sourceName, urlToImage, publishedAt } = req.body;

    if (!articleUrl) {
        return res.status(400).json({ success: false, message: 'Article URL is required.' });
    }

    try {
        // 1. Ensure the article exists in LikedNews (Upsert)
        // We do this first to ensure the article details are saved regardless of like state.
        const newsArticle = await LikedNews.findOneAndUpdate(
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
            { upsert: true, new: true } // Return the document, create if doesn't exist
        );

        // 2. Check the *current* like status for this user and article
        // This tells us whether we need to add or remove the like.
        const existingLike = await Like.findOne({ userId, articleUrl });

        let updateOperation;
        if (existingLike) {
            // --- User currently LIKES it -> UNLIKE --- 
            updateOperation = Like.deleteOne({ _id: existingLike._id });
        } else {
            // --- User currently does NOT like it -> LIKE --- 
            // Use findOneAndUpdate with upsert for Likes as well, to handle potential races 
            // though direct create is also reasonable if races are unlikely.
            // Using create here for simplicity as unlike is handled above.
            updateOperation = Like.create({ userId, articleUrl });
        }

        // 3. Perform the like/unlike operation
        await updateOperation;

        // 4. Get the final state AFTER the operation
        const finalLikeCount = await Like.countDocuments({ articleUrl });
        const userNowLikes = await Like.exists({ userId, articleUrl }); // Check if the like exists *now*

        // Respond with the final, definitive state
        res.status(200).json({
            success: true,
            message: userNowLikes ? 'Article liked.' : 'Article unliked.',
            data: {
                likedByUser: !!userNowLikes, // Convert null/doc to boolean
                likeCount: finalLikeCount
            }
        });

    } catch (error) {
        console.error(`[Toggle Like Controller] Error for user ${userId}, article ${articleUrl}:`, error);
        // Generic error, as the logic should prevent conflicts now
        res.status(500).json({ success: false, message: 'Server error processing like request.' });
    }
};

// --- getBatchLikeStatusAndCounts remains the same as it needs the userId anyway ---
export const getBatchLikeStatusAndCounts = async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    const { urls: articleUrls } = req.body;
    if (!articleUrls || !Array.isArray(articleUrls) || articleUrls.length === 0) {
        return res.status(400).json({ success: false, message: 'Please provide a non-empty array of URLs.' });
    }
    try {
        const userLikes = await Like.find({
            userId,
            articleUrl: { $in: articleUrls }
        }).select('articleUrl -_id');
        const userLikedUrlsSet = new Set(userLikes.map(like => like.articleUrl));
        const totalCountsResult = await Like.aggregate([
            { $match: { articleUrl: { $in: articleUrls } } },
            { $group: { _id: '$articleUrl', count: { $sum: 1 } } }
        ]);
        const countsMap = totalCountsResult.reduce((map, item) => {
            map[item._id] = item.count;
            return map;
        }, {});
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

/**
 * @desc    Get all articles liked by the currently authenticated user
 * @route   GET /api/likes/user
 * @access  Private (Requires 'protect' middleware)
 */
export const getUserLikedArticles = async (req, res) => {
    const userId = req.user._id; // Get user ID from token (added by protect middleware)

    try {
        // 1. Find all 'Like' documents created by this user
        const userLikes = await Like.find({ userId: userId }).select('articleUrl -_id'); // Select only the articleUrl

        if (!userLikes || userLikes.length === 0) {
            // If the user hasn't liked anything
            return res.status(200).json({ success: true, data: [] });
        }

        // 2. Extract the URLs of the liked articles
        const likedUrls = userLikes.map(like => like.articleUrl);

        // 3. Find all the full article details from LikedNews collection based on the URLs
        //    Sort by publishedAt descending to show newest first (optional)
        const likedArticleDetails = await LikedNews.find({ url: { $in: likedUrls } })
                                                 .sort({ publishedAt: -1 }); // Optional sort

        // 4. Return the array of full article details
        res.status(200).json({
            success: true,
            data: likedArticleDetails
        });

    } catch (error) {
        console.error(`[Get User Likes] Error fetching liked articles for user ${userId}:`, error);
        res.status(500).json({ success: false, message: 'Server error fetching liked articles.' });
    }
};