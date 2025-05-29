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

export default router;