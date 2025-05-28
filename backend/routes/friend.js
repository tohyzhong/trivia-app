import express from 'express'
import authenticate from './authMiddleware.js'; 
import Friend from '../models/Friend.js';
import Profile from '../models/Profile.js';

const router = express.Router();

router.get('/:username/mutual', authenticate, async (req, res) => {
  const { username } = req.params;

  try {
    // Fetch involved friend connections
    const outgoingFriends = 
      (await Friend.find({ from: username }))
      .map((doc) => doc.to); // Retrieve outgoing

    const mutualFriends = 
      (await Friend.find({ to: username }))
      .map((doc) => doc.from) // Retrieve incoming
      .filter((friend) => outgoingFriends.includes(friend)); // Keep mutuals

    // Retrieve profiles of mutual friends
    const profiles = 
      (await Profile.find({ username: { $in: mutualFriends }}))
      .map((doc) => ({ profilePicture: doc.profilePicture, username: doc.username }));

    res.status(200).json(profiles)
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch incoming friend requests
router.get('/:username/incoming', authenticate, async (req, res) => {
  const { username } = req.params;

  try {
    // Fetch involved friend connections
    const outgoingFriends = 
      (await Friend.find({ from: username }))
      .map((doc) => doc.to); // Retrieve outgoing

    const incomingFriends = 
      (await Friend.find({ to: username }))
      .map((doc) => doc.from) // Retrieve incoming
      .filter((friend) => !outgoingFriends.includes(friend)); // Filter out mutual connections

    // Retrieve profiles of incoming friends
    const profiles = 
      (await Profile.find({ username: { $in: incomingFriends }}))
      .map((doc) => ({ profilePicture: doc.profilePicture, username: doc.username }));

    res.status(200).json(profiles)
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add friend
router.put('/:username/add', authenticate, async (req, res) => {
  const { username } = req.params;
  const { friendUsername } = req.body;

  if (username === friendUsername) {
    return res.status(400).json({ message: 'You cannot add yourself as a friend.' });
  }

  // TODO: refactor
  try {
    // Ensure profiles exist
    const [userProfile, friendProfile] = await Promise.all([
      Profile.findOne({ username }).select('_id'),
      Profile.findOne({ username: friendUsername }).select('_id friends')
    ]);

    if (!userProfile || !friendProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    // Create friend relation
    await Friend.create({
      from: username,
      to: friendUsername
    })

    const isMutual = await Friend.findOne({
      from: friendUsername,
      to: username
    })

    res.json({
      message: 
        isMutual
        ? 'You are now friends!'
        : 'Friend request sent. Waiting for the other user to add you back.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove friend
router.put('/:username/remove', authenticate, async (req, res) => {
  const { username } = req.params;
  const { friendUsername } = req.body;
  console.log('test')

  try {
    await Friend.findOneAndDelete({
      from: username,
      to: friendUsername
    })

    res.json({ message: 'Friend removed successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;