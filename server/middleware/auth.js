const jwt = require('jsonwebtoken');
const { SystemSetting } = require('../models');

// Authentication middleware
module.exports = async function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Set user data from decoded token
    req.user = decoded.user;

    // Verify user role and access level
    if (decoded.user.role === 'admin') {
      // Admin gets full access
      next();
      return;
    } else if (decoded.user.role === 'teacher') {
      // Teacher gets access to teacher routes
      try {
        const teacherPassword = await SystemSetting.findOne({
          where: { setting_key: 'teacher_password' }
        });

        if (!teacherPassword || decoded.user.password !== teacherPassword.setting_value) {
          return res.status(401).json({ message: 'Invalid teacher credentials' });
        }
        
        next();
        return;
      } catch (err) {
        console.error('Teacher authentication error:', err);
        return res.status(500).json({ message: 'Server error' });
      }
    }

    // If code reached here, user doesn't have proper role
    return res.status(403).json({ message: 'Permission denied' });
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 