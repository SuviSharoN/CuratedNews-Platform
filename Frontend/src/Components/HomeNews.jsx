// src/components/HomeNews.jsx
// This code incorporates JWT for like functionality using AuthContext

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import './HomeNews.css'; // Ensure CSS is present

// Placeholder image
const placeholderImage = "https://media.istockphoto.com/id/1222357475/vector/image-preview-icon-picture-placeholder-for-website-or-ui-ux-design-vector-illustration.jpg?s=1024x1024&w=is&k=20&c=mZ2wtnhxBA20wCs2sNhAClC-hSFOkqAJAP3GqiSBIlk=";

function HomeNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false); // Start false
  const [error, setError] = useState(null);
  const [likingStatus, setLikingStatus] = useState({});

  // --- Get Auth State from Context ---
  const { token, isLoggedIn } = useAuth();
  console.log("HomeNews Auth Status:", { isLoggedIn, tokenExists: !!token }); // Log auth state on render

  // --- Fetching News and Like Status ---
  const fetchNewsAndLikes = useCallback(async () => {
    setLoading(true);
    setError(null);
    setArticles([]);
    setLikingStatus({});
    console.log("fetchNewsAndLikes triggered..."); // Log fetch start

    try {
      // 1. Fetch Headlines (Assumes public or correctly handled by backend)
      // NOTE: Ensure '/api/news/top-headlines' is the correct endpoint on your backend
      //       and it returns { success: true, articles: [...] } on success.
      const headlinesResponse = await axios.get('/api/news/top-headlines'); // Example: Fetch 30 India headlines
      let fetchedArticles = [];

      // Check if backend response for headlines is successful and contains articles array
      if (headlinesResponse.data && headlinesResponse.data.status === 'ok' && Array.isArray(headlinesResponse.data.articles)) {
        // Process articles (this should run now)
        fetchedArticles = headlinesResponse.data.articles.map(article => ({
          ...article,
          likeCount: 0,
          likedByUser: false,
        }));
        console.log(`Fetched ${fetchedArticles.length} headlines successfully.`);
    } else {
        // This block should now only run if status is not 'ok' or articles is missing/not an array
        console.warn("Headlines response format incorrect or status not ok:", headlinesResponse.data);
        setError("Could not fetch headlines properly."); // Keep error for bad status
        fetchedArticles = []; // Still ensure empty on failure
        // Consider stopping loading/returning here if needed
        setLoading(false);
        return;
    }

      // Exit if no articles fetched
      if (fetchedArticles.length === 0) {
        console.log("No headlines found or processed.");
        setArticles([]);
        setLoading(false);
        return;
      }

      // 2. Fetch Like Status *IF* Logged In
      if (isLoggedIn && token && fetchedArticles.length > 0) {
        console.log("User logged in. Fetching batch like status...");
        const articleUrls = fetchedArticles.map(article => article.url).filter(Boolean); // Get valid URLs

        if (articleUrls.length > 0) {
             try {
                // --- Prepare Authenticated Request ---
                const config = {
                    headers: { Authorization: `Bearer ${token}` } // Add JWT token
                };
                // --- Call Backend Endpoint for Batch Status ---
                const likesResponse = await axios.post('/api/likes/batch-status', { urls: articleUrls }, config);

                if (likesResponse.data?.success && typeof likesResponse.data.data === 'object') {
                    const likeStatusMap = likesResponse.data.data;
                    console.log("Received like status map:", likeStatusMap);

                    // Merge like status into articles
                    fetchedArticles = fetchedArticles.map(article => {
                    const status = article.url ? likeStatusMap[article.url] : null;
                    return {
                        ...article,
                        likeCount: status?.count ?? 0,
                        likedByUser: status?.likedByUser ?? false,
                    };
                    });
                    console.log("Merged like status into articles.");
                } else {
                    console.warn("Batch like status response format incorrect:", likesResponse.data);
                }
            } catch (likesError) {
                // Handle errors during like status fetch (e.g., 401 Unauthorized)
                if (likesError.response?.status === 401) {
                    console.warn("Unauthorized fetching like status (token issue?).");
                    // Optional: Trigger logout via context if token is invalid
                    // logout();
                } else {
                    console.error("Error fetching initial like status:", likesError.response?.data || likesError.message);
                }
                // Proceed without like status if fetch fails
            }
        } else {
             console.log("No valid article URLs to check for likes.");
        }

      } else {
         console.log("Skipping like status fetch (not logged in or no articles).");
      }

      // 4. Update final state
      setArticles(fetchedArticles);

    } catch (err) {
      // Catch errors from the primary headline fetch
      console.error("Error fetching news headlines:", err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || "Failed to load news data.");
      setArticles([]); // Clear articles on error
    } finally {
      setLoading(false); // Ensure loading is always set to false
      console.log("Fetching complete.");
    }
  }, [isLoggedIn, token]); // Dependencies: Re-run if login status or token changes

  // Effect to run the fetch function
  useEffect(() => {
    fetchNewsAndLikes();
  }, [fetchNewsAndLikes]);

  // --- Handle Like Button Click ---
  const handleLike = async (articleToLike) => {
    const { url, title, description, source, urlToImage, publishedAt } = articleToLike;
    if (!url) {
        console.error("Cannot like article without a URL.");
        return;
    }

    // --- Check login status via context ---
    if (!isLoggedIn || !token) {
      alert("Please log in to like articles.");
      return;
    }

    // Prevent multiple clicks while processing
    if (likingStatus[url]) return;
    setLikingStatus(prev => ({ ...prev, [url]: true }));

    try {
      const payload = { url, title: title || "No Title Provided", description, sourceName: source?.name, urlToImage, publishedAt };
      // --- Prepare Authenticated Request ---
      const config = {
        headers: { Authorization: `Bearer ${token}` } // Add JWT token
      };

      // --- Call Backend Endpoint to Toggle Like ---
      const response = await axios.post('/api/likes/toggle', payload, config);

      if (response.data?.success && response.data.data) {
        const { likedByUser, likeCount } = response.data.data; // Get updated status
        console.log(`Like toggled for ${url}: UserLiked=${likedByUser}, Count=${likeCount}`);

        // Update state immutably
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
           // logout(); // Optional: Trigger logout via context
       } else {
           alert(`Failed to update like status: ${err.response?.data?.message || err.message}`);
       }
    } finally {
      setLikingStatus(prev => ({ ...prev, [url]: false }));
    }
  };

  // --- Other Handlers ---
  const handleImageError = (e) => {
    e.target.src = placeholderImage;
  };

  const handleShare = (articleUrl) => {
    if (!articleUrl) return;
    navigator.clipboard.writeText(articleUrl)
      .then(() => alert("Article link copied!"))
      .catch(err => console.error("Failed to copy link: ", err));
  };

  // --- Render ---
  return (
    <div className="news-page-container">
      <header className="news-header">
        <h1>Headlines from India</h1> {/* Or adjust title */}
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
              if (!article?.url) return null; // Skip rendering if no URL key
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
                        // Apply 'liked-active' class based on state
                        className={`action-button like-button ${article.likedByUser ? 'liked-active' : ''}`}
                        onClick={() => handleLike(article)}
                        // Disable if processing like OR if user is not logged in
                        disabled={likingStatus[article.url] || !isLoggedIn}
                        title={!isLoggedIn ? "Please log in to like" : (article.likedByUser ? 'Unlike' : 'Like')}
                      >
                        {/* Heart Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="like-icon w-5 h-5">
                           <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        {/* Display like count */}
                        <span>{likingStatus[article.url] ? '...' : (article.likeCount ?? 0)}</span>
                      </button>

                      <button
                        className="action-button share-button"
                        onClick={() => handleShare(article.url)}
                      >
                        {/* Share Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                        <span>Share</span>
                      </button>

                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-button read-more-button"
                      >
                        <span>Read More</span>
                        {/* Read More Icon */}
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