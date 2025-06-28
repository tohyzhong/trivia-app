import express from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import Friend from "../models/Friend.js";
import UsedToken from "../models/UsedToken.js";
import sendEmail from "../utils/email.js";
import authenticate from "./authMiddleware.js";

const router = express.Router();

// Helper function to check password validity
const passwordValidation = [
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter.")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter.")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number.")
];

// Helper function to generate a token
const generateToken = (userId, action, newEmail = null) => {
  const payload = { userId, action };
  if (newEmail) {
    payload.newEmail = newEmail;
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Change Profile Picture
router.post("/update-profile-picture", authenticate, async (req, res) => {
  const { username, profilePictureUrl } = req.body;

  try {
    const user = await Profile.findOneAndUpdate(
      { username },
      { $set: { profilePicture: profilePictureUrl } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Profile picture updated successfully", user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Change Password
router.post("/change-password", authenticate, async (req, res) => {
  const { username } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const token = generateToken(user._id, "change-password");

    const verificationLink = `${process.env.FRONTEND_URL}/settings/verify-action?action=change-password&token=${token}`;
    const emailContent = `
      <p>Hi ${username},</p>
      <p>Click <a href="${verificationLink}">here</a> to change your password.</p>
    `;

    await sendEmail(
      user.email,
      "Change Password Verification",
      "",
      emailContent
    );

    res.json({ message: "Verification email sent to change password" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Change Email
router.post(
  "/change-email",
  authenticate,
  [body("newEmail").isEmail().withMessage("Invalid email format.")],
  async (req, res) => {
    const { username, newEmail } = req.body;

    try {
      const user = await User.findOne({ username });
      if (!user) return res.status(404).json({ error: "User not found" });

      const token = generateToken(user._id, "change-email", newEmail);

      // Send verification email to the new email
      const verificationLink = `${process.env.FRONTEND_URL}/settings/verify-action?token=${token}`;
      const emailContentNew = `
        <p>Hi ${username},</p>
        <p>Click <a href="${verificationLink}">here</a> to verify your new email address.</p>
      `;
      await sendEmail(
        newEmail,
        "Change Email Verification",
        "",
        emailContentNew
      );

      // Send notification email to the old email
      const emailContentOld = `
        <p>Hi ${username},</p>
        <p>Your email address has been changed. If this was not you, please contact support.</p>
      `;
      await sendEmail(
        user.email,
        "Email Change Notification",
        "",
        emailContentOld
      );

      res.json({
        message: "Verification email sent to the new email for change"
      });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Delete Account
router.post("/delete-account", authenticate, async (req, res) => {
  const { username } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const token = generateToken(user._id, "delete-account");

    const verificationLink = `${process.env.FRONTEND_URL}/settings/verify-action?action=delete-account&token=${token}`;
    const emailContent = `
      <p>Hi ${username},</p>
      <p>Click <a href="${verificationLink}">here</a> to confirm account deletion.</p>
    `;
    await sendEmail(
      user.email,
      "Delete Account Verification",
      "",
      emailContent
    );

    res.json({
      message: "Verification email sent to confirm account deletion"
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Action Verification (Handling the verification links)
router.post("/verify-action", async (req, res) => {
  const { token } = req.body;

  try {
    const alreadyUsed = await UsedToken.findOne({ token });
    if (alreadyUsed)
      return res
        .status(400)
        .json({ error: "This token has already been used." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (decoded.action === "change-password") {
      const { newPassword } = req.body;
      await Promise.all(
        passwordValidation.map((validation) => validation.run(req))
      );
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      for (const prevPassword of user.previousPasswords) {
        const isMatch = await bcrypt.compare(newPassword, prevPassword);
        if (isMatch)
          return res.status(400).json({
            errors: [
              {
                msg: "Your new password cannot be the same as your last 3 passwords."
              }
            ]
          });
      }

      // Save used token to prevent reuse
      await UsedToken.create({
        token,
        usedAt: new Date()
      });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;

      user.previousPasswords.push(hashedPassword);
      if (user.previousPasswords.length > 3) {
        user.previousPasswords.shift();
      }

      await user.save();

      res.json({ message: "Password changed successfully" });
    } else {
      // Save used token to prevent reuse
      await UsedToken.create({
        token,
        usedAt: new Date()
      });

      switch (decoded.action) {
        case "change-email":
          const newEmail = decoded.newEmail;

          const emailExists = await User.findOne({ email: newEmail });
          if (emailExists) {
            return res.status(400).json({ error: "Email is already in use" });
          }

          user.email = newEmail;
          await user.save();

          const newToken = jwt.sign(
            {
              id: user._id,
              username: user.username,
              email: newEmail,
              verified: user.verified
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
          );

          res.cookie("token", newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
          });

          res.json({ message: "Email changed successfully" });
          break;
        case "delete-account":
          await Promise.all([
            User.findByIdAndDelete(decoded.userId),
            Profile.findOneAndDelete({ username: user.username }),
            Friend.deleteMany({
              $or: [{ from: user.username }, { to: user.username }]
            })
          ]);

          res.json({ message: "Account deleted successfully" });
          break;
        default:
          return res.status(400).json({ error: "Invalid action" });
      }
    }
  } catch (err) {
    res.status(400).json({ error: "Invalid or expired token" });
  }
});

router.post(
  "/contact",
  [body("email").isEmail().withMessage("Invalid email format.")],
  async (req, res) => {
    const { name, username, email, subject, message } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    } else if (!email) {
      return res.status(400).json({ message: "Email is required" });
    } else if (!subject) {
      return res.status(400).json({ message: "Subject is required" });
    } else if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const userMailContent = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          h2 {
            color: #4CAF50;
          }
          p {
            font-size: 16px;
            line-height: 1.5;
          }
          blockquote {
            border-left: 4px solid #4CAF50;
            padding-left: 15px;
            color: #555;
            font-style: italic;
          }
          footer {
            font-size: 12px;
            color: #888;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h2>Thank You for Contacting Us!</h2>
        <p>Dear ${name},</p>
        <p>Thank you for reaching out to Rizz Quiz! We have received your message and will get back to you as soon as possible.</p>
        
        <p><strong>Here’s a copy of your message:</strong></p>
        
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <blockquote>
          ${message}
        </blockquote>

        <p>If you need immediate assistance, feel free to contact us again at <a href="mailto:therizzquiz@gmail.com">therizzquiz@gmail.com</a>.</p>

        <p>Best regards,<br>The Rizz Quiz Team</p>
        <hr />
        <footer>
          <p>If you didn't send this message or think this is an error, please ignore this email.</p>
        </footer>
      </body>
    </html>
  `;

    const MailContent = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          h2 {
            color: #4CAF50;
          }
          p {
            font-size: 16px;
            line-height: 1.5;
          }
          blockquote {
            border-left: 4px solid #4CAF50;
            padding-left: 15px;
            color: #555;
            font-style: italic;
          }
          footer {
            font-size: 12px;
            color: #888;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h2>New Inquiry from ${name}</h2>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>

        <p><strong>Message:</strong></p>
        <blockquote>
          ${message}
        </blockquote>

        <p><strong>Contact Details:</strong></p>
        <p>Name: ${name}</p>
        <p>Username: ${username}</p>
        <p>Email: ${email}</p>
        
        <p>This message was sent through the contact form on Rizz Quiz.</p>

        <p>Best regards,<br>The Rizz Quiz Team</p>
        <hr />
        <footer>
          <p>Please reply to this email if you'd like to follow up with ${name}.</p>
        </footer>
      </body>
    </html>
  `;

    try {
      await sendEmail(
        email,
        `[Rizz Quiz Inquiry] ${subject}`,
        "",
        userMailContent
      );
      await sendEmail(
        "therizzquiz@gmail.com",
        `[Rizz Quiz Inquiry] ${subject}`,
        "",
        MailContent
      );

      return res.status(200).json({ message: "Message sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      return res
        .status(500)
        .json({ message: "Failed to send message. Please try again later." });
    }
  }
);

export default router;
