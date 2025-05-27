// frontend/src/pages/ViewTheoriesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import defaultAvatar from '../assets/default-avatar.png'; // Import default avatar
import './ViewTheories.css';
// --- Import Icons (Example using simple text, replace with actual icons if available) ---
// import { FaArrowUp, FaArrowDown } from 'react-icons/fa'; 
// For simplicity, using text arrows: ▲ ▼

// --- Updated ReplyItem Component ---
const ReplyItem = ({ reply, theoryId, handleVote }) => {
    const { user, isLoggedIn } = useAuth(); // Get current user for vote status
    const authorName = reply.user?.username || 'Anonymous User';
    const avatarSrc = reply.user?.profilePicture || defaultAvatar;

    // Calculate net score and determine user's vote
    const upvotes = reply.upvotes?.length || 0;
    const downvotes = reply.downvotes?.length || 0;
    const score = upvotes - downvotes;
    const userVote = !user ? null : reply.upvotes?.includes(user._id) ? 'up' : reply.downvotes?.includes(user._id) ? 'down' : null;

    return (
        <div className="reply-item">
            <img src={avatarSrc} alt={`${authorName}'s avatar`} className="reply-avatar" />
            <div className="reply-content">
                <div className="reply-header">
                    <span className="reply-author">{authorName}</span>
                    <span className="reply-date">{new Date(reply.createdAt).toLocaleString()}</span>
                </div>
                <p className="reply-text">{reply.text}</p>
                {/* --- Add Vote Controls for Reply --- */}
                <div className="vote-controls">
                   {isLoggedIn && (
                     <>
                       <button 
                           onClick={() => handleVote(theoryId, reply._id, 'up')} 
                           className={`vote-btn upvote ${userVote === 'up' ? 'active' : ''}`}
                           title="Upvote"
                           aria-label="Upvote this reply"
                       >
                           ▲ {/* <FaArrowUp /> */}
                       </button>
                       <span className="vote-score">{score}</span>
                       <button 
                           onClick={() => handleVote(theoryId, reply._id, 'down')} 
                           className={`vote-btn downvote ${userVote === 'down' ? 'active' : ''}`}
                           title="Downvote"
                           aria-label="Downvote this reply"
                       >
                           ▼ {/* <FaArrowDown /> */}
                       </button>
                     </>
                   )}
                   {!isLoggedIn && <span className="vote-score">{score}</span> /* Show score if not logged in */}
                </div>
                 {/* --- End Vote Controls for Reply --- */}
            </div>
        </div>
    );
};

function ViewTheoriesPage() {
    const [searchParams] = useSearchParams();
    const [theories, setTheories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [articleUrl, setArticleUrl] = useState(''); // Decoded URL for display
    const [replyingToTheoryId, setReplyingToTheoryId] = useState(null); // Track which theory we're replying to
    const [replyText, setReplyText] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [votingStatus, setVotingStatus] = useState({}); // Track loading state for votes { [`${theoryId}-${replyId}`]: true/false }

    const { token, isLoggedIn, user } = useAuth(); // Get auth state and user info

    useEffect(() => {
        const encodedUrlFromQuery = searchParams.get('articleUrl');
        if (!encodedUrlFromQuery) {
            console.error("ViewTheoriesPage: articleUrl query parameter is missing!");
            setError("Article link missing from URL query.");
            setLoading(false);
            return;
        }
        try {
            const decodedUrlForDisplay = decodeURIComponent(encodedUrlFromQuery);
            setArticleUrl(decodedUrlForDisplay);
        } catch (err) {
            console.error("ViewTheoriesPage: Failed to decode article URL from query", err);
            setError("Invalid article link encoding in URL query.");
            setLoading(false);
        }
    }, [searchParams]);

    useEffect(() => {
        const encodedUrlFromQuery = searchParams.get('articleUrl');
        if (!encodedUrlFromQuery) {
            if (loading) setLoading(false);
            return;
        }

        const fetchTheories = async () => {
            setLoading(true);
            setError(null);
            setTheories([]);

            try {
                const response = await axios.get('/api/theories/article', {
                    params: { url: encodedUrlFromQuery }
                });
                console.log(`ViewTheoriesPage: Fetching theories for url: ${encodedUrlFromQuery}`); // Debug log

                if (response.data?.success && Array.isArray(response.data.data)) {
                    // Initialize vote counts if they don't exist (for older data)
                    const theoriesWithVotes = response.data.data.map(theory => ({
                        ...theory,
                        upvotes: theory.upvotes || [],
                        downvotes: theory.downvotes || [],
                        replies: (theory.replies || []).map(reply => ({
                            ...reply,
                            upvotes: reply.upvotes || [],
                            downvotes: reply.downvotes || [],
                        }))
                    }));
                    setTheories(theoriesWithVotes);
                    console.log(`ViewTheoriesPage: Fetched ${theoriesWithVotes.length} theories.`);
                } else {
                    console.warn("ViewTheoriesPage: API response not successful or data format incorrect", response.data);
                    throw new Error(response.data?.message || 'Failed to fetch theories.');
                }
            } catch (err) {
                console.error("ViewTheoriesPage: Error fetching theories:", err.response?.data || err.message);
                 if (err.response?.status === 404) {
                     setError(`Could not find the API endpoint. Check backend route: /api/theories/article`);
                 } else {
                     setError(err.response?.data?.message || err.message || 'Could not load theories.');
                 }
            } finally {
                setLoading(false);
            }
        };

        fetchTheories();

    }, [searchParams]); // Depend on searchParams

    // --- Handle Reply Submission ---
    const handleReplySubmit = async (theoryId) => {
        if (!isLoggedIn || !token || !replyText.trim()) {
            alert("Please log in and enter text to reply.");
            return;
        }
        setIsSubmittingReply(true);
        setError(null); // Clear previous errors

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(`/api/theories/${theoryId}/replies`, { text: replyText }, config);

            if (response.data?.success && response.data.data) {
                // Update the specific theory in the state with the new reply data
                // Ensure new reply also has vote arrays initialized
                const updatedTheoryData = {
                   ...response.data.data,
                   replies: (response.data.data.replies || []).map(reply => ({
                       ...reply,
                       upvotes: reply.upvotes || [],
                       downvotes: reply.downvotes || [],
                   }))
                };

                setTheories(prevTheories => prevTheories.map(theory =>
                    theory._id === theoryId ? updatedTheoryData : theory
                ));
                setReplyText(''); // Clear input
                setReplyingToTheoryId(null); // Close reply form
            } else {
                throw new Error(response.data?.message || 'Failed to submit reply.');
            }
        } catch (err) {
            console.error("Error submitting reply:", err.response?.data || err.message);
            setError(err.response?.data?.message || 'Could not submit reply.');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    // --- Toggle Reply Form ---
    const toggleReplyForm = (theoryId) => {
        if (replyingToTheoryId === theoryId) {
            setReplyingToTheoryId(null); // Close if already open
            setReplyText('');
        } else {
            setReplyingToTheoryId(theoryId); // Open for this theory
            setReplyText(''); // Clear text when opening
        }
    };

    // --- Handle Vote Submission ---
    const handleVote = async (theoryId, replyId, voteType) => {
        if (!isLoggedIn || !token || !user) {
            alert("Please log in to vote.");
            return;
        }

        const voteKey = replyId ? `${theoryId}-${replyId}` : `${theoryId}-theory`;
        if (votingStatus[voteKey]) return; // Prevent double clicks while voting

        setVotingStatus(prev => ({ ...prev, [voteKey]: true }));
        setError(null); // Clear previous errors

        const url = replyId
            ? `/api/theories/${theoryId}/replies/${replyId}/vote`
            : `/api/theories/${theoryId}/vote`;
        
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(url, { voteType }, config);

            // --- Update State Locally ---
            setTheories(prevTheories => prevTheories.map(theory => {
                if (theory._id !== theoryId) return theory; // Not the theory we're updating

                // --- Update Vote on Main Theory ---
                if (!replyId) {
                    const currentUpvotes = theory.upvotes || [];
                    const currentDownvotes = theory.downvotes || [];
                    let newUpvotes = [...currentUpvotes];
                    let newDownvotes = [...currentDownvotes];
                    const userId = user._id;

                    const upIndex = newUpvotes.indexOf(userId);
                    const downIndex = newDownvotes.indexOf(userId);

                    if (voteType === 'up') {
                        if (upIndex > -1) { // Already upvoted, remove it
                            newUpvotes.splice(upIndex, 1);
                        } else { // Not upvoted, add it
                            newUpvotes.push(userId);
                            if (downIndex > -1) { // Remove downvote if exists
                                newDownvotes.splice(downIndex, 1);
                            }
                        }
                    } else { // voteType === 'down'
                         if (downIndex > -1) { // Already downvoted, remove it
                            newDownvotes.splice(downIndex, 1);
                        } else { // Not downvoted, add it
                            newDownvotes.push(userId);
                             if (upIndex > -1) { // Remove upvote if exists
                                newUpvotes.splice(upIndex, 1);
                            }
                        }
                    }
                    return { ...theory, upvotes: newUpvotes, downvotes: newDownvotes };
                } 
                // --- Update Vote on a Reply ---
                else {
                     const updatedReplies = (theory.replies || []).map(reply => {
                         if (reply._id !== replyId) return reply; // Not the reply we're updating

                         const currentUpvotes = reply.upvotes || [];
                         const currentDownvotes = reply.downvotes || [];
                         let newUpvotes = [...currentUpvotes];
                         let newDownvotes = [...currentDownvotes];
                         const userId = user._id;

                         const upIndex = newUpvotes.indexOf(userId);
                         const downIndex = newDownvotes.indexOf(userId);

                         if (voteType === 'up') {
                             if (upIndex > -1) newUpvotes.splice(upIndex, 1);
                             else {
                                 newUpvotes.push(userId);
                                 if (downIndex > -1) newDownvotes.splice(downIndex, 1);
                             }
                         } else { // voteType === 'down'
                             if (downIndex > -1) newDownvotes.splice(downIndex, 1);
                             else {
                                 newDownvotes.push(userId);
                                 if (upIndex > -1) newUpvotes.splice(upIndex, 1);
                             }
                         }
                         return { ...reply, upvotes: newUpvotes, downvotes: newDownvotes };
                     });
                     return { ...theory, replies: updatedReplies };
                }
            }));
            // --- End State Update ---

        } catch (err) {
            console.error("Error submitting vote:", err.response?.data || err.message);
            setError(err.response?.data?.message || 'Could not submit vote.');
            // Optional: Revert state optimistic update on error if needed
        } finally {
            setVotingStatus(prev => ({ ...prev, [voteKey]: false }));
        }
    };

    // Render logic
    return (
        <div className="view-theories-page">
            {/* Context Section - can be styled further */} 
             {articleUrl && (
                <div className="context-link-area">
                    <span>Regarding article:</span>
                    <a href={articleUrl} target="_blank" rel="noopener noreferrer" title={articleUrl}>{articleUrl.substring(0, 80)}...</a>
                     <br/>
                    <Link 
                       to={`/write-theory/${encodeURIComponent(searchParams.get('articleUrl'))}`} 
                       className="write-link"
                    >
                        Write Your Own Theory?
                    </Link>
                </div>
             )}

            <h2>Theories & Discussion</h2>

            {loading && <p className="loading-message">Loading theories...</p>}
            {error && <p className="error-message">⚠️ Error: {error}</p>}

            {!loading && !error && theories.length === 0 && (
                <p className="no-theories-message">No theories submitted for this article yet.</p>
            )}

            {!loading && !error && theories.length > 0 && (
                <div className="theories-list">
                    {theories.map((theory) => {
                        const theoryAuthorName = theory.userId?.username || 'Anonymous User';
                        const theoryAvatarSrc = theory.userId?.profilePicture || defaultAvatar;

                        // Calculate net score and determine user's vote for the main theory
                        const theoryUpvotes = theory.upvotes?.length || 0;
                        const theoryDownvotes = theory.downvotes?.length || 0;
                        const theoryScore = theoryUpvotes - theoryDownvotes;
                        const theoryUserVote = !user ? null : theory.upvotes?.includes(user._id) ? 'up' : theory.downvotes?.includes(user._id) ? 'down' : null;
                        
                        return (
                            <div key={theory._id} className="theory-thread-item">
                                {/* --- Main Theory Post --- */} 
                                <div className="theory-post">
                                    <img src={theoryAvatarSrc} alt={`${theoryAuthorName}'s avatar`} className="theory-avatar" />
                                    <div className="theory-content-main">
                                        <div className="theory-header">
                                            <span className="theory-author">{theoryAuthorName}</span>
                                            <span className="theory-date">{new Date(theory.createdAt).toLocaleString()}</span>
                                        </div>
                                        {theory.title && <h3 className="theory-title">{theory.title}</h3>}
                                        <p className="theory-text">{theory.content}</p>

                                        {/* --- Add Vote Controls for Theory --- */}
                                        <div className="vote-controls">
                                            {isLoggedIn && (
                                              <>
                                                <button 
                                                    onClick={() => handleVote(theory._id, null, 'up')} 
                                                    className={`vote-btn upvote ${theoryUserVote === 'up' ? 'active' : ''}`}
                                                    disabled={votingStatus[`${theory._id}-theory`]}
                                                    title="Upvote"
                                                    aria-label="Upvote this theory"
                                                >
                                                    ▲ {/* <FaArrowUp /> */}
                                                </button>
                                                <span className="vote-score">{theoryScore}</span>
                                                <button 
                                                    onClick={() => handleVote(theory._id, null, 'down')} 
                                                    className={`vote-btn downvote ${theoryUserVote === 'down' ? 'active' : ''}`}
                                                    disabled={votingStatus[`${theory._id}-theory`]}
                                                     title="Downvote"
                                                     aria-label="Downvote this theory"
                                               >
                                                    ▼ {/* <FaArrowDown /> */}
                                                </button>
                                              </>
                                            )}
                                            {!isLoggedIn && <span className="vote-score">{theoryScore}</span> /* Show score if not logged in */}
                                             {/* --- Reply Button for the main theory --- */} 
                                            {isLoggedIn && (
                                                <button onClick={() => toggleReplyForm(theory._id)} className="toggle-reply-btn">
                                                    {replyingToTheoryId === theory._id ? 'Cancel' : 'Reply'}
                                                </button>
                                            )}
                                        </div>
                                         {/* --- End Vote Controls for Theory --- */}
                            </div>
                        </div>

                                {/* --- Reply Form (conditional) --- */} 
                                {isLoggedIn && replyingToTheoryId === theory._id && (
                                    <div className="reply-form-container">
                                        <form onSubmit={(e) => { e.preventDefault(); handleReplySubmit(theory._id); }} className="reply-form">
                                            <img src={user?.profilePicture || defaultAvatar} alt="Your avatar" className="reply-form-avatar" />
                                            <textarea
                                                placeholder={`Replying to ${theoryAuthorName}...`}
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                required
                                                rows={3}
                                                disabled={isSubmittingReply}
                                            />
                                            <button type="submit" disabled={isSubmittingReply || !replyText.trim()} className="submit-reply-btn">
                                                {isSubmittingReply ? 'Replying...' : 'Reply'}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* --- Replies List --- */} 
                                {theory.replies && theory.replies.length > 0 && (
                                    <div className="replies-list">
                                        {theory.replies.map(reply => (
                                            <ReplyItem 
                                                key={reply._id} 
                                                reply={reply} 
                                                theoryId={theory._id} // Pass theoryId down
                                                handleVote={handleVote} // Pass vote handler down
                                             />
                    ))}
                </div>
                                )}
                                {/* --- End Replies Section --- */}
                            </div> // End theory-thread-item
                        );
                    })}
                </div> // End theories-list
            )}
        </div> // End view-theories-page
    );
}

export default ViewTheoriesPage;