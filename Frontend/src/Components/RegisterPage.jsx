// frontend/src/components/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AuthCommon.css';
// Add CSS import if you create specific styles for RegisterPage:
// import './RegisterPage.css';

const API_URL = 'http://localhost:5000/api/auth'; // Your backend URL

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(''); // <-- Add state for email
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
                // Include email in the request body
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json(); // Always parse JSON response

            setMessage(data.message); // Display message from backend

            if (response.ok) { // Check if registration was successful (status 2xx)
                console.log('Registration successful');
                // Optionally clear form on success
                setUsername('');
                setEmail(''); // <-- Clear email field
                setPassword('');
                // Redirect to login page after a short delay or immediately
                setTimeout(() => navigate('/login'), 1500); // Example delay
                // navigate('/login'); // Or redirect immediately
            } else {
                console.error('Registration failed:', data.message); // Log the specific error
            }

        } catch (error) {
            console.error('Network or server error during registration:', error);
            setMessage('Registration failed due to a network or server issue. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
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
                        autoComplete="username" // Add autocomplete hint
                    />
                </div>
                {/* --- Add Email Input Field --- */}
                <div className="form-group">
                    <label htmlFor="reg-email">Email:</label>
                    <input
                        type="email" // Use type="email" for basic validation
                        id="reg-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="email" // Add autocomplete hint
                    />
                </div>
                {/* --- End Email Input Field --- */}
                <div className="form-group">
                    <label htmlFor="reg-password">Password:</label>
                    <input
                        type="password"
                        id="reg-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength="6" // Keep or adjust minLength as needed
                        disabled={isLoading}
                        autoComplete="new-password" // Hint for password managers
                    />
                </div>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Registering...' : 'Register'}
                </button>
            </form>
            {message && <p className={`message ${message.toLowerCase().includes('success') ? 'success' : 'error'}`}>{message}</p>}
            <p className="auth-switch-link">
                Already have an account? <Link to="/login">Login here</Link>
            </p>
        </div>
    );
}

export default RegisterPage;