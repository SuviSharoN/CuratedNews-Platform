// frontend/src/pages/WriteTheoryPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './WriteTheory.css'; // Import the updated CSS

function WriteTheoryPage() {
    const { encodedArticleUrl: encodedUrlFromParam } = useParams();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    // Get token and login status from context
    const { token, isLoggedIn } = useAuth();
    const navigate = useNavigate();

    const [articleUrl, setArticleUrl] = useState('');

    useEffect(() => {
        // Decode URL for display/context
        if (encodedUrlFromParam) {
            try {
                setArticleUrl(decodeURIComponent(encodedUrlFromParam));
            } catch (err) {
                console.error("Failed to decode article URL from param", err);
                setError("Invalid article link.");
            }
        } else {
            setError("Article link missing."); // Handle missing param
        }
    }, [encodedUrlFromParam]);

    // Redirect logic if user lands here while not logged in
    useEffect(() => {
        if (!isLoggedIn) {
            // Redirect to login, optionally passing the intended destination
            console.log("WriteTheoryPage: Not logged in, redirecting...");
            navigate('/login', { state: { message: 'Please log in to write a theory/blog.', from: `/write-theory/${encodedUrlFromParam}` } });
        }
    }, [isLoggedIn, navigate, encodedUrlFromParam]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) { setError("You must be logged in to post."); return; }
        if (!content.trim()) { setError("Theory content cannot be empty."); return; }
        if (!articleUrl) { setError("Article URL is missing or invalid."); return; }

        setLoading(true); setError(null); setSuccess(null);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // Send the *singly* decoded URL (which is still encoded for query string) to the backend
            const response = await axios.post('/api/theories', { articleUrl, content }, config);

            if (response.data?.success) {
                setSuccess("Theory submitted successfully! Redirecting...");
                setContent(''); // Clear form
                // Redirect back to the view theories page for this article
                setTimeout(() => {
                    navigate(`/view-theories?articleUrl=${encodeURIComponent(articleUrl)}`);
                }, 1500); // Redirect after 1.5 seconds
            } else {
                throw new Error(response.data?.message || "Failed to submit theory.");
            }
        } catch (err) {
            console.error("Error submitting theory:", err.response?.data || err.message);
            setError(err.response?.data?.message || "An error occurred while submitting.");
        } finally {
            setLoading(false);
        }
    };

    // Decode article URL TWICE for display purposes only
    let displayUrl = articleUrl;
    try {
        displayUrl = decodeURIComponent(articleUrl); // Second decode for user display
    } catch (e) { /* Ignore if it fails, use singly decoded */ }

    // Initial check if login status is loading or user is not logged in
    // (The useEffect handles redirection, this provides immediate feedback)
    if (!isLoggedIn) {
        return <p className="loading-message">Checking authentication...</p>;
    }
     if (!articleUrl && !error) {
        return <p className="loading-message">Loading article link...</p>;
    }

    // Render the form
    return (
        <div className="write-theory-page">
            <h2>Write Your Theory</h2>

            {/* Display link to the original article */}
            {displayUrl && (
                <div className="context-article-link">
                    <span>Regarding article:</span>
                    <a href={displayUrl} target="_blank" rel="noopener noreferrer">
                        {displayUrl.substring(0, 100)}...
                    </a>
                </div>
            )}

            <form onSubmit={handleSubmit} className="write-theory-form">
                <div className="form-group">
                    <label htmlFor="theory-content">Your Theory / Blog Post:</label>
                    <textarea
                        id="theory-content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Share your thoughts, analysis, or predictions..."
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-actions">
                    <button type="submit" className="submit-theory-button" disabled={loading || !content.trim()}>
                        {loading ? 'Submitting...' : 'Submit Theory'}
                    </button>
                </div>
            </form>

            {/* Display Success/Error Messages */}
            {error && <p className="form-message error">{error}</p>}
            {success && <p className="form-message success">{success}</p>}
        </div>
    );
}

export default WriteTheoryPage;