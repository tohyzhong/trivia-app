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
    }).select('username').lean().limit(10);

    res.json(matchingUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:username', authenticate, async (req, res) => {
  const { username } = req.params;

  try {
    const results = await Profile.aggregate([
      { $match: { username } },

      {
        $lookup: {
          from: 'profiles',
          localField: 'friends',
          foreignField: '_id',
          as: 'friendProfiles'
        }
      },

      {
        $addFields: {
          mutualFriends: {
            $slice: [
              {
                $map: {
                  input: {
                    $filter: {
                      input: '$friendProfiles',
                      as: 'friend',
                      cond: {
                        $in: ['$_id', '$$friend.friends']
                      }
                    }
                  },
                  as: 'mutual',
                  in: '$$mutual.username'
                }
              },
              10
            ]
          }
        }
      },

      {
        $project: {
          _id: 1,
          username: 1,
          winRate: 1,
          correctRate: 1,
          correctNumber: 1,
          currency: 1,
          profilePicture: 1,
          friends: '$mutualFriends'
        }
      }
    ]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(results[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all friends
router.get('/:username/friends', authenticate, async (req, res) => {
  const { username } = req.params;

  try {
    const results = await Profile.aggregate([
      { $match: { username } },

      { $limit: 1 },

      {
        $lookup: {
          from: 'profiles',
          localField: 'friends',
          foreignField: '_id',
          as: 'friendProfiles'
        }
      },

      {
        $addFields: {
          mutualFriends: {
            $filter: {
              input: '$friendProfiles',
              as: 'friend',
              cond: {
                $in: ['$_id', '$$friend.friends']
              }
            }
          }
        }
      },

      {
        $project: {
          _id: 0,
          mutualFriends: {
            $map: {
              input: '$mutualFriends',
              as: 'friend',
              in: {
                username: '$$friend.username',
                profilePicture: '$$friend.profilePicture'
              }
            }
          }
        }
      }
    ]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(results[0].mutualFriends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add friend
router.put('/:username/friends/add', authenticate, async (req, res) => {
  const { username } = req.params;
  const { friendUsername } = req.body;

  if (username === friendUsername) {
    return res.status(400).json({ message: 'You cannot add yourself as a friend.' });
  }

  try {
    const [userProfile, friendProfile] = await Promise.all([
      Profile.findOne({ username }).select('_id'),
      Profile.findOne({ username: friendUsername }).select('_id friends')
    ]);

    if (!userProfile || !friendProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const userId = userProfile._id;
    const friendId = friendProfile._id;

    await Profile.updateOne(
      { _id: userId },
      { $addToSet: { friends: friendId } }
    );

    const isMutual = friendProfile.friends.some(id => id.equals(userId));

    res.json({
      message: isMutual
        ? 'You are now friends!'
        : 'Friend request sent. Waiting for the other user to add you back.'
    });
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
    const [userProfile, friendProfile] = await Promise.all([
      Profile.findOne({ username }).select('_id'),
      Profile.findOne({ username: friendUsername }).select('_id')
    ]);

    if (!userProfile || !friendProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const userId = userProfile._id;
    const friendId = friendProfile._id;

    await Promise.all([
      Profile.updateOne(
        { _id: userId },
        { $pull: { friends: friendId } }
      ),
      Profile.updateOne(
        { _id: friendId },
        { $pull: { friends: userId } }
      )
    ]);

    res.json({ message: 'Friend removed successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;