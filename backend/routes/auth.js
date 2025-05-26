import express from 'express';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import Token from '../models/Token.js';
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
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ email, username, password: hashedPassword, verified: false });

    await Profile.create({
      username,
      profilePicture: '',
      winRate: 0,
      correctRate: 0,
      correctNumber: 0,
      friends: [],
      currency: 0
    });

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

    await Profile.updateOne(
      { username },
      {
        $setOnInsert: {
          username,
          profilePicture: '',
          winRate: 0,
          correctRate: 0,
          correctNumber: 0,
          friends: [],
          currency: 0
        }
      },
      { upsert: true }
    );

    await Profile.updateOne(
      { username },
      [
        {
          $set: {
            profilePicture: {
              $cond: [{ $eq: [{ $ifNull: ["$profilePicture", null] }, null] }, "", "$profilePicture"]
            },
            winRate: {
              $cond: [{ $eq: [{ $ifNull: ["$winRate", null] }, null] }, 0, "$winRate"]
            },
            correctRate: {
              $cond: [{ $eq: [{ $ifNull: ["$correctRate", null] }, null] }, 0, "$correctRate"]
            },
            correctNumber: {
              $cond: [{ $eq: [{ $ifNull: ["$correctNumber", null] }, null] }, 0, "$correctNumber"]
            },
            friends: {
              $cond: [{ $eq: [{ $ifNull: ["$friends", null] }, null] }, [], "$friends"]
            },
            currency: {
              $cond: [{ $eq: [{ $ifNull: ["$currency", null] }, null] }, 0, "$currency"]
            }
          }
        }
      ]
    );


    await User.updateOne(
      { username },
      [
        {
          $set: {
            verified: {
              $cond: [{ $eq: [{ $ifNull: ["$verified", null] }, null] }, false, "$verified"]
            }
          }
        }
      ]
    );

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
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      })

      // Verify (debugging purposes)
      await transporter.verify();

      // Generate Token
      const token = uuidv4();
      const link = `${process.env.FRONTEND_URL}/auth/forgotpassword?token=${token}`;
      console.log(link);

      (async () => {
        try {
          const info = await transporter.sendMail({
            from: '"The Rizz Quiz" <therizzquiz@gmail.com>',
            to: email,
            subject: 'Password Reset Request',
            text: 'You have requested a password reset.\nClick the link below to reset your password:\n\n' + link
          })
        } catch (err) {
          console.error('Error sending email:', err);
        }
      })();

      // Push onto Tokens collection
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + 10); // 10 minutes expiry
      await Token.create({
        purpose: 'passwordReset',
        email: email,
        token: token,
        expiresAt: expiryDate
      })

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
    const tokenDocument = await Token.findOne({token: token, purpose: 'passwordReset', expiresAt: { $gt: new Date() } });
    if (!tokenDocument) {
      return res.status(400).json({ error: 'Invalid or expired token.' });
    } else {
      const email = tokenDocument.email;
      // Delete document (no longer needed)
      await Token.deleteOne({token: token, purpose: 'passwordReset'})
      return res.status(200).json({ message: 'Token is valid.', email: email });
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