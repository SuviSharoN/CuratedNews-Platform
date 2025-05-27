// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Components
import Navbar from './Components/Navbar'; // <-- Import the new Navbar component
import RegisterPage from './Components/RegisterPage';
import LoginPage from './Components/LoginPage';
import HomePage from './Components/HomeNews'
import LikedArticlesPage from './Components/LikedArticlesPage';
import WriteTheoryPage from './Components/WriteTheoryPage';
import ViewTheoriesPage from './Components/ViewTheoryPage';
import Interests from './Components/Interests';
import Profile from './Components/Profile';
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
                        <Route path="/interests" element={<Interests />} />
                        <Route path="/liked-articles" element={<LikedArticlesPage />}/>
                        <Route path="/top-headlines" element={<HomePage />} />
                        <Route path="/write-theory/:encodedArticleUrl" element={<WriteTheoryPage />}/>
                        <Route path="/view-theories" element={<ViewTheoriesPage />} />
                        <Route path="/profile" element={<Profile />} />
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