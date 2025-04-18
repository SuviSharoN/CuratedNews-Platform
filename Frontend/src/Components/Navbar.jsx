// frontend/src/components/Navbar.jsx
import React from 'react';
// Using NavLink for active styling
import { NavLink, Link } from 'react-router-dom';
// Import the specific CSS for this component
import './Navbar.css';

function Navbar() {
  return (
    <nav className="main-navbar">
      <div className="navbar-content">
        {/* Optional: Brand/Logo Link */}
        <Link to="/" className="navbar-brand">Curated News Platform</Link> {/* Link brand to homepage (e.g., login page by default) */}

        {/* Navigation Links */}
        <ul className="navbar-links">
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
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;