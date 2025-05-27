// src/pages/LoginPage.jsx (Combined and Improved)

import React, { useState } from 'react';
import axios from 'axios'; // Using axios
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import './AuthCommon.css'; // Import shared CSS

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(''); // State for user feedback messages
    const [isLoading, setIsLoading] = useState(false); // State for loading indicator
    const { login } = useAuth(); // Get the login function from context
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages
        setIsLoading(true); // Start loading indicator

        try {
            // Using axios - assumes Vite proxy forwards /api to backend
            // If no proxy, use: 'http://localhost:5000/api/auth/login'
            const response = await axios.post('/api/auth/login', {
                 username: username.toLowerCase(), // Send lowercase username consistent with backend check
                 password
            });

            // Check backend's success flag and data presence
            if (response.data && response.data.success) {
                setMessage(response.data.message || 'Login successful!'); // Show success message
                console.log('Login successful via context!');

                // Use the login function from context to update global state and localStorage
                login(response.data.token, response.data.user);

                // Navigate to the main news page after successful login
                navigate('/top-headlines'); // Or your desired route

            } else {
                // Handle cases where backend indicates failure (e.g., invalid credentials)
                setMessage(response.data.message || 'Login failed. Please check your credentials.');
                console.error('Login failed:', response.data.message);
            }
        } catch (err) {
             console.error("Login Request Error:", err);
             // Set message based on backend error or provide a generic one
             setMessage(err.response?.data?.message || 'Login failed. Server error or network issue.');
        } finally {
            setIsLoading(false); // Stop loading indicator regardless of outcome
        }
    };

    return (
        <div className="auth-container"> {/* Use common container class */}
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="login-username">Username:</label>
                    <input
                        type="text"
                        id="login-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isLoading} // Disable input while loading
                        autoComplete="username"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="login-password">Password:</label>
                    <input
                        type="password"
                        id="login-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading} // Disable input while loading
                        autoComplete="current-password"
                    />
                </div>
                <button type="submit" disabled={isLoading}>
                   {/* Show different text while loading */}
                   {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>

            {/* Display feedback messages */}
            {message && (
                <p className={`message ${message.toLowerCase().includes('successful') ? 'success' : 'error'}`}>
                    {message}
                </p>
             )}

             {/* Link to Register Page */}
             <div className="auth-switch-link">
                 Don't have an account? <Link to="/register">Register here</Link>
             </div>
        </div>
    );
}

export default LoginPage;