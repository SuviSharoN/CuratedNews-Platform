import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Interests.css';

const Interests = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [error, setError] = useState('');
  
  const interests = [
    'Technology', 'Business', 'Science', 'Health', 'Entertainment',
    'Sports', 'Politics', 'Environment', 'Education', 'World News'
  ];

  const handleInterestClick = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(item => item !== interest));
    } else if (selectedInterests.length < 4) {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!user || !user.email || !user.id) {
        setError('User information not found');
        return;
      }

      const response = await axios.post('http://localhost:5000/api/interests', 
        { 
          interests: selectedInterests,
          email: user.email,
          userId: user.id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        navigate('/');
      } else {
        setError('Failed to save interests');
      }
    } catch (error) {
      console.error('Error saving interests:', error);
      setError(error.response?.data?.message || 'Error saving interests');
    }
  };

  return (
    <div className="interests-container">
      <h1>Select Your Interests</h1>
      <p className="subtitle">Choose up to 4 topics you'd like to follow</p>
      <div className="bubbles-container">
        {interests.map((interest, index) => (
          <div
            key={index}
            className={`interest-bubble ${selectedInterests.includes(interest) ? 'selected' : ''}`}
            onClick={() => handleInterestClick(interest)}
          >
            {interest}
          </div>
        ))}
      </div>
      {error && <p className="error-message">{error}</p>}
      <button 
        className="submit-btn"
        onClick={handleSubmit}
        disabled={selectedInterests.length === 0}
      >
        Continue
      </button>
    </div>
  );
};

export default Interests; 