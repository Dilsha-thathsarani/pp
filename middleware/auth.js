// backend/middleware/auth.js

const jwt = require('jsonwebtoken');
const pool = require('../config/db');

module.exports = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access token missing' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user exists
        const result = await pool.query('SELECT is_verified FROM users WHERE id = $1', [decoded.userId]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        if (!user.is_verified) {
            return res.status(403).json({ message: 'Email not verified' });
        }

        req.user = decoded;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(403).json({ message: 'Invalid or expired token' });
    }
};
