// ============================================================
// middleware/auth.js — JWT Authentication Middleware
// Verifies token on every protected route
// ============================================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify token and decode payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      // Attach user to request (minus password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user no longer exists' });
      }

      next(); // Proceed to the route handler
    } catch (error) {
      console.error('Auth error:', error.message);
      let message = 'Not authorized, token failed';
      
      if (error.name === 'TokenExpiredError') {
        message = 'Session expired, please login again';
      } else if (error.name === 'JsonWebTokenError') {
        message = 'Invalid token, please login again';
      }

      return res.status(401).json({ message });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
