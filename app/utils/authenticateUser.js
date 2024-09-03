const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ruchi_jwt_secret'; 

exports.authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Access token is required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next(); 
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
