// src/components/HomeNews.jsx
// This code incorporates JWT for like functionality using AuthContext
// AND uses Web Share API for sharing

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import './HomeNews.css'; // Ensure CSS is present

// Placeholder image
const placeholderImage = "https://media.istockphoto.com/id/1222357475/vector/image-preview-icon-picture-placeholder-for-website-or-ui-ux-design-vector-illustration.jpg?s=1024x1024&w=is&k=20&c=mZ2wtnhxBA20wCs2sNhAClC-hSFOkqAJAP3GqiSBIlk=";

function HomeNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [likingStatus, setLikingStatus] = useState({});

  const { token, isLoggedIn } = useAuth();
  // console.log("HomeNews Auth Status:", { isLoggedIn, tokenExists: !!token });

  const fetchNewsAndLikes = useCallback(async () => {
    setLoading(true);
    setError(null);
    setArticles([]);
    setLikingStatus({});
    // console.log("fetchNewsAndLikes triggered...");

    try {
      const headlinesResponse = await axios.get('/api/news/top-headlines');
      let fetchedArticles = [];

      if (headlinesResponse.data && headlinesResponse.data.status === 'ok' && Array.isArray(headlinesResponse.data.articles)) {
        fetchedArticles = headlinesResponse.data.articles.map(article => ({
          ...article,
          likeCount: 0,
          likedByUser: false,
        }));
        // console.log(`Fetched ${fetchedArticles.length} headlines successfully.`);
      } else {
        console.warn("Headlines response format incorrect or status not ok:", headlinesResponse.data);
        setError("Could not fetch headlines properly.");
        setLoading(false);
        return;
      }

      if (fetchedArticles.length === 0) {
        // console.log("No headlines found or processed.");
        setArticles([]);
        setLoading(false);
        return;
      }

      if (isLoggedIn && token && fetchedArticles.length > 0) {
        // console.log("User logged in. Fetching batch like status...");
        const articleUrls = fetchedArticles.map(article => article.url).filter(Boolean);

        if (articleUrls.length > 0) {
             try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const likesResponse = await axios.post('/api/likes/batch-status', { urls: articleUrls }, config);

                if (likesResponse.data?.success && typeof likesResponse.data.data === 'object') {
                    const likeStatusMap = likesResponse.data.data;
                    // console.log("Received like status map:", likeStatusMap);
                    fetchedArticles = fetchedArticles.map(article => {
                        const status = article.url ? likeStatusMap[article.url] : null;
                        return {
                            ...article,
                            likeCount: status?.count ?? 0,
                            likedByUser: status?.likedByUser ?? false,
                        };
                    });
                    // console.log("Merged like status into articles.");
                } else {
                    console.warn("Batch like status response format incorrect:", likesResponse.data);
                }
            } catch (likesError) {
                if (likesError.response?.status === 401) {
                    console.warn("Unauthorized fetching like status (token issue?).");
                } else {
                    console.error("Error fetching initial like status:", likesError.response?.data || likesError.message);
                }
            }
        } else {
            // console.log("No valid article URLs to check for likes.");
        }
      } else {
        // console.log("Skipping like status fetch (not logged in or no articles).");
      }

      setArticles(fetchedArticles);

    } catch (err) {
      console.error("Error fetching news headlines:", err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || "Failed to load news data.");
      setArticles([]);
    } finally {
      setLoading(false);
      // console.log("Fetching complete.");
    }
  }, [isLoggedIn, token]);

  useEffect(() => {
    fetchNewsAndLikes();
  }, [fetchNewsAndLikes]);

  const handleLike = async (articleToLike) => {
    const { url, title, description, source, urlToImage, publishedAt } = articleToLike;
    if (!url) {
        console.error("Cannot like article without a URL.");
        return;
    }
    if (!isLoggedIn || !token) {
      alert("Please log in to like articles.");
      return;
    }
    if (likingStatus[url]) return;
    setLikingStatus(prev => ({ ...prev, [url]: true }));

    try {
      const payload = { url, title: title || "No Title Provided", description, sourceName: source?.name, urlToImage, publishedAt };
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post('/api/likes/toggle', payload, config);

      if (response.data?.success && response.data.data) {
        const { likedByUser, likeCount } = response.data.data;
        // console.log(`Like toggled for ${url}: UserLiked=${likedByUser}, Count=${likeCount}`);
        setArticles(prevArticles =>
          prevArticles.map(art =>
            art.url === url
              ? { ...art, likedByUser: likedByUser, likeCount: likeCount }
              : art
          )
        );
      } else {
        throw new Error(response.data?.message || "Failed to process like request.");
      }
    } catch (err) {
      console.error("Error toggling like:", err.response?.data || err.message);
       if (err.response?.status === 401) {
           alert("Your session may have expired. Please log in again.");
       } else {
           alert(`Failed to update like status: ${err.response?.data?.message || err.message}`);
       }
    } finally {
      setLikingStatus(prev => ({ ...prev, [url]: false }));
    }
  };

  const handleImageError = (e) => {
    e.target.src = placeholderImage;
  };

  // --- MODIFIED handleShare Function ---
  const handleShare = async (article) => {
    const { url, title, description } = article;

    if (!url) {
        console.error("Cannot share article without a URL.");
        alert("Cannot share this article as it's missing a link.");
        return;
    }

    const shareData = {
        title: title || "Interesting Article", // Provide a default title
        text: description || `Check out this article from ${article.source?.name || 'this source'}`, // Provide default text
        url: url,
    };

    // Check if the Web Share API is available
    if (navigator.share) {
        try {
            await navigator.share(shareData);
            console.log('Article shared successfully via Web Share API');
            // You could add a subtle success feedback if needed
        } catch (err) {
            // Handle errors (e.g., user cancelled the share dialog)
            // Avoid alerting for cancellation ('AbortError')
            if (err.name !== 'AbortError') {
                console.error('Error using Web Share API:', err);
                alert(`Could not share: ${err.message}`);
            } else {
                 console.log('Share dialog dismissed by user.');
            }
        }
    } else {
        // Fallback: Copy link to clipboard if Web Share API is not supported
        console.log("Web Share API not supported, falling back to clipboard copy.");
        try {
            await navigator.clipboard.writeText(url);
            alert("Article link copied to clipboard!"); // Inform user
        } catch (err) {
            console.error("Failed to copy link to clipboard: ", err);
            alert("Could not copy link to clipboard."); // Inform user about failure
        }
    }
  };
  // --- END MODIFIED handleShare Function ---


  return (
    <div className="news-page-container">
      <header className="news-header">
        <h1>Headlines from India</h1>
        <p>Your Daily Dose of News</p>
      </header>

      <main>
        {loading && <div className="loading-message">Loading articles...</div>}

        {!loading && error && (
          <div className="error-message">
            <p>⚠️ Could not load news:</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="no-articles-message">
            No articles found.
          </div>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="articles-grid">
            {articles.map((article) => {
              if (!article?.url) return null;
              return (
                <div key={article.url} className="article-card">
                  <img
                    src={article.urlToImage || placeholderImage}
                    alt={article.title || 'Article image'}
                    className="article-image"
                    onError={handleImageError}
                    loading="lazy"
                  />
                  <div className="article-content">
                    <h2 className="article-title">
                      {article.title || "No Title Provided"}
                    </h2>
                    <p className="article-description">
                      {article.description || "No description available."}
                    </p>
                    <div className="article-metadata">
                      <span className="source-name" title={article.source?.name || 'Unknown'}>
                        Source: {article.source?.name || 'Unknown'}
                      </span>
                      <span>
                        {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="article-actions">
                      <button
                        className={`action-button like-button ${article.likedByUser ? 'liked-active' : ''}`}
                        onClick={() => handleLike(article)}
                        disabled={likingStatus[article.url] || !isLoggedIn}
                        title={!isLoggedIn ? "Please log in to like" : (article.likedByUser ? 'Unlike' : 'Like')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="like-icon w-5 h-5">
                           <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span>{likingStatus[article.url] ? '...' : (article.likeCount ?? 0)}</span>
                      </button>

                      {/* --- UPDATE onClick for Share Button --- */}
                      <button
                        className="action-button share-button"
                        onClick={() => handleShare(article)} // Pass the whole article object
                        title="Share article" // Updated title
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                        <span>Share</span>
                      </button>
                      {/* --- END UPDATE --- */}

                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-button read-more-button"
                      >
                        <span>Read More</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="news-footer">
        Powered by NewsAPI | Built with React & Node
      </footer>
    </div>
  );
}

export default HomeNews;