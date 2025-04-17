const jwt = require('jsonwebtoken');
const { SystemSetting } = require('../models');

// Authentication middleware
const auth = async function (req, res, next) {
  console.log('Auth middleware called, headers:', req.headers);
  
  // Get token from header
  const token = req.header('x-auth-token') || 
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
      ? req.headers.authorization.split(' ')[1] 
      : null);
  
  console.log('Token extracted:', token);

  // Check if no token
  if (!token) {
    console.log('No token found in request');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // For development mode, allow a bypass token
    if (process.env.NODE_ENV === 'development' && token === 'dev-token-123') {
      console.log('Using development bypass token');
      req.user = { role: 'admin' };
      next();
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', JSON.stringify(decoded));

    // Set user data from decoded token
    req.user = decoded.user || decoded; // Handle both formats
    console.log('User data from token:', JSON.stringify(req.user));

    // Verify user role and access level
    if (req.user.role === 'admin') {
      // Admin gets full access
      console.log('Admin access granted');
      next();
      return;
    } else if (req.user.role === 'teacher') {
      // Teacher should already be authenticated through JWT
      // No need to validate password again since we issued the token
      console.log('Teacher access granted');
      next();
      return;
    }

    // If code reached here, user doesn't have proper role
    console.log('Permission denied: invalid role', req.user.role);
    return res.status(403).json({ message: 'Permission denied' });
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = { auth }; 