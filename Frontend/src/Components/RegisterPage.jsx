// frontend/src/components/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AuthCommon.css';
// Add CSS import: import './RegisterPage.css';

const API_URL = 'http://localhost:5000/api/auth'; // Or similar // Your backend URL

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(''); // To display success/error
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent page reload
        setMessage(''); // Clear previous message
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json(); // Always parse JSON response

            setMessage(data.message); // Display message from backend

            if (response.ok) { // Check if registration was successful (status 2xx)
                console.log('Registration successful');
                navigate('/login');
                setUsername(''); // Optionally clear form on success
                setPassword('');
                // Maybe redirect to login page after a delay
            } else {
                console.error('Registration failed');
            }

        } catch (error) {
            console.error('Network or server error:', error);
            setMessage('Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container"> {/* Add CSS class */}
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="reg-username">Username:</label>
                    <input
                        type="text"
                        id="reg-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="reg-password">Password:</label>
                    <input
                        type="password"
                        id="reg-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength="6"
                        disabled={isLoading}
                    />
                </div>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Registering...' : 'Register'}
                </button>
            </form>
            {message && <p className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>{message}</p>}
            {/* Add Link to Login Page */}
        </div>
    );
}

export default RegisterPage;