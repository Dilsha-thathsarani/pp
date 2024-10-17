const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { sendVerificationEmail } = require('../services/emailService');

// Register User
exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // Check if user already exists
        const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, email, password, is_verified) VALUES ($1, $2, $3, $4) RETURNING id',
            [username, email, hashedPassword, false]
        );

        const userId = result.rows[0].id;

        // Generate email verification token
        const emailToken = crypto.randomBytes(32).toString('hex');

        // Save the token in the database
        await pool.query(
            'INSERT INTO email_verifications (user_id, token) VALUES ($1, $2)',
            [userId, emailToken]
        );

        // Send verification email
        await sendVerificationEmail(email, emailToken);

        res.status(201).json({ message: 'Registration successful. Verification email sent.' });
    } catch (error) {
        console.error('Error in registration:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
    const { token } = req.query;
    try {
        const result = await pool.query(
            'SELECT user_id FROM email_verifications WHERE token = $1',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const userId = result.rows[0].user_id;

        // Update user's is_verified status
        await pool.query('UPDATE users SET is_verified = true WHERE id = $1', [userId]);

        // Delete the token
        await pool.query('DELETE FROM email_verifications WHERE token = $1', [token]);

        // Optionally, log the user in by generating a JWT
        const jwtToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.redirect(`/profile-completion?token=${jwtToken}`);
    } catch (error) {
        console.error('Error in email verification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login User
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];

        if (!user.is_verified) {
            return res.status(400).json({ message: 'Email not verified' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
