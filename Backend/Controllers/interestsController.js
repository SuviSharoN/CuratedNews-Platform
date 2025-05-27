import InterestsModel from '../Models/InterestsModel.js';
import nodemailer from 'nodemailer';
import axios from 'axios';

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to fetch news based on interests
const fetchNewsForInterests = async (interests) => {
  const newsItems = [];
  for (const interest of interests) {
    try {
      const response = await axios.get(`https://newsapi.org/v2/everything`, {
        params: {
          q: interest,
          sortBy: 'publishedAt',
          language: 'en',
          pageSize: 2,
          apiKey: process.env.NEWS_API_KEY
        }
      });
      newsItems.push(...response.data.articles);
    } catch (error) {
      console.error(`Error fetching news for ${interest}:`, error);
    }
  }
  return newsItems;
};

// Function to create email content
const createEmailContent = (newsItems) => {
  let content = '<h2>Your Daily News Digest</h2>';
  newsItems.forEach((article, index) => {
    content += `
      <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        <h3>${article.title}</h3>
        <p>${article.description}</p>
        <a href="${article.url}" style="color: #3498db;">Read more</a>
      </div>
    `;
  });
  return content;
};

export const saveInterests = async (req, res) => {
    try {
        const { userId, interests, email } = req.body;

        if (!userId || !interests || !email) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Save interests to database
        const userInterests = await InterestsModel.findOneAndUpdate(
            { userId },
            { interests },
            { upsert: true, new: true }
        );

        // Send email with news articles
        const newsPromises = interests.map(async (interest) => {
            try {
                const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
                    params: {
                        category: interest.toLowerCase(),
                        apiKey: process.env.NEWS_API_KEY,
                        country: 'us',
                        pageSize: 2
                    },
                    timeout: 10000 // 10 second timeout
                });
                return response.data.articles;
            } catch (error) {
                console.error(`Error fetching news for ${interest}:`, error.message);
                return []; // Return empty array if fetch fails
            }
        });

        const newsResults = await Promise.all(newsPromises);
        const articles = newsResults.flat().slice(0, 5); // Get top 5 articles total

        if (articles.length === 0) {
            console.warn('No articles were fetched from NewsAPI');
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Personalized News Digest',
            html: `
                <h1>Your News Digest</h1>
                <p>Here are the latest articles based on your interests:</p>
                ${articles.length > 0 ? articles.map(article => `
                    <div style="margin-bottom: 20px;">
                        <h2>${article.title}</h2>
                        <p>${article.description}</p>
                        <a href="${article.url}">Read more</a>
                    </div>
                `).join('') : '<p>No articles available at the moment.</p>'}
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ 
            success: true, 
            message: 'Interests saved and email sent successfully',
            userInterests 
        });
    } catch (error) {
        console.error('Error in saveInterests:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error saving interests or sending email',
            error: error.message 
        });
    }
};

export const getInterests = async (req, res) => {
  try {
    const userId = req.user._id;
    const interests = await InterestsModel.findOne({ userId });
    res.status(200).json({
      success: true,
      data: interests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching interests',
      error: error.message
    });
  }
};

export const testEmail = async (req, res) => {
    try {
        const testEmail = req.body.email || 'test@example.com';
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: testEmail,
            subject: 'Test Email from News App',
            html: `
                <h1>Test Email</h1>
                <p>This is a test email to verify that the email service is working correctly.</p>
                <p>If you're receiving this email, the nodemailer configuration is working properly!</p>
            `
        };

        await transporter.sendMail(mailOptions);
        
        res.status(200).json({
            success: true,
            message: 'Test email sent successfully'
        });
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending test email',
            error: error.message
        });
    }
}; 