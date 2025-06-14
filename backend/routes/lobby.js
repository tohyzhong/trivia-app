import express from 'express';
import * as crypto from 'node:crypto';
import Lobby from '../models/lobby.js';
import User from '../models/User.js';

const router = express.Router();

// Create a new Solo lobby
router.post('/solo/create', async (req, res) => {
  try {
    const { gameType, player } = req.body;
    const id = crypto.randomUUID();
    const playerDoc = await User.collection.findOne({ username: player })
    
    if (!playerDoc) {
      return res.status(404).json({ message: 'Player not found.' });
    }

    const existingLobby = await User.aggregate([
      // Retrieve player information
      { $match: { username: player } },

      // Check if the lobby already exists and if the player is already in the lobby
      {
        $lookup: {
          from: 'lobbies',
          pipeline: [
            {
              $facet: {
                lobbyExists: [
                  { $match: { lobbyId: id } },
                  { $limit: 1 },
                ],
                playerExists: [
                  {
                    $match: {
                      $expr: {
                        $in: [playerDoc._id, '$players']
                      }
                    }
                  },
                  { $limit: 1 }
                ]
              }
            }
          ],
          as: 'lobbies'
        },
      },

      // Retrieve lobby if it exists
      { $unwind: '$lobbies' },

      { $project: {
        _id: 0,
        lobbyExists: {
          $cond: {
            if: { $gt: [{ $size: '$lobbies.lobbyExists' }, 0] },
            then: true,
            else: false
          }
        },
        playerExists: {
          $cond: {
            if: { $gt: [{ $size: '$lobbies.playerExists' }, 0] },
            then: true,
            else: false
          }
        }
      }}
    ]);
    console.log(existingLobby);

    if (existingLobby[0].lobbyExists) {
      return res.status(400).json({ message: 'Lobby ID already exists.' })
    } else if (existingLobby[0].playerExists) {
      return res.status(400).json({ message: 'Player already in a lobby.' })
    }

    const lobby = { 
      lobbyId: id,
      players: [playerDoc._id],
      gameType: `${gameType}`,
    };

    await Lobby.collection.insertOne(lobby);
    return res.status(201).json({ lobbyId: id, message: 'Lobby created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating lobby' });
  }
});

export default router;