// src/components/HomeNews.jsx
// V5: Final attempt - Assumes useAuth provides correct isLoggedIn/userInfo

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import './HomeNews.css'; // Ensure CSS includes comment styles

// Placeholder image
const placeholderImage = "https://media.istockphoto.com/id/1222357475/vector/image-preview-icon-picture-placeholder-for-website-or-ui-ux-design-vector-illustration.jpg?s=1024x1024&w=is&k=20&c=mZ2wtnhxBA20wCs2sNhAClC-hSFOkqAJAP3GqiSBIlk=";

// --- Local component for displaying a single comment ---
const CommentItemInline = ({ comment, currentUserId, onDelete }) => {
    const isOwner = comment?.user?._id === currentUserId;
    const handleDeleteClick = () => { if (window.confirm('Delete comment?')) { onDelete(comment._id); } };
    const userName = comment?.user?.username || comment?.user?.name || 'Anonymous';
    const commentDate = comment?.createdAt ? new Date(comment.createdAt).toLocaleString() : '';

    return (
        <div className="comment-item-inline">
            <div className="comment-header-inline">
                <strong>{userName}</strong>
                <span className="comment-date-inline">{commentDate}</span>
            </div>
            <p className="comment-text-inline">{comment.text}</p>
            {isOwner && ( <button onClick={handleDeleteClick} className="comment-delete-btn-inline" title="Delete">×</button> )}
        </div>
    );
};


function HomeNews() {
    // --- State ---
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [likingStatus, setLikingStatus] = useState({});
    // Auth State from Context - CRITICAL
    const { token, isLoggedIn, user } = useAuth();
    // Comment State
    const [visibleCommentSectionId, setVisibleCommentSectionId] = useState(null);
    const [currentComments, setCurrentComments] = useState([]);
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentError, setCommentError] = useState(null);
    const [newCommentText, setNewCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    // --- End State ---

    // --- Fetch News & Likes ---
    const fetchNewsAndLikes = useCallback(async () => {
        setLoading(true); setError(null); setArticles([]); setLikingStatus({});
        try {
            const headlinesResponse = await axios.get('/api/news/top-headlines');
            let fetchedArticles = headlinesResponse.data?.articles?.map(a => ({...a, likeCount: 0, likedByUser: false})) || [];
            if (!headlinesResponse.data?.status === 'ok' || fetchedArticles.length === 0) {
                 setError("Could not fetch news headlines."); setLoading(false); return;
            }
            if (isLoggedIn && token && fetchedArticles.length > 0) {
                const articleUrls = fetchedArticles.map(a => a.url).filter(Boolean);
                if (articleUrls.length > 0) {
                    try {
                        const config = { headers: { Authorization: `Bearer ${token}` } };
                        const likesResponse = await axios.post('/api/likes/batch-status', { urls: articleUrls }, config);
                        if (likesResponse.data?.success && typeof likesResponse.data.data === 'object') {
                            const likeStatusMap = likesResponse.data.data;
                            fetchedArticles = fetchedArticles.map(article => {
                                const status = article.url ? likeStatusMap[article.url] : null;
                                return { ...article, likeCount: status?.count ?? 0, likedByUser: status?.likedByUser ?? false };
                            });
                        }
                    } catch (likesError) { console.error("Non-critical: fetch like status failed:", likesError.response?.data || likesError.message); }
                }
            }
            setArticles(fetchedArticles);
        } catch (err) {
            console.error("Critical Error fetching news headlines:", err.response?.data || err.message);
            setError(err.response?.data?.message || "Failed to load news feed."); setArticles([]);
        } finally { setLoading(false); }
    }, [isLoggedIn, token]);
    useEffect(() => { fetchNewsAndLikes(); }, [fetchNewsAndLikes]);

    // --- Like Handler ---
    const handleLike = async (articleToLike) => {
        const { url, title, description, source, urlToImage, publishedAt } = articleToLike;
        if (!url || !isLoggedIn || !token) { if(!isLoggedIn) alert("Please log in to like."); return; }
        if (likingStatus[url]) return;
        setLikingStatus(prev => ({ ...prev, [url]: true }));
        try {
            const payload = { url, title: title || "N/A", description, sourceName: source?.name, urlToImage, publishedAt };
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.post('/api/likes/toggle', payload, config);
            if (data?.success && data.data) { setArticles(prev => prev.map(art => art.url === url ? { ...art, likedByUser: data.data.likedByUser, likeCount: data.data.likeCount } : art)); }
            else { throw new Error(data?.message || "Like failed."); }
        } catch (err) { console.error("Error toggling like:", err.response?.data || err.message); alert(`Like failed: ${err.response?.data?.message || err.message}`); }
        finally { setLikingStatus(prev => ({ ...prev, [url]: false })); }
    };

    // --- Image Error Handler ---
    const handleImageError = (e) => { e.target.src = placeholderImage; };

    // --- Share Handler ---
    const handleShare = async (article) => { /* ... existing handleShare logic ... */ };

    // --- Fetch Comments ---
    const fetchCommentsForArticle = useCallback(async (newsUrl) => {
        if (!newsUrl) return;
        setCommentLoading(true); setCommentError(null); setCurrentComments([]);
        try {
            const encodedUrl = encodeURIComponent(newsUrl);
            const { data } = await axios.get(`/api/comments/${encodedUrl}`);
            setCurrentComments(data || []);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to load comments.';
            console.error(`Error fetching comments for ${newsUrl}:`, errorMsg, err.response || err);
            setCommentError(errorMsg); setCurrentComments([]);
        } finally { setCommentLoading(false); }
    }, []);

    // --- Toggle Comment Section ---
    const toggleCommentSection = useCallback((newsUrl) => {
        const openingNewUrl = visibleCommentSectionId !== newsUrl;
        setVisibleCommentSectionId(openingNewUrl ? newsUrl : null);
        if (openingNewUrl) { fetchCommentsForArticle(newsUrl); setNewCommentText(''); setCommentError(null); }
        else { setCurrentComments([]); setCommentError(null); }
    }, [visibleCommentSectionId, fetchCommentsForArticle]);

    // --- Post New Comment ---
    const handleCommentSubmit = useCallback(async (e) => {
        e.preventDefault();
        // Re-check login status *before* making API call
        if (!isLoggedIn || !user) {
             setCommentError("Authentication error. Please log in again."); // More specific error
             return;
        }
        if (!newCommentText.trim() || !visibleCommentSectionId) { return; } // Prevent empty submit

        setIsSubmittingComment(true); setCommentError(null);
        try {
            const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
            const { data: postedComment } = await axios.post('/api/comments', { text: newCommentText, newsItemId: visibleCommentSectionId }, config);
            setCurrentComments(prev => [postedComment, ...prev]); setNewCommentText('');
        } catch (err) {
            console.error("Error posting comment:", err.response?.data || err.message);
            setCommentError(err.response?.data?.message || 'Could not post comment.');
            if (err.response?.status === 401) { alert("Session expired. Please log in again to comment."); }
        } finally { setIsSubmittingComment(false); }
    }, [newCommentText, isLoggedIn, user, token, visibleCommentSectionId]); // Ensure all needed deps are here

    // --- Delete Comment ---
    const handleDeleteComment = useCallback(async (commentId) => {
        if (!isLoggedIn || !user || !commentId) return;
        const originalComments = [...currentComments];
        setCurrentComments(prev => prev.filter(c => c._id !== commentId)); setCommentError(null);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`/api/comments/${commentId}`, config);
        } catch (err) {
            console.error("Error deleting comment:", err.response?.data || err.message);
            setCommentError(err.response?.data?.message || 'Could not delete comment.');
            setCurrentComments(originalComments); // Revert UI
            if (err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 404) { alert(err.response?.data?.message || "Could not delete comment."); }
        }
    }, [isLoggedIn, token, user, currentComments]);

    // --- Render ---
    return (
        <div className="news-page-container">
            <header className="news-header"> <h1>Headlines from India</h1> <p>Your Daily Dose of News</p> </header>

            <main>
                {loading && <div className="loading-spinner"></div>}
                {!loading && error && <div className="error-message main-error">{error}</div>}
                {!loading && !error && articles.length === 0 && <div className="no-articles-message">No news found.</div>}

                {!loading && !error && articles.length > 0 && (
                    <div className="articles-grid">
                        {articles.map((article) => {
                            if (!article?.url) return null;
                            const isCommentSectionVisible = visibleCommentSectionId === article.url;

                            return (
                                <div key={article.url} className="article-card">
                                    {/* Article Image */}
                                    <img src={article.urlToImage || placeholderImage} alt={article.title || ''} className="article-image" onError={handleImageError} loading="lazy" />
                                    {/* Article Content */}
                                    <div className="article-content">
                                        <h2 className="article-title">{article.title || "No Title"}</h2>
                                        <p className="article-description">{article.description || "No description."}</p>
                                        <div className="article-metadata"> {/* Source & Date */}
                                            <span className="source-name" title={article.source?.name || 'Unknown'}>Source: {article.source?.name || 'Unknown'}</span>
                                            <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <div className="article-actions"> {/* Buttons */}
                                            {/* Like Btn */}
                                            <button className={`action-button like-button ${article.likedByUser ? 'liked-active' : ''}`} onClick={() => handleLike(article)} disabled={likingStatus[article.url] || !isLoggedIn} title={!isLoggedIn ? "Log in to like" : (article.likedByUser ? 'Unlike' : 'Like')}> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="like-icon w-5 h-5"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg> <span>{likingStatus[article.url] ? '...' : (article.likeCount ?? 0)}</span> </button>
                                            {/* Comment Btn */}
                                            <button className={`action-button comment-toggle-btn ${isCommentSectionVisible ? 'active' : ''}`} onClick={() => toggleCommentSection(article.url)} title={isCommentSectionVisible ? "Hide Comments" : "Show Comments"}> <span>Comment</span> </button>
                                            {/* Share Btn */}
                                            <button className="action-button share-button" onClick={() => handleShare(article)} title="Share article"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg> <span>Share</span> </button>
                                            {/* Read More Btn */}
                                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="action-button read-more-button"> <span>Read More</span> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg> </a>
                                        </div>
                                    </div> {/* End article-content */}

                                    {/* --- Conditionally Rendered Comment Section --- */}
                                    {isCommentSectionVisible && (
                                        <div className="comment-section-inline">
                                            <h4>Comments</h4>

                                            {/* --- CORRECTED LOGIN CHECK --- */}
                                            {/* Check isLoggedIn AND userInfo before rendering form */}
                                            {isLoggedIn && user ? (
                                                <form onSubmit={handleCommentSubmit} className="comment-form-inline">
                                                    <textarea
                                                        placeholder="Add your comment..."
                                                        value={newCommentText}
                                                        onChange={(e) => setNewCommentText(e.target.value)}
                                                        required
                                                        rows={3}
                                                        disabled={isSubmittingComment}
                                                    />
                                                    <button type="submit" disabled={isSubmittingComment || !newCommentText.trim()}>
                                                        {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                                                    </button>
                                                </form>
                                            ) : (
                                                // Only show this if the check above fails
                                                <p className="login-prompt-inline">Log in to comment.</p>
                                            )}
                                            {/* --- END LOGIN CHECK --- */}

                                            {/* Comment Loading Indicator */}
                                            {commentLoading && <div className="loading-spinner small-spinner"></div>}
                                            {/* Comment Error Message Area */}
                                            {!commentLoading && commentError && <p className="error-message comment-error">{commentError}</p>}
                                            {/* Comments List Area */}
                                            {!commentLoading && !commentError && (
                                                <div className="comments-list-inline">
                                                    {currentComments.length === 0 ? (
                                                        <p>No comments yet.</p>
                                                    ) : (
                                                        currentComments.map(comment => (
                                                            <CommentItemInline key={comment._id} comment={comment} currentUserId={user?._id} onDelete={handleDeleteComment} />
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div> /* End comment-section-inline */
                                    )}
                                    {/* --- End Comment Section --- */}
                                </div> // End article-card
                            );
                        })}
                    </div> // End articles-grid
                )}
            </main>

            <footer className="news-footer"> Powered by NewsAPI | Built with React & Node </footer>
        </div> // End news-page-container
    );
}

export default HomeNews;