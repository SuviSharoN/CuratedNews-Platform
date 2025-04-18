// routes/news.js
import express from 'express';
import axios from 'axios';
// import LikedNews from '../models/LikedNews.js'; // Add .js extension when using ESM

const router = express.Router();

const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

// --- Route to fetch Top Headlines from NewsAPI ---
router.get('/top-headlines', async (req, res) => {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.error('NewsAPI key is missing from .env file');
    return res.status(500).json({ message: 'Server configuration error: Missing API key.' });
  }

  console.log(`Fetching headlines for country: ${req.query.country || 'us'}, category: ${req.query.category || 'general'}`); // Log parameters

  try {
    const response = await axios.get(`${NEWS_API_BASE_URL}/top-headlines`, {
      params: {
        country: req.query.country || 'us', // Default to 'us'
        category: req.query.category,     // Allow filtering (e.g., 'business', 'technology')
        pageSize: req.query.pageSize || 10, // Reduce default size to conserve API calls during test
        page: req.query.page || 1,
      },
      headers: {
        'X-Api-Key': apiKey,
        'User-Agent': 'NewsPlatformProject/1.0.0' // Good practice
      }
    });

    console.log(`NewsAPI request successful. Status: ${response.data.status}, Results: ${response.data.totalResults}`); // Log success
    res.status(200).json(response.data);

  } catch (error) {
     // Log more detailed error information
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error fetching from NewsAPI - Status:', error.response.status);
        console.error('Error fetching from NewsAPI - Headers:', error.response.headers);
        console.error('Error fetching from NewsAPI - Data:', error.response.data);
         res.status(error.response.status).json({
            message: `NewsAPI Error: ${error.response.data.message || 'Failed to fetch headlines.'}`,
            code: error.response.data.code || null // Include error code if available
        });
    } else if (error.request) {
        // The request was made but no response was received
        console.error('Error fetching from NewsAPI - No response received:', error.request);
        res.status(503).json({ message: 'No response received from NewsAPI server.' });
    } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error fetching from NewsAPI - Request setup error:', error.message);
        res.status(500).json({ message: 'Internal server error during NewsAPI request setup.' });
    }
  }
});

// --- Route to Like/Upvote an Article (Save/Update in DB) ---
// Keep commented out or implement later using imports if needed
/*
router.post('/like', async (req, res) => {
  // ... (logic using LikedNews model)
});
*/

// --- Route to Get All Liked News from DB ---
// Keep commented out or implement later
/*
router.get('/liked', async (req, res) => {
  // ... (logic using LikedNews model)
});
*/

export default router; // Use export default for ESM