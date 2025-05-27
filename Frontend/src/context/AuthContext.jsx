// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('token')); // Initialize from localStorage
    const [user, setUser] = useState(() => {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    }); // Initialize user info

    const login = (newToken, newUserInfo) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
        setToken(newToken);
        setUser(newUserInfo);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        setToken(null);
        setUser(null);
        // Maybe redirect to login page here using useNavigate if needed outside component
    };

    // Optional: Listen for storage changes in other tabs (advanced)
    useEffect(() => {
        const handleStorageChange = () => {
            setToken(localStorage.getItem('token'));
            const userInfo = localStorage.getItem('userInfo');
            setUser(userInfo ? JSON.parse(userInfo) : null);
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);


    const value = { token, user, isLoggedIn: !!token, login, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context easily
export const useAuth = () => {
    return useContext(AuthContext);
};