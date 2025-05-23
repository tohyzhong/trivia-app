import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import authenticate from './authMiddleware.js';

const router = express.Router();

// Authentication
router.get('/verify-token', authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  res.json({
    username: req.user.username,
    email: req.user.email,
    verified: req.user.verified,
  });
});

// Register
router.post('/register', [
  body('email').isEmail().withMessage('Please provide a valid email address.'),
  body('username').notEmpty().withMessage('Username is required.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, username, password } = req.body;
  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ errors: [{ msg: 'Email is already in use.' }] });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ errors: [{ msg: 'Username is already in use.' }] });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, username, password: hashedPassword, verified: false });
    await user.save();

    const profile = new Profile({
      username,
      profilePicture: '',
      winRate: 0,
      correctRate: 0,
      correctNumber: 0,
      friends: [],
      currency: 0
    });
    await profile.save();

    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'No User Found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Wrong Password' });

    let profile = await Profile.findOne({ username });

    if (!profile) {
      profile = new Profile({
        username,
        profilePicture: '',
        winRate: 0,
        correctRate: 0,
        correctNumber: 0,
        friends: [],
        currency: 0
      });
      await profile.save();
    }

    const token = jwt.sign({
      id: user._id,
      username: user.username,
      email: user.email,
      verified: user.verified
    }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    res.json({
      email: user.email,
      verified: user.verified,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });
  res.status(200).json({ message: 'Logged out successfully' });
});

// Forgot Password
router.post('/forgotpassword', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'No user found with that email address.' });
    } else {
      return res.status(200).json({ message: 'Password reset link sent to your email.' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
})

// Reset Password
router.post('/resetpassword', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    return res.status(200).json({ message: 'Password reset successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
})

export default router;