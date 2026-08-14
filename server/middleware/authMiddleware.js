/**
 * Owner JWT Authentication & Authorization Middleware
 * Protects CRUD REST API endpoints from unauthorized calls
 */
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'mufina_artistry_owner_secure_jwt_secret_key_2026_x89a';

const verifyOwnerToken = (req, res, next) => {
  // Allow GET requests (public view) without authentication token
  if (req.method === 'GET') {
    return next();
  }

  // Extract Authorization header
  const authHeader = req.headers['authorization'] || req.headers['x-access-token'];
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (authHeader) {
    token = authHeader;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. Owner security authentication token is missing.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.ownerUser = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'Security verification failed. Invalid or expired owner session token. Please log in again.'
    });
  }
};

module.exports = verifyOwnerToken;
