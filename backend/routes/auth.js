import express from 'express';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import authenticate from './authMiddleware.js';
import sendEmail from '../utils/email.js';

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
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      email,
      username,
      password: hashedPassword,
      previousPasswords: [hashedPassword],
      verified: false
    });

    await Profile.create({
      username,
      profilePicture: '',
      winRate: 0,
      correctRate: 0,
      correctNumber: 0,
      friends: [],
      currency: 0
    });

    emailVerificationToken(username, req, res);

    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    // MongoDB error 11000 is for duplicate keys
    if (err.code === 11000) {
      const dupField = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ errors: [{ msg: `${dupField.charAt(0).toUpperCase() + dupField.slice(1)} is already in use.` }] });
    }

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

    // await Profile.updateOne(
    //   { username },
    //   {
    //     $setOnInsert: {
    //       username,
    //       profilePicture: '',
    //       winRate: 0,
    //       correctRate: 0,
    //       correctNumber: 0,
    //       friends: [],
    //       currency: 0
    //     }
    //   },
    //   { upsert: true }
    // );

    // await Profile.updateOne(
    //   { username },
    //   [
    //     {
    //       $set: {
    //         profilePicture: {
    //           $cond: [{ $eq: [{ $ifNull: ["$profilePicture", null] }, null] }, "", "$profilePicture"]
    //         },
    //         winRate: {
    //           $cond: [{ $eq: [{ $ifNull: ["$winRate", null] }, null] }, 0, "$winRate"]
    //         },
    //         correctRate: {
    //           $cond: [{ $eq: [{ $ifNull: ["$correctRate", null] }, null] }, 0, "$correctRate"]
    //         },
    //         correctNumber: {
    //           $cond: [{ $eq: [{ $ifNull: ["$correctNumber", null] }, null] }, 0, "$correctNumber"]
    //         },
    //         friends: {
    //           $cond: [{ $eq: [{ $ifNull: ["$friends", null] }, null] }, [], "$friends"]
    //         },
    //         currency: {
    //           $cond: [{ $eq: [{ $ifNull: ["$currency", null] }, null] }, 0, "$currency"]
    //         }
    //       }
    //     }
    //   ]
    // );


    // await User.updateOne(
    //   { username },
    //   [
    //     {
    //       $set: {
    //         verified: {
    //           $cond: [{ $eq: [{ $ifNull: ["$verified", null] }, null] }, false, "$verified"]
    //         }
    //       }
    //     }
    //   ]
    // );

    const token = jwt.sign({
      id: user._id,
      username: user.username,
      email: user.email,
      verified: user.verified
    }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 30 minutes (change in authMiddleware.js if modified)
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
  res.clearCookie('token', {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// Forgot Password
router.post('/forgotpassword', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'No user found with that email address.' });
    } else if (!user.verified) {
      return res.status(400).json({ error: 'User is not verified. Please verify your account before resetting the password.' });
    } else {
      const token = jwt.sign({
        email: email,
        purpose: 'passwordReset',
      }, process.env.JWT_SECRET, { expiresIn: '10m' });
      const link = `${process.env.FRONTEND_URL}/auth/forgotpassword?token=${token}`;

      const emailContent = `
        <p>Hello ${user.username},</p>
        <p>To reset your password, click the link below:</p>
        <p><a href="${link}">Reset Password</a></p>
        <p>This link will expire in 10 minutes.</p>
      `;

      await sendEmail(email, 'Password Reset Request', '', emailContent);

      return res.status(200).json({ message: 'Password reset link sent to your email.' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
})

// Verify Password Reset Token
router.post('/verifyreset', async (req, res) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email, purpose } = decoded;
    if (purpose !== 'passwordReset') {
      return res.status(400).json({ error: 'Invalid token purpose' });
    } else {
      return res.status(200).json({ email });
    }
  } catch (err) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }
})

// Reset password
router.post('/resetpassword', [
  body('email').isEmail().withMessage('Please provide a valid email address.'),
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

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    // Check if assword has been used before
    for (const prevPassword of user.previousPasswords) {
      const isMatch = await bcrypt.compare(password, prevPassword);
      if (isMatch) return res.status(400).json({ errors: [{ msg: 'Your new password cannot be the same as your last 3 passwords.' }] });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.previousPasswords.push(hashedPassword);
    if (user.previousPasswords.length > 3) {
      user.previousPasswords.shift();
    }

    await user.save();
    return res.status(200).json({ message: 'Password reset successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
})

// Request Verification Email
router.post('/send-verification-email', async (req, res) => {
  const { username } = req.body;

  emailVerificationToken(username, req, res);
});

// Email Verification API
router.get('/verify', async (req, res) => {
  const { token } = req.query;

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const { userId } = decodedToken;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.verified = true;
    await user.save();

    const newToken = jwt.sign({
      id: user._id,
      username: user.username,
      email: user.email,
      verified: true,
    }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    res.status(200).json({ message: 'User verified successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Error verifying token', error: err.message });
  }
});

// Helper function to send email verification token
const emailVerificationToken = async (username, req, res) => {
  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const verificationUrl = `${process.env.FRONTEND_URL}/settings/verify-action?action=verify&token=${token}`;
    const emailContent = `
      <p>Hello ${user.username},</p>
      <p>To verify your email address, click the link below:</p>
      <p><a href="${verificationUrl}">Verify Email</a></p>
      <p>This link will expire in 1 hour.</p>
    `;

    await sendEmail(user.email, 'Please verify your email address', '', emailContent);

    res.status(200).json({ message: 'Verification email sent successfully' });

  } catch (err) {
    console.error('Error sending verification email:', err);
    res.status(500).json({ message: 'Error sending verification email', error: err.message });
  }
};

export default router;