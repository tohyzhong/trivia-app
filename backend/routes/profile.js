import express from 'express';
import Profile from '../models/Profile.js';
import authenticate from './authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// Get users from query
router.get('/search-profiles', authenticate, async (req, res) => {
  const query = req.query.query?.toLowerCase() || '';

  try {
    if (!query) {
      return res.json([]);
    }

    const matchingUsers = await User.find({
      username: { $regex: query, $options: 'i' },
    }).select('username').limit(20);

    res.json(matchingUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get profile
router.get('/:username', authenticate, async (req, res) => {
  const { username } = req.params;

  try {
    const userProfile = await Profile.findOne({ username });

    if (!userProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const limitedFriends = userProfile.friends.slice(0, 10);

    const profileResponse = {
      ...userProfile.toObject(),
      friends: limitedFriends,
    };

    res.json(profileResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all friends
router.get('/:username/friends', authenticate, async (req, res) => {
  const { username } = req.params;

  try {
    const userProfile = await Profile.findOne({ username });

    if (!userProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const friendsDetails = await Promise.all(
      userProfile.friends.map((friendUsername, index) => {
        return User.findOne({ username: friendUsername }).then(friend => {
          if (friend) {
            return {
              id: index,
              username: friend.username,
              profilePicture: friend.profilePicture,
            };
          } else {
            return null;
          }
        });
      })
    );

    const validFriendsDetails = friendsDetails.filter(friend => friend !== null);

    res.json(validFriendsDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add friend
router.put('/:username/friends/add', authenticate, async (req, res) => {
  const { username } = req.params;
  const { friendUsername } = req.body;

  try {
    const userProfile = await Profile.findOne({ username });

    if (!userProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (!userProfile.friends.includes(friendUsername)) {
      userProfile.friends.push(friendUsername);
      await userProfile.save();
      res.json(userProfile);
    } else {
      res.status(400).json({ message: 'Friend already added' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove friend
router.put('/:username/friends/remove', authenticate, async (req, res) => {
  const { username } = req.params;
  const { friendUsername } = req.body;

  try {
    const userProfile = await Profile.findOne({ username });

    if (!userProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (userProfile.friends.includes(friendUsername)) {
      userProfile.friends = userProfile.friends.filter(friend => friend !== friendUsername);
      await userProfile.save();
      res.json(userProfile);
    } else {
      res.status(400).json({ message: 'Friend not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;