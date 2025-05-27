// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../Models/UserModel.js'; // Adjust path if needed
import dotenv from 'dotenv';

dotenv.config();

export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user to request, exclude password
            req.user = await User.findById(decoded.id || decoded._id).select('-password'); // Use 'id' if you signed with {id}, '_id' if { _id }

            if (!req.user) {
                 return res.status(401).json({ success: false, message: 'Not authorized, user not found.' });
            }
            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error.message);
            res.status(401).json({ success: false, message: 'Not authorized, token failed.' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
    }
};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded.id }; // Set _id for downstream compatibility
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};