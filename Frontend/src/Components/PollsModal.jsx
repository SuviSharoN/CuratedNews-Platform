import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './PollsModal.css'; // We will create this file next

const PollsModal = ({ articleUrl, isOpen, onClose }) => {
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [votingStatus, setVotingStatus] = useState({}); // Track voting state per poll
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newQuestion, setNewQuestion] = useState('');
    const [newOptions, setNewOptions] = useState(['', '']); // Start with 2 options
    const [createError, setCreateError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const { token, user: currentUser } = useAuth();

    // --- Fetch Polls --- 
    const fetchPolls = useCallback(async () => {
        if (!isOpen || !articleUrl) return;
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/api/polls?articleUrl=${encodeURIComponent(articleUrl)}`);
            if (response.data?.success) {
                setPolls(response.data.data);
            } else {
                throw new Error(response.data?.message || 'Failed to fetch polls');
            }
        } catch (err) {
            console.error("Error fetching polls:", err);
            setError(err.message || 'Could not load polls for this article.');
        } finally {
            setLoading(false);
        }
    }, [isOpen, articleUrl]);

    useEffect(() => {
        fetchPolls();
    }, [fetchPolls]);

    // --- Handle Voting ---
    const handleVote = async (pollId, optionIndex) => {
        if (!token) return alert("Please log in to vote.");
        if (votingStatus[pollId]) return; // Prevent double clicks

        setVotingStatus(prev => ({ ...prev, [pollId]: true }));
        setError(null); // Clear previous errors

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post(`/api/polls/${pollId}/vote`, { optionIndex }, config);

            if (response.data?.success) {
                // Update the specific poll in the state with new vote data
                setPolls(prevPolls => prevPolls.map(poll =>
                    poll._id === pollId ? response.data.data : poll
                ));
            } else {
                throw new Error(response.data?.message || 'Failed to register vote');
            }
        } catch (err) {
            console.error("Error voting:", err);
            setError(err.response?.data?.message || err.message || 'Could not submit your vote.');
        } finally {
            setVotingStatus(prev => ({ ...prev, [pollId]: false }));
        }
    };

    // --- Handle Poll Creation Form --- 
    const handleOptionChange = (index, value) => {
        const updatedOptions = [...newOptions];
        updatedOptions[index] = value;
        setNewOptions(updatedOptions);
    };

    const addOption = () => {
        if (newOptions.length < 5) { // Limit options if desired
            setNewOptions([...newOptions, '']);
        }
    };

    const removeOption = (index) => {
        if (newOptions.length > 2) {
            const updatedOptions = newOptions.filter((_, i) => i !== index);
            setNewOptions(updatedOptions);
        }
    };

    const handleCreatePoll = async (e) => {
        e.preventDefault();
        if (!token) return alert("Please log in to create polls.");
        
        const validOptions = newOptions.map(opt => opt.trim()).filter(Boolean);
        if (!newQuestion.trim() || validOptions.length < 2) {
            setCreateError('Please provide a question and at least two non-empty options.');
            return;
        }
        
        setCreateError('');
        setIsCreating(true);
        
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = { articleUrl, question: newQuestion.trim(), options: validOptions };
            const response = await axios.post('/api/polls', payload, config);

            if (response.data?.success) {
                setPolls(prevPolls => [response.data.data, ...prevPolls]); // Add new poll to top
                setShowCreateForm(false); // Hide form
                setNewQuestion(''); // Reset form
                setNewOptions(['', '']);
            } else {
                throw new Error(response.data?.message || 'Failed to create poll');
            }
        } catch (err) {
             console.error("Error creating poll:", err);
             setCreateError(err.response?.data?.message || err.message || 'Could not create poll.');
        } finally {
            setIsCreating(false);
        }
    };

    // --- Helper to check if user has voted ---
    const hasUserVoted = (poll) => {
        return poll.voters?.includes(currentUser?.id);
    };

    const calculatePercentage = (votes, totalVotes) => {
        return totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;
    };

    if (!isOpen) return null;

    return (
        <div className="polls-modal-overlay" onClick={onClose}> {/* Close on overlay click */} 
            <div className="polls-modal-content" onClick={e => e.stopPropagation()}> {/* Prevent closing when clicking content */} 
                <button className="polls-modal-close" onClick={onClose}>&times;</button>
                <h2>Polls for this Article</h2>

                {error && <div className="polls-error-message">Error: {error}</div>}

                {/* --- Create Poll Button/Form --- */} 
                {!showCreateForm && (
                    <button onClick={() => setShowCreateForm(true)} className="create-poll-toggle-button">
                        Create New Poll
                    </button>
                )}

                {showCreateForm && (
                    <form onSubmit={handleCreatePoll} className="create-poll-form">
                        <h3>Create a New Poll</h3>
                        <div className="form-group">
                            <label htmlFor="poll-question">Question:</label>
                            <input
                                id="poll-question"
                                type="text"
                                value={newQuestion}
                                onChange={e => setNewQuestion(e.target.value)}
                                placeholder="Ask something..."
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Options:</label>
                            {newOptions.map((option, index) => (
                                <div key={index} className="option-input-group">
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={e => handleOptionChange(index, e.target.value)}
                                        placeholder={`Option ${index + 1}`}
                                        required
                                    />
                                    {newOptions.length > 2 && (
                                        <button type="button" onClick={() => removeOption(index)} className="remove-option-btn">&times;</button>
                                    )}
                                </div>
                            ))}
                            {newOptions.length < 5 && (
                                <button type="button" onClick={addOption} className="add-option-btn">+ Add Option</button>
                            )}
                        </div>
                         {createError && <div className="polls-error-message">{createError}</div>}
                        <div className="form-actions">
                            <button type="submit" disabled={isCreating} className="submit-poll-btn">
                                {isCreating ? 'Creating...' : 'Create Poll'}
                            </button>
                            <button type="button" onClick={() => setShowCreateForm(false)} className="cancel-poll-btn">
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {/* --- Display Existing Polls --- */} 
                <div className="polls-list">
                    {loading && <div>Loading polls...</div>}
                    {!loading && polls.length === 0 && !error && !showCreateForm && (
                        <div>No polls yet for this article. Be the first to create one!</div>
                    )}
                    {!loading && polls.map(poll => {
                        const userVoted = hasUserVoted(poll);
                        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
                        
                        return (
                            <div key={poll._id} className={`poll-item ${userVoted ? 'voted' : ''}`}>
                                <p className="poll-question">{poll.question}</p>
                                <p className="poll-creator">Created by: {poll.createdBy?.username || 'Unknown'}</p>
                                <ul className="poll-options">
                                    {poll.options.map((option, index) => {
                                         const percentage = calculatePercentage(option.votes, totalVotes);
                                         return (
                                            <li key={option._id || index}>
                                                {userVoted ? (
                                                    // Show results if user voted
                                                    <div className="poll-result">
                                                        <span className="option-text">{option.text}</span>
                                                        <div className="result-bar-container">
                                                            <div className="result-bar" style={{ width: `${percentage}%` }}></div>
                                                        </div>
                                                        <span className="vote-info">{option.votes} votes ({percentage}%)</span>
                                                    </div>
                                                ) : (
                                                    // Show voting button if user hasn't voted
                                                    <button
                                                        onClick={() => handleVote(poll._id, index)}
                                                        disabled={votingStatus[poll._id]}
                                                        className="vote-button"
                                                    >
                                                        {option.text}
                                                    </button>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                                {userVoted && <p className="total-votes">Total Votes: {totalVotes}</p>}
                                {!userVoted && votingStatus[poll._id] && <span>Voting...</span>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PollsModal; 