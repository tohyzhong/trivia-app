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
          from: 'friends',
          localField: 'username',
          foreignField: 'from',
          as: 'outgoingFriends'
        }
      },

      {
        $lookup: {
          from: 'friends',
          localField: 'username',
          foreignField: 'to',
          as: 'incomingFriends'
        }
      },

      {
        $addFields: {
          outgoingUsernames: {
            $map: {
              input: '$outgoingFriends',
              as: 'of',
              in: '$$of.to'
            }
          },
          incomingUsernames: {
            $map: {
              input: '$incomingFriends',
              as: 'inf',
              in: '$$inf.from'
            }
          }
        }
      },

      // Mutual friend logic
      {
        $addFields: {
          mutualUsernames: {
            $setIntersection: ['$incomingUsernames', '$outgoingUsernames']
          }
        }
      },

      // Obtain username and profile picture of mutual friends
      {
        $lookup: {
          from: 'profiles',
          let: { mutuals: '$mutualUsernames' },
          pipeline: [
            { $match: { $expr: { $in: ['$username', '$$mutuals'] } } },
            { $project: { username: 1, profilePicture: 1 } },
            { $limit: 10 }
          ],
          as: 'mutualProfiles'
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
          friends: '$mutualProfiles'
        }
      }
    ]);

    if (!results.length) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(results[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;