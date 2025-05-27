// frontend/src/components/Navbar.jsx
import React from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'; // Import useNavigate and useLocation
import { useAuth } from '../context/AuthContext'; // <--- Import useAuth
import './Navbar.css'; // Import the specific CSS for this component
import defaultAvatar from '../assets/default-avatar.png';

function Navbar() {
  const { isLoggedIn, logout, user } = useAuth(); // <--- Get auth state and logout function
  const navigate = useNavigate(); // <--- Hook for navigation
  const location = useLocation(); // Get current location
  const showProfileButton = isLoggedIn && !['/login', '/register'].includes(location.pathname);

  const handleLogout = () => {
    logout(); // Call logout from context
    navigate('/login'); // Redirect to login after logout
  };

  return (
    <nav className="main-navbar">
      <div className="navbar-content">
        {/* Brand Link: Point to /home if logged in, otherwise /login (or /) */}
        <Link to={isLoggedIn ? "/top-headlines" : "/login"} className="navbar-brand">
          Curated News Platform
        </Link>

        {/* Navigation Links */}
        <ul className="navbar-links">
          {isLoggedIn ? (
            // --- Links/Buttons when LOGGED IN ---
            <>
              <li>
                {/* Link to your main news page */}
                <NavLink
                  to="/top-headlines"
                  className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                >
                  Home
                </NavLink>
              </li>
              <li>
                {/* --- ADDED LINK --- */}
                <NavLink
                  to="/liked-articles"
                  className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                >
                  My Liked Articles
                </NavLink>
              </li>
              <li>
                {/* --- ADDED LOGOUT BUTTON --- */}
                <button onClick={handleLogout} className="nav-link logout-button">
                  Logout
                </button>
              </li>
            </>
          ) : (
            // --- Links when LOGGED OUT ---
            <>
              <li>
                <NavLink
                  to="/register"
                  className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                >
                  Register
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/login"
                  className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                >
                  Login
                </NavLink>
              </li>
            </>
          )}
        </ul>
        <div className="navbar-right">
          {showProfileButton && (
            <Link to="/profile" className="profile-avatar-link" title="Profile">
              <img
                src={user?.profilePicture || defaultAvatar}
                alt="Profile"
                className="navbar-avatar"
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #ccc' }}
              />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;