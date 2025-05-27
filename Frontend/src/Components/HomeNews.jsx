// src/components/HomeNews.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Keep this import
import { useAuth } from '../context/AuthContext';
import PollsModal from './PollsModal'; // Import the new PollsModal component
import './HomeNews.css';
import './Sidebar.css';
import KolaiImage from '../assets/kolai.jpg'; // Import the custom image

// Placeholder image
const placeholderImage = "https://media.istockphoto.com/id/1222357475/vector/image-preview-icon-picture-placeholder-for-website-or-ui-ux-design-vector-illustration.jpg?s=1024x1024&w=is&k=20&c=mZ2wtnhxBA20wCs2sNhAClC-hSFOkqAJAP3GqiSBIlk=";

// --- Define Available News Categories ---
const newsCategories = [
    { key: 'general', name: 'Top Headlines' },
    { key: 'business', name: 'Business' },
    { key: 'entertainment', name: 'Entertainment' },
    { key: 'health', name: 'Health' },
    { key: 'science', name: 'Science' },
    { key: 'sports', name: 'Sports' },
    { key: 'technology', name: 'Technology' },
];

function HomeNews() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [likingStatus, setLikingStatus] = useState({});
    const [selectedCategory, setSelectedCategory] = useState('general');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPollsModalOpen, setIsPollsModalOpen] = useState(false);
    const [selectedArticleForPolls, setSelectedArticleForPolls] = useState(null);
    const [speakingArticleUrl, setSpeakingArticleUrl] = useState(null); // Track currently speaking article
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);
    const [availableVoices, setAvailableVoices] = useState([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState(''); // Store the URI of the selected voice

    const { token, isLoggedIn } = useAuth();
    // console.log("HomeNews Auth Status:", { isLoggedIn, tokenExists: !!token });

    // --- Voice List Handling ---
    useEffect(() => {
        if ('speechSynthesis' in window) {
            setIsSpeechSupported(true);

            const populateVoiceList = () => {
                const voices = window.speechSynthesis.getVoices();
                setAvailableVoices(voices);
                // Optionally set a default voice, e.g., the first English voice
                // if (!selectedVoiceURI && voices.length > 0) {
                //    const defaultVoice = voices.find(v => v.lang.startsWith('en'));
                //    if (defaultVoice) setSelectedVoiceURI(defaultVoice.voiceURI);
                // }
            };

            // Voices might load asynchronously
            populateVoiceList();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = populateVoiceList;
            }
        } else {
            console.warn("Browser does not support Speech Synthesis.");
        }
        // Cleanup speech on component unmount
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                // Remove the event listener if it was set
                if (window.speechSynthesis.onvoiceschanged !== undefined) {
                     window.speechSynthesis.onvoiceschanged = null;
                }
            }
        };
    }, []); // Run only on mount

    // --- Fetching News and Like Status ---
    const fetchNewsAndLikes = useCallback(async (category) => {
        setLoading(true);
        setError(null);
        setArticles([]);
        setLikingStatus({});
        // console.log(`fetchNewsAndLikes triggered for category: ${category}...`);

        try {
            let apiUrl = '/api/news/top-headlines';
            if (category && category !== 'general') {
                 apiUrl += `?category=${category}`;
            }
            // console.log("Fetching headlines from:", apiUrl);


            const headlinesResponse = await axios.get(apiUrl);
            let fetchedArticles = [];

            if (headlinesResponse.data && headlinesResponse.data.status === 'ok' && Array.isArray(headlinesResponse.data.articles)) {
                fetchedArticles = headlinesResponse.data.articles.map(article => ({
                    ...article,
                    likeCount: 0,
                    likedByUser: false,
                }));
                // console.log(`Fetched ${fetchedArticles.length} headlines for ${category} successfully.`);
            } else {
                console.warn("Headlines response format incorrect or status not ok:", headlinesResponse.data);
                setError(`Could not fetch headlines for ${category}.`);
                setLoading(false);
                return;
            }

            if (fetchedArticles.length === 0) {
                // console.log(`No headlines found for ${category}.`);
                setArticles([]);
                setLoading(false);
                return;
            }

            // --- Fetch Like Status ---
            if (isLoggedIn && token && fetchedArticles.length > 0) {
                // console.log("User logged in. Fetching batch like status...");
                const articleUrls = fetchedArticles.map(article => article.url).filter(Boolean);

                if (articleUrls.length > 0) {
                    try {
                        const config = { headers: { Authorization: `Bearer ${token}` } };
                        const likesResponse = await axios.post('/api/likes/batch-status', { urls: articleUrls }, config);

                        if (likesResponse.data?.success && typeof likesResponse.data.data === 'object') {
                            const likeStatusMap = likesResponse.data.data;
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
                            // console.warn("Batch like status response format incorrect:", likesResponse.data);
                        }
                    } catch (likesError) {
                        if (likesError.response?.status === 401) {
                            // console.warn("Unauthorized fetching like status (token issue?).");
                        } else {
                            // console.error("Error fetching initial like status:", likesError.response?.data || likesError.message);
                        }
                    }
                } else {
                    // console.log("No valid article URLs to check for likes.");
                }
            } else {
                // console.log("Skipping like status fetch (not logged in or no articles).");
            }

            // --- INSERT CUSTOM ARTICLE ---
            // Define your custom article details here
            // const myCustomArticle = {
            //     url: 'my-news', // Unique identifier from user
            //     title: 'கணவன் தன் மனைவியை கல்லால் எறிந்து கொன்றான்',
            //     description: 'கணவன் தன் அன்பு மனைவியைக் கொல்கிறான்.போதைப்பொருட்களின் விளைவுகள் - > "இந்த சமூகத்தில் என்ன தவறு நடந்துவிட்டது!?"',
            //     urlToImage: KolaiImage, // Use the imported image variable
            //     source: { name: 'Thanthi News' }, // Source from user
            //     publishedAt: new Date().toISOString(), // Keep current time or specify
            //     likeCount: 0,
            //     likedByUser: false,
            //     isCustom: true // Optional flag
            // };

            // Insert the custom article at index 1 (second position)
            // Ensure fetchedArticles exists and has items before splicing
            if (fetchedArticles && fetchedArticles.length > 0) {
                 fetchedArticles.splice(1, 0);
            } else if (fetchedArticles) {
                // If fetchedArticles is empty, just add the custom one
               
            }
             // --- END INSERT CUSTOM ARTICLE ---


            setArticles(fetchedArticles);

        } catch (err) {
            console.error(`Error fetching news for category ${category}:`, err.response?.data || err.message);
            setError(err.response?.data?.message || err.message || `Failed to load news for ${category}.`);
            setArticles([]);
        } finally {
            setLoading(false);
            // console.log("Fetching complete.");
        }
    }, [isLoggedIn, token]);

    // Effect to run fetch on category change or initial load
    useEffect(() => {
        fetchNewsAndLikes(selectedCategory);
    }, [selectedCategory, fetchNewsAndLikes]);

    // --- Handle Category Selection ---
    const handleCategoryChange = (newCategoryKey) => {
        if (newCategoryKey !== selectedCategory) {
            // console.log("Category changed to:", newCategoryKey);
            setSelectedCategory(newCategoryKey);
        }
        setIsSidebarOpen(false);
    };

    // --- Handle Like Button Click ---
    const handleLike = async (articleToLike) => {
        const { url, title, description, source, urlToImage, publishedAt } = articleToLike;
        if (!url) { console.error("Cannot like article without a URL."); return; }
        if (!isLoggedIn || !token) { alert("Please log in to like articles."); return; }
        if (likingStatus[url]) return;

        setLikingStatus(prev => ({ ...prev, [url]: true }));
        try {
            const payload = { url, title: title || "No Title Provided", description, sourceName: source?.name, urlToImage, publishedAt };
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.post('/api/likes/toggle', payload, config);

            if (response.data?.success && response.data.data) {
                const { likedByUser, likeCount } = response.data.data;
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

    // --- Other Handlers ---
    const handleImageError = (e) => { e.target.src = placeholderImage; };

    // --- Enhanced Share Handler ---
    const handleShare = async (article) => { // Pass the whole article object
        const shareUrl = article?.url;
        const shareTitle = article?.title || "Check out this news article";
        const shareText = article?.description || "Interesting news story";

        if (!shareUrl) {
            console.error("Cannot share: Article URL is missing.");
            alert("Cannot share this article.");
            return;
        }

        if (navigator.share) { // Check if Web Share API is supported
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
                // console.log('Article shared successfully');
            } catch (err) {
                // Handle errors (e.g., user cancels share dialog)
                if (err.name !== 'AbortError') {
                    console.error('Error using Web Share API:', err);
                    // Fallback to copying link if native share fails unexpectedly
                    copyLinkFallback(shareUrl);
                }
            }
        } else {
            // Fallback for browsers that don't support Web Share API
            copyLinkFallback(shareUrl);
        }
    };

    // Helper function for fallback copying
    const copyLinkFallback = (urlToCopy) => {
        navigator.clipboard.writeText(urlToCopy)
            .then(() => alert("Article link copied to clipboard!"))
            .catch(err => {
                console.error("Failed to copy link: ", err);
                alert("Could not copy link.");
            });
    };

    // --- Handle Opening Polls Modal ---
    const handleOpenPolls = (article) => {
        if (!isLoggedIn) {
            alert('Please log in to view or create polls.');
            return;
        }
        setSelectedArticleForPolls(article);
        setIsPollsModalOpen(true);
    };

    // --- Read Aloud Handler (Updated) ---
    const handleReadAloud = useCallback((article) => {
        if (!isSpeechSupported || !article) return;

        const synth = window.speechSynthesis;
        const textToSpeak = `${article.title || 'No title'}. ${article.description || 'No description available.'}`;

        // Stop current speech if any
        if (synth.speaking) {
            synth.cancel();
            if (speakingArticleUrl === article.url) {
                setSpeakingArticleUrl(null);
                return;
            }
            setSpeakingArticleUrl(null);
        }

        // Speak new utterance
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'en-US'; // Default lang

        // --- Apply Selected Voice ---
        if (selectedVoiceURI) {
            const selectedVoice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                // Override lang if voice has a specific language
                utterance.lang = selectedVoice.lang; 
            } else {
                console.warn(`Selected voice URI "${selectedVoiceURI}" not found.`);
            }
        }
        // --- End Apply Selected Voice ---

        // Cleanup state when speech ends naturally or errors
        utterance.onend = () => {
            setSpeakingArticleUrl(null);
        };
        utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance Error', event);
            setSpeakingArticleUrl(null);
        };

        // Speak
        synth.speak(utterance);
        setSpeakingArticleUrl(article.url);

    // Update dependencies to include selectedVoiceURI and availableVoices
    }, [isSpeechSupported, speakingArticleUrl, selectedVoiceURI, availableVoices]); 

    // --- Render ---
    return (
        <div className={`news-page-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>

            {/* --- Voice Selection Dropdown (Moved Here) --- */}
            {isSpeechSupported && availableVoices.length > 0 && (
                <div className="voice-selection-container">
                    <label htmlFor="voice-select">Reading Voice: </label>
                    <select
                        id="voice-select"
                        value={selectedVoiceURI}
                        onChange={e => setSelectedVoiceURI(e.target.value)}
                        className="voice-select-dropdown"
                    >
                        <option value="">Browser Default</option>
                        {availableVoices.map((voice) => (
                            <option key={voice.voiceURI} value={voice.voiceURI}>
                                {voice.name} ({voice.lang})
                            </option>
                        ))}
                    </select>
                </div>
            )}
            {/* --- End Voice Selection Dropdown --- */}

            <button
                className="sidebar-toggle-button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label="Toggle news categories"
                aria-expanded={isSidebarOpen}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>

            <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`} aria-label="News Categories">
                 <h2 className="sidebar-title">Categories</h2>
                 <ul>
                     {newsCategories.map((category) => (
                         <li key={category.key}>
                             <button
                                 className={`category-button ${selectedCategory === category.key ? 'active' : ''}`}
                                 onClick={() => handleCategoryChange(category.key)}
                             >
                                 {category.name}
                             </button>
                         </li>
                     ))}
                 </ul>
                 <button className="sidebar-close-button" onClick={() => setIsSidebarOpen(false)}>
                     Close
                 </button>
            </nav>
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}


            <div className="main-content-area">
                <header className="news-header">
                    <h1>{newsCategories.find(c => c.key === selectedCategory)?.name || 'News Headlines'}</h1>
                    <p>Your Daily Dose of News</p>
                    <div className="search-filter-container">
                        <input
                            type="text"
                            className="news-search-input"
                            placeholder="Search articles by title or description..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ marginTop: '1rem', padding: '0.5rem', width: '100%', maxWidth: 400 }}
                        />
                    </div>
                </header>

                <main className="articles-display-area">
                    {loading && <div className="loading-message">Loading articles...</div>}
                    {!loading && error && (
                        <div className="error-message">
                            <p>⚠️ Could not load news:</p>
                            <p>{error}</p>
                        </div>
                    )}
                    {!loading && !error && articles.length === 0 && (
                        <div className="no-articles-message">
                            No articles found for this category.
                        </div>
                    )}
                    {!loading && !error && articles.length > 0 && (
                        <div className="articles-grid">
                            {articles
                                .filter(article => {
                                    const q = searchQuery.toLowerCase();
                                    return (
                                        article.title?.toLowerCase().includes(q) ||
                                        article.description?.toLowerCase().includes(q)
                                    );
                                })
                                .map((article) => {
                                if (!article?.url) return null;
                                    const isCurrentlySpeaking = speakingArticleUrl === article.url;
                                    const isAnySpeaking = speakingArticleUrl !== null;

                                return (
                                    <div key={article.url} className="article-card">
                                            <div className="article-image-container">
                                        <img
                                            src={article.urlToImage || placeholderImage}
                                            alt={article.title || 'Article image'}
                                            className="article-image"
                                            onError={handleImageError}
                                            loading="lazy"
                                        />
                                                <button
                                                    className={`action-button like-button ${article.likedByUser ? 'liked-active' : ''} top-left-action`}
                                                    onClick={() => handleLike(article)}
                                                    disabled={likingStatus[article.url] || !isLoggedIn}
                                                    title={!isLoggedIn ? "Please log in to like" : (article.likedByUser ? 'Unlike' : 'Like')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="like-icon w-5 h-5"> <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /> </svg>
                                                    <span>{likingStatus[article.url] ? '' : (article.likeCount ?? 0)}</span>
                                                </button>
                                                <button 
                                                    className="action-button share-button top-right-action" 
                                                    onClick={() => handleShare(article)} // Pass the whole article object
                                                    title="Share article"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                                                </button>
                                            </div>
                                            <div className="article-content">
                                                <h2 className="article-title">{article.title || "No Title Provided"}</h2>
                                                <p className="article-description">{article.description || "No description available."}</p>
                                                <div className="article-metadata">
                                                    <span className="source-name" title={article.source?.name || 'Unknown'}>
                                                        Source: {article.source?.name || 'Unknown'}
                                                    </span>
                                                    <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'N/A'}</span>
                                                </div>
                                                <div className="article-actions">
                                                <a href={article.url} target="_blank" rel="noopener noreferrer" className="action-button read-more-button" title="Read full article on source">
                                                    <span>Read More</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                </a>
                                                    <button
                                                        className="action-button polls-button"
                                                        onClick={() => handleOpenPolls(article)}
                                                        title="View/Create Polls"
                                                        style={{ backgroundColor: '#673ab7', borderColor: '#b39ddb' }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25c.621 0 1.125.504 1.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125h-1.5c-.621 0-1.125-.504-1.125-1.125v-3.375c0-.621.504-1.125 1.125-1.125h1.5zM17.25 9.75l-1.612 4.836a.75.75 0 01-1.451-.386l-.71-2.13a.75.75 0 00-1.342-.503L11.25 15M17.25 9.75h1.875c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-1.875m0-4.5h.008v.008h-.008v-.008z" />
                                                        </svg>
                                                        <span>Polls</span>
                                                    </button>
                                                <Link
                                                    to={`/write-theory/${encodeURIComponent(article.url)}`}
                                                    className="action-button write-blog-button"
                                                    title="Write your blog about this article"
                                                    style={{ display: isLoggedIn ? 'inline-flex' : 'none' }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                                                    <span>Post Your Takes</span>
                                                </Link>
                                                <Link
                                                    to={`/view-theories?articleUrl=${encodeURIComponent(article.url)}`}
                                                    className="action-button view-blogs-button"
                                                    title="View blogs about this article"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
                                                    <span>Read Theories</span>
                                                </Link>

                                                    {/* --- Read Aloud Button Logic --- */}
                                                    {isSpeechSupported && (
                                                        <button
                                                            className={`action-button read-aloud-button ${isCurrentlySpeaking ? 'speaking' : ''}`}
                                                            onClick={() => handleReadAloud(article)}
                                                            title={isCurrentlySpeaking ? "Stop Reading" : (isAnySpeaking ? "Wait for current speech to finish" : "Read Aloud")}
                                                            // Disable button if speech is supported BUT another article is speaking
                                                            disabled={isAnySpeaking && !isCurrentlySpeaking} 
                                                            style={isCurrentlySpeaking ? { backgroundColor: '#ef4444' } : { backgroundColor: '#8b5cf6' }} // Style remains based on current speaking state
                                                        >
                                                            {isCurrentlySpeaking ? (
                                                                // Stop Icon
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" /></svg>
                                                            ) : (
                                                                // Speak Icon
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                                                            )}
                                                            <span>{isCurrentlySpeaking ? 'Stop' : 'Read'}</span>
                                                        </button>
                                                    )}
                                                    {/* --- End Read Aloud Button --- */}
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
            </div> {/* End of main-content-area */}

            {/* --- Polls Modal --- */}
            {isPollsModalOpen && selectedArticleForPolls && (
                <PollsModal
                    articleUrl={selectedArticleForPolls.url}
                    isOpen={isPollsModalOpen}
                    onClose={() => {
                        setIsPollsModalOpen(false);
                        setSelectedArticleForPolls(null);
                    }}
                />
            )}

        </div> // End of news-page-wrapper
    );
}

export default HomeNews;