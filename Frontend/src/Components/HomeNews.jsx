import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HomeNews.css'; // **** IMPORT THE CSS FILE ****

// Placeholder image if article.urlToImage is null or invalid
const placeholderImage = "https://placehold.co/300x160?text=No+Image"; // Adjusted placeholder size

function HomeNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopHeadlines = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('/api/news/top-headlines');
        if (response.data && Array.isArray(response.data.articles)) {
          setArticles(response.data.articles);
          console.log(articles.length);
        } else {
          console.error("Unexpected API response structure:", response.data);
          setError("Received unexpected data format from the server.");
          setArticles([]);
        }
      } catch (err) {
        console.error("Error fetching news:", err);
        const message = err.response?.data?.message || err.message || "Failed to fetch news. Is the backend running?";
        setError(`Error: ${message}`);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopHeadlines();
  }, []);

  const handleImageError = (e) => {
    e.target.src = placeholderImage;
  };

  const handleLike = (articleUrl) => {
    console.log("Like button clicked for:", articleUrl);
    alert("Like functionality not yet implemented.");
    // TODO: Connect to backend API: /api/news/like
  };

  const handleShare = (articleUrl) => {
    console.log("Share button clicked for:", articleUrl);
    navigator.clipboard.writeText(articleUrl)
      .then(() => alert("Article link copied to clipboard!"))
      .catch(err => console.error("Failed to copy link: ", err));
  };

  return (
    // Use CSS class names now
    <div className="news-page-container">
      <header className="news-header">
        <h1>Current Headlines</h1>
        <p>Your Daily Dose of News</p>
      </header>

      <main>
        {loading && (
          <div className="loading-message">Loading articles...</div>
        )}

        {error && (
          <div className="error-message">
            <p>⚠️ Could not load news:</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
           <div className="no-articles-message">No articles found. Perhaps check the API or backend connection?</div>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="articles-grid">
            {articles.map((article) => (
              <div key={article.url} className="article-card">
                <img
                  src={article.urlToImage || placeholderImage}
                  alt={article.title || 'Article image'}
                  className="article-image" // Class for image styling
                  onError={handleImageError}
                />
                <div className="article-content">
                  <h2 className="article-title">
                    {article.title || "No Title Provided"}
                  </h2>
                  <p className="article-description">
                    {article.description || "No description available."}
                  </p>
                  <div className="article-metadata">
                    <span className="source-name"> {/* Class for potential truncation */}
                      Source: {article.source?.name || 'Unknown'}
                    </span>
                    <span>
                      {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  {/* Action Buttons */}
                  <div className="article-actions">
                    <button
                      className="action-button like-button" // Base + specific button class
                      aria-label="Like this article"
                      onClick={() => handleLike(article.url)}
                      // disabled={true} // Keep disabled for now
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Like (0)</span>
                    </button>
                    <button
                      className="action-button share-button"
                      aria-label="Share this article"
                      onClick={() => handleShare(article.url)}
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                      </svg>
                      <span>Share</span>
                    </button>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-button read-more-button" // Treat 'a' like a button
                    >
                      <span>Read More</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

       <footer className="news-footer">
        Powered by <a href="https://newsapi.org/" target="_blank" rel="noopener noreferrer">NewsAPI</a> | Built by Suvi & Team
      </footer>
    </div>
  );
}

export default HomeNews;