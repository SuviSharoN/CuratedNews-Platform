import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import defaultAvatar from '../assets/default-avatar.png'; // You can use a placeholder or a URL
import './Profile.css'; // Import the CSS

const Profile = () => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [emailOptOut, setEmailOptOut] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data.data);
        setUsername(res.data.data.username);
        setBio(res.data.data.bio || '');
        setProfilePicture(res.data.data.profilePicture || '');
        setEmailOptOut(res.data.data.emailOptOut || false);
      } catch (err) {
        setMessage('Failed to load profile');
      }
    };
    if (token) fetchProfile();
  }, [token]);

  const handleSave = async () => {
    try {
      const res = await axios.put(
        '/api/auth/me',
        { username, bio },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(res.data.data);
      setEditMode(false);
      setMessage('Profile updated!');
    } catch (err) {
      setMessage('Failed to update profile');
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('profilePicture', file);
    try {
      const res = await axios.post('/api/auth/me/profile-picture', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setProfilePicture(res.data.data.profilePicture);
      setMessage('Profile picture updated!');
    } catch (err) {
      setMessage('Failed to update profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleOptOutEmails = async () => {
    try {
      const res = await axios.put('/api/auth/me', { emailOptOut: true }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailOptOut(true);
      setMessage('You will no longer receive emails.');
    } catch (err) {
      setMessage('Failed to update email preferences');
    }
  };

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div className="profile-page">
      <h2>User Profile</h2>
      <div className="profile-picture-section">
        <img
          src={profilePicture || defaultAvatar}
          alt="Profile"
          className="profile-avatar"
        />
        <div>
          <button onClick={() => fileInputRef.current.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Change Picture'}
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleProfilePictureChange}
          />
        </div>
      </div>
      <div className="profile-field">
        <label>Username:</label>
        {editMode ? (
          <input value={username} onChange={e => setUsername(e.target.value)} />
        ) : (
          <span>{profile.username}</span>
        )}
      </div>
      <div className="profile-field">
        <label>Bio:</label>
        {editMode ? (
          <textarea value={bio} onChange={e => setBio(e.target.value)} />
        ) : (
          <span>{profile.bio || 'No bio set.'}</span>
        )}
      </div>
      <div className="profile-field">
        <label>Email:</label>
        <span>{profile.email}</span>
      </div>
      <div className="opt-out-section">
        <button onClick={handleOptOutEmails} disabled={emailOptOut} className="opt-out-button">
          {emailOptOut ? 'Email Notifications Disabled' : 'No More Emails'}
        </button>
      </div>
      <div className="profile-actions">
        {editMode ? (
          <>
            <button onClick={handleSave} className="save-btn">Save</button>
            <button onClick={() => setEditMode(false)} className="cancel-btn">Cancel</button>
          </>
        ) : (
          <button onClick={() => setEditMode(true)} className="edit-btn">Edit Profile</button>
        )}
      </div>
      {message && <div className={`profile-message ${message.startsWith('Failed') ? 'error' : 'success'}`}>{message}</div>}
    </div>
  );
};

export default Profile; 