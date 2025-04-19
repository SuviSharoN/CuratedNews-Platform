// components/NewsCard.jsx
import React from 'react';

const placeholderImage = "https://placehold.co/300x160?text=No+Image";

const NewsCard = ({ article }) => {
  const handleImageError = (e) => {
    e.target.src = placeholderImage;
  };

  const handleLike = (articleUrl) => {
    console.log("Like clicked for:", articleUrl);
    alert("Like feature coming soon!");
  };

  const handleShare = (articleUrl) => {
    navigator.clipboard.writeText(articleUrl)
      .then(() => alert("Link copied!"))
      .catch(err => console.error("Copy failed:", err));
  };

  return (
    <div className="article-card">
      <img
        src={article.urlToImage || placeholderImage}
        alt={article.title || 'Article image'}
        className="article-image"
        onError={handleImageError}
      />
      <div className="article-content">
        <h2 className="article-title">
          {article.title || "No Title"}
        </h2>
        <p className="article-description">
          {article.description || "No description available."}
        </p>
        <div className="article-metadata">
          <span className="source-name">
            Source: {article.source?.name || 'Unknown'}
          </span>
          <span>
            {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>

        <div className="article-actions">
          <button className="action-button like-button" onClick={() => handleLike(article.url)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span>Like</span>
          </button>

          <button className="action-button share-button" onClick={() => handleShare(article.url)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            <span>Share</span>
          </button>

          <a href={article.url} target="_blank" rel="noopener noreferrer" className="action-button read-more-button">
            <span>Read More</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
