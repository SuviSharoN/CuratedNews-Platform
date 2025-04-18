// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Components
import Navbar from './Components/Navbar'; // <-- Import the new Navbar component
import RegisterPage from './Components/RegisterPage';
import LoginPage from './Components/LoginPage';
import HomePage from './Components/HomeNews'

// Import main CSS (which might still have body, container styles)
import './App.css';

function App() {
    return (
        <Router>
            {/* Overall layout container */}
            <div className="app-container">

                {/* === Use the Navbar Component === */}
                <Navbar />
                {/* ============================== */}

                {/* Page Content Area */}
                <main className="main-content">
                    <Routes>
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/top-headlines" element={<HomePage />} />
                        <Route path="/" element={<LoginPage />} /> {/* Default to login */}
                    </Routes>
                </main>

                {/* Optional Footer could go here */}
                {/* <footer className="app-footer">Footer Content</footer> */}

            </div>
        </Router>
    );
}

export default App;