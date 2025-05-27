// backend/routes/authRoutes.js
import express from 'express';
import { registerUser, loginUser, getCurrentUser, updateUserInfo, updateUserInterests, updateProfilePicture, uploadProfilePictureMiddleware } from '../Controllers/AuthController.js';
import { authenticateToken } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// User profile endpoints
router.get('/me', authenticateToken, getCurrentUser);
router.put('/me', authenticateToken, updateUserInfo);
router.put('/me/interests', authenticateToken, updateUserInterests);
router.post('/me/profile-picture', authenticateToken, uploadProfilePictureMiddleware, updateProfilePicture);

export default router;