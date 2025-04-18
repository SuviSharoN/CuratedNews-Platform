// frontend/src/components/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AuthCommon.css';
// Add CSS import: import './LoginPage.css';

const API_URL = 'http://localhost:5000/api/auth'; // Or similar// Your backend URL

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            setMessage(data.message); // Display message directly from backend

            if (response.ok && data.success) { // Check status and success flag
                console.log('Login successful!');
                navigate('/top-headlines');
                // **IMPORTANT:** In a real app, you would receive a token here,
                // save it (localStorage/context), and redirect the user.
                // For now, we just show the message.
            } else {
                 console.error('Login failed');
            }

        } catch (error) {
            console.error('Network or server error:', error);
            setMessage('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container"> {/* Add CSS class */}
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
                        disabled={isLoading}
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
                        disabled={isLoading}
                    />
                </div>
                <button type="submit" disabled={isLoading}>
                   {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            {message && <p className={`message ${message.includes('Successfully') ? 'success' : 'error'}`}>{message}</p>}
             {/* Add Link to Register Page */}
        </div>
    );
}

export default LoginPage;