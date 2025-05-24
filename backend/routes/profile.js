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

    const friends = userProfile.friends;

    const mutualFriends = await Promise.all(
      friends.map(async (friendUsername) => {
        const friendProfile = await Profile.findOne({ username: friendUsername });
        if (friendProfile && friendProfile.friends.includes(username)) {
          return friendUsername;
        }
        return null;
      })
    );

    const mutualFriendsFiltered = mutualFriends.filter(friend => friend !== null);

    const profileResponse = {
      ...userProfile.toObject(),
      friends: mutualFriendsFiltered,
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

    const friends = userProfile.friends;
    const mutualFriendsDetails = await Promise.all(
      friends.map(async (friendUsername) => {
        const friendProfile = await Profile.findOne({ username: friendUsername });

        if (friendProfile && friendProfile.friends.includes(username)) {
          return {
            username: friendProfile.username,
            profilePicture: friendProfile.profilePicture
          };
        }
        return null;
      })
    );

    const validMutualFriends = mutualFriendsDetails.filter(friend => friend !== null);

    res.json(validMutualFriends);
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
    const friendProfile = await Profile.findOne({ username: friendUsername });

    if (!userProfile || !friendProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (!userProfile.friends.includes(friendUsername)) {
      userProfile.friends.push(friendUsername);
      await userProfile.save();

      if (friendProfile.friends.includes(username)) {
        return res.json({ message: 'You are now friends!' });
      } else {
        return res.json({ message: 'Friend request sent. Waiting for the other user to add you back.' });
      }
    } else if (friendProfile.friends.includes(username)) {
      return res.status(400).json({ message: 'You are already friends.' });
    } else {
      return res.status(400).json({ message: 'You have already sent a friend request.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Remove friend
router.put('/:username/friends/remove', authenticate, async (req, res) => {
  const { username } = req.params;
  const { friendUsername } = req.body;

  try {
    const userProfile = await Profile.findOne({ username });
    const friendProfile = await Profile.findOne({ username: friendUsername });

    if (!userProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (userProfile.friends.includes(friendUsername)) {
      userProfile.friends = userProfile.friends.filter(friend => friend !== friendUsername);
      await userProfile.save();
    }

    if (friendProfile.friends.includes(username)) {
      friendProfile.friends = friendProfile.friends.filter(friend => friend !== username);
      await friendProfile.save();
    }

    res.json({ message: 'Friend removed successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;