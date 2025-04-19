import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HomeNews.css';
import NewsCard from '../Components/newsCard.jsx'; // ✅ Import the reusable component

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

  return (
    <div className="news-page-container">
      <header className="news-header">
        <h1>Current Headlines</h1>
        <p>Your Daily Dose of News</p>
      </header>

      <main>
        {loading && <div className="loading-message">Loading articles...</div>}

        {error && (
          <div className="error-message">
            <p>⚠️ Could not load news:</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="no-articles-message">
            No articles found. Perhaps check the API or backend connection?
          </div>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="articles-grid">
            {articles.map((article) => (
              <NewsCard key={article.url} article={article} />
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
