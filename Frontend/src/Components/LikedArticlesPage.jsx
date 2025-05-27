// frontend/src/pages/LikedArticlesPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './LikedArticlesPage.css'; // <-- Import the new CSS
// No need for Link import here if not used elsewhere

// Reuse styles if desired
import '../components/HomeNews.css'; // Example: reusing card/grid styles

const placeholderImage = "https://media.istockphoto.com/id/1222357475/vector/image-preview-icon-picture-placeholder-for-website-or-ui-ux-design-vector-illustration.jpg?s=1024x1024&w=is&k=20&c=mZ2wtnhxBA20wCs2sNhAClC-hSFOkqAJAP3GqiSBIlk=";

function LikedArticlesPage() {
  const [likedArticles, setLikedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unlikingStatus, setUnlikingStatus] = useState({});
  const { token, isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchLikedArticles = async () => {
      if (!isLoggedIn || !token) {
        setError("Please log in to view your liked articles.");
        setLoading(false);
        return; // Stop execution if not logged in
      }

      setLoading(true);
      setError(null); // Clear previous errors

      try {
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };
        // Fetch liked articles for the logged-in user
        const response = await axios.get('/api/likes/user', config);

        if (response.data?.success && Array.isArray(response.data.data)) {
           // Set the state with the array of article objects returned from the backend
           setLikedArticles(response.data.data);
        } else {
          // Throw an error if the backend response wasn't successful or data format is wrong
          throw new Error(response.data?.message || "Failed to fetch liked articles");
        }
      } catch (err) {
        // Handle errors during the API call
        console.error("Error fetching liked articles:", err.response?.data || err.message);
        // Set an appropriate error message for the user
        setError(err.response?.data?.message || err.message || "Could not load liked articles.");
        setLikedArticles([]);
      } finally {
        // Always set loading to false after the fetch attempt (success or failure)
        setLoading(false);
      }
    };

    fetchLikedArticles(); // Call the function to fetch data when the component mounts or dependencies change

  }, [token, isLoggedIn]); // Dependencies: Re-run effect if token or login status changes

  // Function to handle image loading errors
  const handleImageError = (e) => {
    e.target.src = placeholderImage; // Set to placeholder if original image fails
  };

  // Function to handle copying article URL to clipboard
  const handleShare = (articleUrl) => {
    if (!articleUrl) return; // Do nothing if no URL
    navigator.clipboard.writeText(articleUrl)
      .then(() => alert("Article link copied!")) // Success message
      .catch(err => console.error("Failed to copy link: ", err)); // Log error if copy fails
  };

  const handleUnlike = async (articleUrl) => {
    if (!articleUrl) { console.error("Cannot unlike without URL"); return; }
    if (unlikingStatus[articleUrl]) return;

    setUnlikingStatus(prev => ({ ...prev, [articleUrl]: true }));

    try {
      const payload = { url: articleUrl }; // Only need URL for toggle
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post('/api/likes/toggle', payload, config);

      if (response.data?.success && response.data.data) {
        // Remove the article from the list immediately
        setLikedArticles(prev => prev.filter(article => article.url !== articleUrl));
      } else {
        throw new Error(response.data?.message || "Failed to unlike article.");
      }
    } catch (err) {
      console.error("Error unliking article:", err.response?.data || err.message);
      alert(`Failed to unlike article: ${err.response?.data?.message || err.message}`);
    } finally {
      setUnlikingStatus(prev => ({ ...prev, [articleUrl]: false }));
    }
  };

  // Render the component UI
  return (
    <div className="liked-articles-page"> {/* <-- Apply page class */}
      <header className="liked-articles-header"> {/* <-- Apply header class */}
        <h1>My Liked Articles</h1>
        <p>Your collection of saved news stories.</p>
      </header>
      <main>
        {/* Display loading indicator */}
        {loading && <div className="loading-message">Loading...</div>}

        {/* Display error message if an error occurred */}
        {!loading && error && (
          <div className="error-message">
            <p>⚠️ Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Display message if no articles are liked and no error/loading */}
        {!loading && !error && likedArticles.length === 0 && (
          <div className="no-articles-message">
            You haven't liked any articles yet!
          </div>
        )}

        {/* Display the grid of liked articles if available */}
        {!loading && !error && likedArticles.length > 0 && (
          <div className="articles-grid"> {/* <-- Apply grid class */}
            {/* Map over the likedArticles array */}
            {likedArticles.map((article) => {
              // Basic check: Skip rendering if article URL is missing
              if (!article?.url) return null;

              return (
                // Use the article URL as the key
                <div key={article.url} className="article-card"> {/* <-- Apply card class */}
                  <img
                    src={article.urlToImage || placeholderImage}
                    alt={article.title || 'Article image'}
                    className="article-image" // <-- Apply image class
                    onError={handleImageError}
                    loading="lazy"
                  />
                  <div className="article-content"> {/* <-- Apply content class */}
                    <h2 className="article-title">
                      {article.title || "No Title Provided"}
                    </h2> {/* <-- Apply title class */}
                    <p className="article-description">
                      {article.description || "No description available."}
                    </p> {/* <-- Apply description class */}
                    <div className="article-metadata"> {/* <-- Apply metadata class */}
                      <span className="source-name" title={article.source?.name || article.sourceName || 'Unknown'}>
                        {/* Adjust source field based on your LikedNewsModel if needed */}
                        Source: {article.source?.name || article.sourceName || 'Unknown'}
                      </span>
                      <span>
                        {/* Format the date */}
                        {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="article-actions"> {/* <-- Apply actions class */}
                      <button
                        className="action-button like-button" // <-- Apply action and like button classes
                        onClick={() => handleUnlike(article.url)}
                        disabled={unlikingStatus[article.url]}
                        title="Unlike this article"
                      >
                        {/* Replace with unlike icon if needed, keeping like for now */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="like-icon w-5 h-5"> <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /> </svg>
                        <span>{unlikingStatus[article.url] ? '...' : 'Unlike'}</span>
                      </button>

                      <button
                        className="action-button share-button" // <-- Apply action and share button classes
                        onClick={() => handleShare(article.url)}
                        title="Copy article link"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                        <span>Share</span>
                      </button>

                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-button read-more-button" // <-- Apply action and read more button classes
                        title="Read full article on source"
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
      {/* Optional Footer can be added here */}
      {/* <footer className="news-footer"> ... </footer> */}
    </div>
  );
}

export default LikedArticlesPage;