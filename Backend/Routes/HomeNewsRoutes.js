// routes/news.js
import express from 'express';
import axios from 'axios';

const router = express.Router();
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

// Valid NewsAPI categories
const VALID_CATEGORIES = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];

// --- Route to fetch Top Headlines (Supports Category Filtering) ---
router.get('/top-headlines', async (req, res) => {
  const apiKey = process.env.NEWS_API_KEY;
  const category = req.query.category || 'general';
  const country = req.query.country || 'us';

  // Validate category
  if (!VALID_CATEGORIES.includes(category.toLowerCase())) {
    return res.status(400).json({
      message: `Invalid category. Valid options are: ${VALID_CATEGORIES.join(', ')}.`,
    });
  }

  if (!apiKey) {
    console.error('NewsAPI key is missing from .env file');
    return res.status(500).json({ message: 'Server configuration error: Missing API key.' });
  }

  console.log(`Fetching headlines for country: ${country}, category: ${category}`);

  try {
    const response = await axios.get(`${NEWS_API_BASE_URL}/top-headlines`, {
      params: {
        country,
        category,
        pageSize: req.query.pageSize || 10,
        page: req.query.page || 1,
      },
      headers: {
        'X-Api-Key': apiKey,
        'User-Agent': 'NewsPlatformProject/1.0.0'
      }
    });

    console.log(`NewsAPI request successful. Results: ${response.data.totalResults}`);
    res.status(200).json(response.data);

  } catch (error) {
    if (error.response) {
      console.error('NewsAPI Error - Status:', error.response.status);
      console.error('NewsAPI Error - Data:', error.response.data);
      res.status(error.response.status).json({
        message: `NewsAPI Error: ${error.response.data.message || 'Failed to fetch headlines.'}`,
        code: error.response.data.code || null
      });
    } else if (error.request) {
      console.error('No response from NewsAPI:', error.request);
      res.status(503).json({ message: 'No response received from NewsAPI server.' });
    } else {
      console.error('NewsAPI request setup error:', error.message);
      res.status(500).json({ message: 'Internal server error during NewsAPI request setup.' });
    }
  }
});

export default router;
