import express from 'express';
import { saveInterests, getInterests, testEmail } from '../Controllers/interestsController.js';
import { authenticateToken } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Protected routes
router.post('/', authenticateToken, saveInterests);
router.get('/', authenticateToken, getInterests);
router.post('/test-email', testEmail);

export default router; 