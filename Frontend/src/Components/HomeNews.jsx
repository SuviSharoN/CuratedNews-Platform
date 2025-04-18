import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Placeholder image if article.urlToImage is null or invalid
const placeholderImage = "https://via.placeholder.com/300x200?text=No+Image";

function HomeNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopHeadlines = async () => {
      setLoading(true);
      setError(null); // Reset error before fetching
      try {
        // Use the proxied path - Vite dev server redirects this to your backend
        const response = await axios.get('/api/news/top-headlines');

        // Check if the response structure is as expected
        if (response.data && Array.isArray(response.data.articles)) {
          setArticles(response.data.articles);
        } else {
          console.error("Unexpected API response structure:", response.data);
          setError("Received unexpected data format from the server.");
          setArticles([]);
        }
      } catch (err) {
        console.error("Error fetching news:", err);
        // Provide a user-friendly error message
        const message = err.response?.data?.message || err.message || "Failed to fetch news. Is the backend running?";
        setError(`Error: ${message}`);
        setArticles([]); // Clear articles on error
      } finally {
        setLoading(false);
      }
    };

    fetchTopHeadlines();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Function to handle image loading errors
  const handleImageError = (e) => {
    e.target.src = placeholderImage; // Set placeholder on error
  };

  // Placeholder function for liking (we'll implement this later)
  const handleLike = (articleUrl) => {
    console.log("Like button clicked for:", articleUrl);
    // TODO: Connect to backend API: /api/news/like
    alert("Like functionality not yet implemented.");
  };

    // Placeholder function for sharing
  const handleShare = (articleUrl) => {
    console.log("Share button clicked for:", articleUrl);
    // Basic share functionality (copy link) - more advanced options exist
    navigator.clipboard.writeText(articleUrl)
      .then(() => alert("Article link copied to clipboard!"))
      .catch(err => console.error("Failed to copy link: ", err));
  };


  // --- Render Logic ---

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-blue-400 mb-2">
          Breaking News Feed
        </h1>
        <p className="text-center text-gray-500">Top Headlines</p>
      </header>

      <main>
        {/* Loading State */}
        {loading && (
          <div className="text-center text-xl text-gray-500 py-10">Loading articles...</div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center text-red-400 bg-red-900 bg-opacity-30 border border-red-600 rounded p-4 max-w-xl mx-auto">
            <p><strong>Could not load news:</strong></p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* No Articles State */}
        {!loading && !error && articles.length === 0 && (
           <div className="text-center text-xl text-gray-500 py-10">No articles found. Check the API or backend connection.</div>
        )}

        {/* Articles Grid */}
        {!loading && !error && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Map over articles and render a card for each */}
            {articles.map((article) => (
              // Use article.url as key - assuming it's unique from NewsAPI
              <div key={article.url || Math.random()} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col border border-gray-700 hover:shadow-cyan-500/30 transition-shadow duration-300">
                <img
                  src={article.urlToImage || placeholderImage}
                  alt={article.title || 'Article image'}
                  className="w-full h-48 object-cover"
                  onError={handleImageError} // Handle image loading errors
                />
                <div className="p-4 flex flex-col flex-grow">
                  <h2 className="text-lg font-semibold text-gray-100 mb-2 line-clamp-3"> {/* Limit title lines */}
                    {article.title || "No Title Provided"}
                  </h2>
                  <p className="text-gray-400 text-sm mb-3 flex-grow line-clamp-4"> {/* Limit description lines */}
                    {article.description || "No description available."}
                  </p>
                  <div className="text-xs text-gray-500 mb-4 mt-2">
                    <span>Source: {article.source?.name || 'Unknown'}</span>
                    <span className="mx-1">|</span>
                    <span>
                      Published: {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-700">
                    <button
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50"
                      aria-label="Like this article"
                      onClick={() => handleLike(article.url)} // Pass URL or full article object later
                      // disabled={true} // Enable when like logic is ready
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" transform="rotate(180 10 10)" /> {/* Simple Up Arrow */}
                      </svg>
                      Like (0) {/* Placeholder count */}
                    </button>
                    <button
                      className="flex items-center gap-1 bg-gray-600 hover:bg-gray-500 text-white py-1 px-3 rounded text-sm transition duration-150 ease-in-out"
                      aria-label="Share this article"
                      onClick={() => handleShare(article.url)}
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /> {/* Share Icon */}
                      </svg>
                      Share
                    </button>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      Read More
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /> {/* External Link Icon */}
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

       <footer className="text-center mt-12 text-gray-600 text-sm">
        Powered by NewsAPI | Built with React & Node.js
      </footer>
    </div>
  );
}

export default HomeNews;