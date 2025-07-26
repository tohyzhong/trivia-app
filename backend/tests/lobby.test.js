import { beforeAll, describe, expect, it, vi } from "vitest";
import Profile from "../models/Profile.js";
import User from "../models/User.js";
import Lobby from "../models/Lobby.js";
import ClassicQuestion from "../models/ClassicQuestion.js";
import KnowledgeQuestion from "../models/KnowledgeQuestion.js";

let request;
let userCookie;

beforeAll(async () => {
  request = global.request;
  userCookie = global.userCookie;

  await ClassicQuestion.deleteMany({});
  await KnowledgeQuestion.deleteMany({});
  await User.deleteMany({});
  await Profile.deleteMany({});
  await Lobby.deleteMany({});

  await User.insertMany([
    {
      email: "test@hotmail.com",
      username: "tyz359",
      password: "12345",
      previousPasswords: ["asd"],
      verified: true,
      role: "user",
      __v: 1,
      gameBan: false,
      chatBan: false
    },
    {
      email: "test@gmail.com",
      username: "basic",
      password: "asdfgh",
      previousPasswords: ["123", "234"],
      verified: true,
      __v: 14,
      role: "superadmin",
      chatBan: false,
      gameBan: false
    }
  ]);

  await Profile.insertMany([
    {
      username: "basic",
      currency: 92814,
      profilePicture:
        "https://avatarfiles.alphacoders.com/335/thumb-1920-335829.jpg",
      matchHistory: [
        {
          type: "versus-classic",
          state: "1st",
          totalPlayed: 3,
          correctNumber: 1,
          date: {
            $date: "2025-07-25T15:17:23.377Z"
          },
          difficulty: 3,
          categoryStats: {
            Community: {
              correct: 1,
              total: 3
            }
          },
          answerHistory: {
            1: "wrong",
            2: "wrong",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 1,
              score: 100
            },
            tyz359: {
              correct: 0,
              score: 0
            }
          },
          color: "win",
          teamScore: 0,
          teamAnswerHistory: {}
        },
        {
          type: "versus-knowledge",
          state: "2nd",
          totalPlayed: 3,
          correctNumber: 1,
          date: {
            $date: "2025-07-25T15:19:13.454Z"
          },
          difficulty: 3,
          categoryStats: {
            Overall: {
              correct: 1,
              total: 3
            }
          },
          answerHistory: {
            1: "correct",
            2: "missing",
            3: "missing"
          },
          playerScoreSummary: {
            basic: {
              correct: 1,
              score: 100
            },
            tyz359: {
              correct: 2,
              score: 162
            }
          },
          color: "lose",
          teamScore: 0,
          teamAnswerHistory: {}
        },
        {
          type: "versus-knowledge",
          state: "1st",
          totalPlayed: 3,
          correctNumber: 3,
          date: {
            $date: "2025-07-25T15:20:26.182Z"
          },
          difficulty: 3,
          categoryStats: {
            Community: {
              correct: 3,
              total: 3
            }
          },
          answerHistory: {
            1: "correct",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 3,
              score: 276
            },
            tyz359: {
              correct: 0,
              score: 0
            }
          },
          color: "win",
          teamScore: 0,
          teamAnswerHistory: {}
        },
        {
          type: "coop-knowledge",
          state: "coop",
          totalPlayed: 3,
          correctNumber: 2,
          date: {
            $date: "2025-07-25T15:21:16.422Z"
          },
          difficulty: 3,
          categoryStats: {
            Overall: {
              correct: 2,
              total: 3
            }
          },
          answerHistory: {
            1: "missing",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 2,
              score: 0
            },
            tyz359: {
              correct: 0,
              score: 0
            }
          },
          color: "solo",
          teamScore: 176,
          teamAnswerHistory: {
            1: ["missing"],
            2: [
              "correct",
              {
                "Brr Brr Patapim": ["basic"],
                asd: ["tyz359"]
              }
            ],
            3: [
              "correct",
              {
                Doge: ["basic"],
                asd: ["tyz359"]
              }
            ]
          }
        },
        {
          type: "coop-knowledge",
          state: "coop",
          totalPlayed: 3,
          correctNumber: 3,
          date: {
            $date: "2025-07-25T15:21:41.586Z"
          },
          difficulty: 3,
          categoryStats: {
            Community: {
              correct: 3,
              total: 3
            }
          },
          answerHistory: {
            1: "correct",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 3,
              score: 0
            },
            tyz359: {
              correct: 0,
              score: 0
            }
          },
          color: "solo",
          teamScore: 327,
          teamAnswerHistory: {
            1: [
              "correct",
              {
                "Correct Answer": ["basic"],
                asd: ["tyz359"]
              }
            ],
            2: [
              "correct",
              {
                "Correct Answer": ["basic"],
                asd: ["tyz359"]
              }
            ],
            3: [
              "correct",
              {
                "Correct Answer": ["basic"],
                asd: ["tyz359"]
              }
            ]
          }
        },
        {
          type: "coop-classic",
          state: "coop",
          totalPlayed: 3,
          correctNumber: 3,
          date: {
            $date: "2025-07-25T15:22:22.654Z"
          },
          difficulty: 3,
          categoryStats: {
            General: {
              correct: 3,
              total: 3
            }
          },
          answerHistory: {
            1: "correct",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 3,
              score: 0
            },
            tyz359: {
              correct: 3,
              score: 0
            }
          },
          color: "solo",
          teamScore: 290,
          teamAnswerHistory: {
            1: [
              "correct",
              {
                3: ["basic", "tyz359"]
              }
            ],
            2: [
              "correct",
              {
                2: ["basic", "tyz359"]
              }
            ],
            3: [
              "correct",
              {
                2: ["basic", "tyz359"]
              }
            ]
          }
        },
        {
          type: "coop-classic",
          state: "coop",
          totalPlayed: 3,
          correctNumber: 2,
          date: {
            $date: "2025-07-25T15:22:43.382Z"
          },
          difficulty: 3,
          categoryStats: {
            Community: {
              correct: 2,
              total: 3
            }
          },
          answerHistory: {
            1: "correct",
            2: "correct",
            3: "wrong"
          },
          playerScoreSummary: {
            basic: {
              correct: 2,
              score: 0
            },
            tyz359: {
              correct: 3,
              score: 0
            }
          },
          color: "solo",
          teamScore: 281,
          teamAnswerHistory: {
            1: [
              "correct",
              {
                2: ["basic", "tyz359"]
              }
            ],
            2: [
              "correct",
              {
                2: ["basic", "tyz359"]
              }
            ],
            3: [
              "correct",
              {
                3: ["tyz359"],
                4: ["basic"]
              }
            ]
          }
        },
        {
          type: "versus-classic",
          state: "1st",
          totalPlayed: 3,
          correctNumber: 2,
          date: {
            $date: "2025-07-25T15:53:52.761Z"
          },
          difficulty: 3,
          categoryStats: {
            Testing: {
              correct: 2,
              total: 3
            }
          },
          answerHistory: {
            1: "missing",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 2,
              score: 210
            },
            tyz359: {
              correct: 1,
              score: 200
            }
          },
          color: "win",
          teamScore: 0,
          teamAnswerHistory: {}
        },
        {
          type: "versus-classic",
          state: "1st",
          totalPlayed: 3,
          correctNumber: 2,
          date: {
            $date: "2025-07-25T16:29:58.887Z"
          },
          difficulty: 3,
          categoryStats: {
            Testing: {
              correct: 2,
              total: 3
            }
          },
          answerHistory: {
            1: "missing",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 2,
              score: 210
            },
            tyz359: {
              correct: 1,
              score: 200
            }
          },
          color: "win",
          teamScore: 0,
          teamAnswerHistory: {}
        },
        {
          type: "versus-classic",
          state: "1st",
          totalPlayed: 3,
          correctNumber: 1,
          date: {
            $date: "2025-07-26T15:44:28.545Z"
          },
          difficulty: 3,
          categoryStats: {
            General: {
              correct: 1,
              total: 2
            },
            "Slang & Acronyms": {
              correct: 0,
              total: 1
            }
          },
          answerHistory: {
            1: "wrong",
            2: "wrong",
            3: "correct"
          },
          playerScoreSummary: {
            tyz359: {
              correct: 1,
              score: 100
            },
            basic: {
              correct: 1,
              score: 100
            }
          },
          color: "win",
          teamScore: 0,
          teamAnswerHistory: {}
        }
      ],
      reports: {
        tyz359: ["Inappropriate Username"]
      },
      leaderboardStats: {
        classic: {
          solo: {
            General: {
              correct: 62,
              total: 105
            },
            overall: {
              correct: 62,
              total: 105,
              score: 7785,
              totalMatches: 0,
              wonMatches: 0
            }
          },
          coop: {
            General: {
              correct: 18,
              total: 31
            },
            overall: {
              correct: 18,
              total: 31,
              score: 987,
              totalMatches: 0,
              wonMatches: 0
            },
            Community: {
              correct: 2,
              total: 3,
              score: 141,
              totalMatches: 0,
              wonMatches: 0
            }
          },
          versus: {
            General: {
              correct: 45,
              total: 68
            },
            overall: {
              correct: 65,
              total: 99,
              score: 7114,
              totalMatches: 23,
              wonMatches: 20
            },
            Community: {
              correct: 2,
              total: 6,
              score: 300,
              totalMatches: 2,
              wonMatches: 2
            },
            Testing: {
              correct: 20,
              total: 30
            },
            "Slang & Acronyms": {
              correct: 0,
              total: 1
            }
          },
          overall: {
            overall: {
              correct: 145,
              total: 235,
              score: 15886,
              totalMatches: 23,
              wonMatches: 20
            },
            General: {
              correct: 125,
              total: 204
            },
            Community: {
              correct: 4,
              total: 9,
              score: 441,
              totalMatches: 2,
              wonMatches: 2
            },
            Testing: {
              correct: 20,
              total: 30
            },
            "Slang & Acronyms": {
              correct: 0,
              total: 1
            }
          }
        },
        knowledge: {
          solo: {
            Overall: {
              correct: 25,
              total: 31
            },
            overall: {
              correct: 25,
              total: 31,
              score: 3250,
              totalMatches: 0,
              wonMatches: 0
            },
            Community: {
              correct: 6,
              total: 6,
              score: 660,
              totalMatches: 0,
              wonMatches: 0
            }
          },
          coop: {
            Overall: {
              correct: 2,
              total: 3
            },
            overall: {
              correct: 2,
              total: 3,
              score: 88,
              totalMatches: 0,
              wonMatches: 0
            },
            Community: {
              correct: 3,
              total: 3,
              score: 164,
              totalMatches: 0,
              wonMatches: 0
            }
          },
          versus: {
            Community: {
              correct: 5,
              total: 6,
              score: 586,
              totalMatches: 2,
              wonMatches: 2
            },
            overall: {
              correct: 1,
              total: 3,
              score: 100,
              totalMatches: 1,
              wonMatches: 0
            },
            Overall: {
              correct: 1,
              total: 3
            }
          },
          overall: {
            overall: {
              correct: 28,
              total: 37,
              score: 3438,
              totalMatches: 1,
              wonMatches: 0
            },
            Overall: {
              correct: 28,
              total: 37
            },
            Community: {
              correct: 14,
              total: 15,
              score: 1410,
              totalMatches: 2,
              wonMatches: 2
            }
          }
        }
      },
      powerups: {
        hintBoosts: 3000,
        addTimes: 3000,
        doublePoints: 3000
      }
    },
    {
      username: "tyz359",
      currency: 116014,
      profilePicture:
        "https://wallpapers.com/images/featured/anime-meme-pfp-r7j6442x45qb56zs.jpg",
      matchHistory: [
        {
          type: "versus-classic",
          state: "2nd",
          totalPlayed: 3,
          correctNumber: 0,
          date: {
            $date: "2025-07-25T15:17:23.377Z"
          },
          difficulty: 3,
          categoryStats: {
            Community: {
              correct: 0,
              total: 3
            }
          },
          answerHistory: {
            1: "wrong",
            2: "missing",
            3: "wrong"
          },
          playerScoreSummary: {
            basic: {
              correct: 1,
              score: 100
            },
            tyz359: {
              correct: 0,
              score: 0
            }
          },
          color: "lose",
          teamScore: 0,
          teamAnswerHistory: {}
        },
        {
          type: "versus-knowledge",
          state: "1st",
          totalPlayed: 3,
          correctNumber: 2,
          date: {
            $date: "2025-07-25T15:19:13.454Z"
          },
          difficulty: 3,
          categoryStats: {
            Overall: {
              correct: 2,
              total: 3
            }
          },
          answerHistory: {
            1: "wrong",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 1,
              score: 100
            },
            tyz359: {
              correct: 2,
              score: 162
            }
          },
          color: "win",
          teamScore: 0,
          teamAnswerHistory: {}
        },
        {
          type: "versus-knowledge",
          state: "2nd",
          totalPlayed: 3,
          correctNumber: 0,
          date: {
            $date: "2025-07-25T15:20:26.182Z"
          },
          difficulty: 3,
          categoryStats: {
            Community: {
              correct: 0,
              total: 3
            }
          },
          answerHistory: {
            1: "missing",
            2: "missing",
            3: "wrong"
          },
          playerScoreSummary: {
            basic: {
              correct: 3,
              score: 276
            },
            tyz359: {
              correct: 0,
              score: 0
            }
          },
          color: "lose",
          teamScore: 0,
          teamAnswerHistory: {}
        },
        {
          type: "coop-knowledge",
          state: "coop",
          totalPlayed: 3,
          correctNumber: 0,
          date: {
            $date: "2025-07-25T15:21:16.422Z"
          },
          difficulty: 3,
          categoryStats: {
            Overall: {
              correct: 0,
              total: 3
            }
          },
          answerHistory: {
            1: "missing",
            2: "wrong",
            3: "wrong"
          },
          playerScoreSummary: {
            basic: {
              correct: 2,
              score: 0
            },
            tyz359: {
              correct: 0,
              score: 0
            }
          },
          color: "solo",
          teamScore: 176,
          teamAnswerHistory: {
            1: ["missing"],
            2: [
              "correct",
              {
                "Brr Brr Patapim": ["basic"],
                asd: ["tyz359"]
              }
            ],
            3: [
              "correct",
              {
                Doge: ["basic"],
                asd: ["tyz359"]
              }
            ]
          }
        },
        {
          type: "coop-knowledge",
          state: "coop",
          totalPlayed: 3,
          correctNumber: 0,
          date: {
            $date: "2025-07-25T15:21:41.586Z"
          },
          difficulty: 3,
          categoryStats: {
            Community: {
              correct: 0,
              total: 3
            }
          },
          answerHistory: {
            1: "wrong",
            2: "wrong",
            3: "wrong"
          },
          playerScoreSummary: {
            basic: {
              correct: 3,
              score: 0
            },
            tyz359: {
              correct: 0,
              score: 0
            }
          },
          color: "solo",
          teamScore: 327,
          teamAnswerHistory: {
            1: [
              "correct",
              {
                "Correct Answer": ["basic"],
                asd: ["tyz359"]
              }
            ],
            2: [
              "correct",
              {
                "Correct Answer": ["basic"],
                asd: ["tyz359"]
              }
            ],
            3: [
              "correct",
              {
                "Correct Answer": ["basic"],
                asd: ["tyz359"]
              }
            ]
          }
        },
        {
          type: "coop-classic",
          state: "coop",
          totalPlayed: 3,
          correctNumber: 3,
          date: {
            $date: "2025-07-25T15:22:22.654Z"
          },
          difficulty: 3,
          categoryStats: {
            General: {
              correct: 3,
              total: 3
            }
          },
          answerHistory: {
            1: "correct",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 3,
              score: 0
            },
            tyz359: {
              correct: 3,
              score: 0
            }
          },
          color: "solo",
          teamScore: 290,
          teamAnswerHistory: {
            1: [
              "correct",
              {
                3: ["basic", "tyz359"]
              }
            ],
            2: [
              "correct",
              {
                2: ["basic", "tyz359"]
              }
            ],
            3: [
              "correct",
              {
                2: ["basic", "tyz359"]
              }
            ]
          }
        },
        {
          type: "coop-classic",
          state: "coop",
          totalPlayed: 3,
          correctNumber: 3,
          date: {
            $date: "2025-07-25T15:22:43.382Z"
          },
          difficulty: 3,
          categoryStats: {
            Community: {
              correct: 3,
              total: 3
            }
          },
          answerHistory: {
            1: "correct",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 2,
              score: 0
            },
            tyz359: {
              correct: 3,
              score: 0
            }
          },
          color: "solo",
          teamScore: 281,
          teamAnswerHistory: {
            1: [
              "correct",
              {
                2: ["basic", "tyz359"]
              }
            ],
            2: [
              "correct",
              {
                2: ["basic", "tyz359"]
              }
            ],
            3: [
              "correct",
              {
                3: ["tyz359"],
                4: ["basic"]
              }
            ]
          }
        },
        {
          type: "versus-classic",
          state: "2nd",
          totalPlayed: 3,
          correctNumber: 1,
          date: {
            $date: "2025-07-25T15:53:52.761Z"
          },
          difficulty: 3,
          categoryStats: {
            Testing: {
              correct: 1,
              total: 3
            }
          },
          answerHistory: {
            1: "missing",
            2: "correct",
            3: "wrong"
          },
          playerScoreSummary: {
            basic: {
              correct: 2,
              score: 210
            },
            tyz359: {
              correct: 1,
              score: 200
            }
          },
          color: "lose",
          teamScore: 0,
          teamAnswerHistory: {}
        },
        {
          type: "versus-classic",
          state: "2nd",
          totalPlayed: 3,
          correctNumber: 1,
          date: {
            $date: "2025-07-25T16:29:58.887Z"
          },
          difficulty: 3,
          categoryStats: {
            Testing: {
              correct: 1,
              total: 3
            }
          },
          answerHistory: {
            1: "missing",
            2: "correct",
            3: "wrong"
          },
          playerScoreSummary: {
            basic: {
              correct: 2,
              score: 210
            },
            tyz359: {
              correct: 1,
              score: 200
            }
          },
          color: "lose",
          teamScore: 0,
          teamAnswerHistory: {}
        },
        {
          type: "versus-classic",
          state: "1st",
          totalPlayed: 3,
          correctNumber: 1,
          date: {
            $date: "2025-07-26T15:44:28.545Z"
          },
          difficulty: 3,
          categoryStats: {
            General: {
              correct: 1,
              total: 2
            },
            "Slang & Acronyms": {
              correct: 0,
              total: 1
            }
          },
          answerHistory: {
            1: "wrong",
            2: "wrong",
            3: "correct"
          },
          playerScoreSummary: {
            tyz359: {
              correct: 1,
              score: 100
            },
            basic: {
              correct: 1,
              score: 100
            }
          },
          color: "win",
          teamScore: 0,
          teamAnswerHistory: {}
        }
      ],
      reports: {
        basic: [
          "Inappropriate Username",
          "Cheating",
          "Harassment or Abusive Communications",
          "Spam"
        ]
      },
      leaderboardStats: {
        classic: {
          coop: {
            General: {
              correct: 15,
              total: 28
            },
            overall: {
              correct: 15,
              total: 28,
              score: 915,
              totalMatches: 0,
              wonMatches: 0
            },
            Community: {
              correct: 3,
              total: 3,
              score: 141,
              totalMatches: 0,
              wonMatches: 0
            }
          },
          versus: {
            General: {
              correct: 31,
              total: 63
            },
            overall: {
              correct: 42,
              total: 97,
              score: 5702,
              totalMatches: 23,
              wonMatches: 4
            },
            Community: {
              correct: 0,
              total: 6,
              score: 0,
              totalMatches: 2,
              wonMatches: 0
            },
            Testing: {
              correct: 11,
              total: 33
            },
            "Slang & Acronyms": {
              correct: 0,
              total: 1
            }
          },
          overall: {
            overall: {
              correct: 57,
              total: 125,
              score: 6617,
              totalMatches: 23,
              wonMatches: 4
            },
            General: {
              correct: 46,
              total: 91
            },
            Community: {
              correct: 3,
              total: 9,
              score: 141,
              totalMatches: 2,
              wonMatches: 0
            },
            Testing: {
              correct: 11,
              total: 33
            },
            "Slang & Acronyms": {
              correct: 0,
              total: 1
            }
          }
        },
        knowledge: {
          coop: {
            Overall: {
              correct: 0,
              total: 3
            },
            overall: {
              correct: 0,
              total: 3,
              score: 88,
              totalMatches: 0,
              wonMatches: 0
            },
            Community: {
              correct: 0,
              total: 3,
              score: 164,
              totalMatches: 0,
              wonMatches: 0
            }
          },
          versus: {
            Community: {
              correct: 4,
              total: 9,
              score: 420,
              totalMatches: 3,
              wonMatches: 0
            },
            overall: {
              correct: 2,
              total: 3,
              score: 162,
              totalMatches: 1,
              wonMatches: 1
            },
            Overall: {
              correct: 2,
              total: 3
            }
          },
          overall: {
            overall: {
              correct: 2,
              total: 6,
              score: 250,
              totalMatches: 1,
              wonMatches: 1
            },
            Community: {
              correct: 4,
              total: 12,
              score: 584,
              totalMatches: 3,
              wonMatches: 0
            },
            Overall: {
              correct: 2,
              total: 6
            }
          }
        }
      },
      powerups: {
        hintBoosts: 3000,
        addTimes: 3000,
        doublePoints: 3000
      }
    }
  ]);

  await Lobby.collection.insertOne({
    lobbyId: "9f7bf8ae-b09e-47bd-9524-544b92624a23",
    status: "in-progress",
    host: "tyz359",
    players: {
      tyz359: {
        ready: true,
        profilePicture:
          "https://wallpapers.com/images/featured/anime-meme-pfp-r7j6442x45qb56zs.jpg",
        chatBan: false
      },
      basic: {
        ready: false,
        profilePicture:
          "https://avatarfiles.alphacoders.com/335/thumb-1920-335829.jpg",
        chatBan: false
      }
    },
    gameType: "versus-classic",
    gameSettings: {
      numQuestions: 3,
      timePerQuestion: 10,
      difficulty: 3,
      categories: ["General", "Slang & Acronyms"],
      publicVisible: true,
      name: "tyz359's Lobby"
    },
    gameState: {
      currentQuestion: 3,
      questionIds: [
        {
          $oid: "6884f7ae2b65e5670ea46d61"
        },
        {
          $oid: "6884f7ae2b65e5670ea46d93"
        },
        {
          $oid: "6884f7ae2b65e5670ea46d9b"
        }
      ],
      question: {
        _id: {
          $oid: "6884f7ae2b65e5670ea46d9b"
        },
        question: "What does 'TFW' mean in meme culture?",
        options: [
          "That Feeling When",
          "Too Fast, Wow",
          "Totally Feeling Weird",
          "The Funniest Win"
        ],
        correctOption: 1,
        explanation:
          "'TFW' means 'That Feeling When', used to describe a relatable emotion.",
        category: "Slang & Acronyms",
        difficulty: 2,
        __v: 0
      },
      questionCategories: ["General", "Slang & Acronyms", "Slang & Acronyms"],
      playerStates: {
        tyz359: {
          selectedOption: 1,
          submitted: true,
          answerHistory: {
            1: "correct",
            2: "correct",
            3: "correct"
          },
          score: 314,
          timeSubmitted: {
            $date: "2025-07-26T15:44:43.943Z"
          },
          powerups: {
            "Hint Boost": [],
            "Add Time": false,
            "Double Points": false
          },
          correctScore: 100,
          streakBonus: 20,
          ready: true
        },
        basic: {
          selectedOption: 4,
          submitted: true,
          answerHistory: {
            1: "wrong",
            2: "correct",
            3: "wrong"
          },
          score: 100,
          timeSubmitted: {
            $date: "2025-07-26T15:44:45.349Z"
          },
          powerups: {
            "Hint Boost": [],
            "Add Time": false,
            "Double Points": false
          },
          correctScore: 0,
          streakBonus: 0
        }
      },
      answerRevealed: true,
      lastUpdate: {
        $date: "2025-07-26T15:44:41.371Z"
      },
      countdownStartTime: null,
      countdownStarted: false
    },
    chatMessages: [
      {
        sender: "System",
        message: "tyz359 has created the lobby.",
        timestamp: {
          $date: "2025-07-26T15:44:01.479Z"
        }
      },
      {
        sender: "System",
        message: "tyz359 has connected.",
        timestamp: {
          $date: "2025-07-26T15:44:01.507Z"
        }
      },
      {
        sender: "System",
        message: "tyz359 has updated the game settings.",
        timestamp: {
          $date: "2025-07-26T15:44:11.984Z"
        }
      },
      {
        sender: "System",
        message: "tyz359 has approved the join request of basic.",
        timestamp: {
          $date: "2025-07-26T15:44:12.974Z"
        }
      },
      {
        sender: "System",
        message: "basic has connected.",
        timestamp: {
          $date: "2025-07-26T15:44:13.053Z"
        }
      }
    ],
    lastActivity: {
      $date: "2025-07-26T15:44:45.354Z"
    },
    joinRequests: {}
  });
});

describe("POST /advancelobby/:lobbyId", () => {
  it("should reject unauthenticated access", async () => {
    const res = await request.post(
      "/api/lobby/advancelobby/9f7bf8ae-b09e-47bd-9524-544b92624a23"
    );
    expect(res.status).toBe(401);
  });

  it("should end lobby and update profile with leaderboard stats and match history", async () => {
    const res = await request
      .post("/api/lobby/advancelobby/9f7bf8ae-b09e-47bd-9524-544b92624a23")
      .set("Cookie", userCookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Lobby finished.");

    const updatedLobby = await Lobby.collection.findOne({
      lobbyId: "9f7bf8ae-b09e-47bd-9524-544b92624a23"
    });
    expect(updatedLobby.status).toBe("waiting");

    const player1 = await Profile.collection.findOne({ username: "basic" });
    const player2 = await Profile.collection.findOne({ username: "tyz359" });

    expect(player1).toMatchObject({
      username: "basic",
      currency: 92815,
      profilePicture:
        "https://avatarfiles.alphacoders.com/335/thumb-1920-335829.jpg",
      matchHistory: [
        {
          type: "versus-knowledge",
          state: "2nd",
          totalPlayed: 3,
          correctNumber: 1,
          date: {
            $date: "2025-07-25T15:19:13.454Z"
          },
          difficulty: 3,
          categoryStats: {
            Overall: {
              correct: 1,
              total: 3
            }
          },
          answerHistory: {
            1: "correct",
            2: "missing",
            3: "missing"
          },
          playerScoreSummary: {
            basic: {
              correct: 1,
              score: 100
            },
            tyz359: {
              correct: 2,
              score: 162
            }
          },
          color: "lose",
          teamScore: 0
        },
        {
          type: "versus-knowledge",
          state: "1st",
          totalPlayed: 3,
          correctNumber: 3,
          date: {
            $date: "2025-07-25T15:20:26.182Z"
          },
          difficulty: 3,
          categoryStats: {
            Community: {
              correct: 3,
              total: 3
            }
          },
          answerHistory: {
            1: "correct",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 3,
              score: 276
            },
            tyz359: {
              correct: 0,
              score: 0
            }
          },
          color: "win",
          teamScore: 0
        },
        {
          type: "coop-knowledge",
          state: "coop",
          totalPlayed: 3,
          correctNumber: 2,
          date: {
            $date: "2025-07-25T15:21:16.422Z"
          },
          difficulty: 3,
          categoryStats: {
            Overall: {
              correct: 2,
              total: 3
            }
          },
          answerHistory: {
            1: "missing",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 2,
              score: 0
            },
            tyz359: {
              correct: 0,
              score: 0
            }
          },
          color: "solo",
          teamScore: 176,
          teamAnswerHistory: {
            1: ["missing"],
            2: [
              "correct",
              {
                "Brr Brr Patapim": ["basic"],
                asd: ["tyz359"]
              }
            ],
            3: [
              "correct",
              {
                Doge: ["basic"],
                asd: ["tyz359"]
              }
            ]
          }
        },
        {
          type: "coop-knowledge",
          state: "coop",
          totalPlayed: 3,
          correctNumber: 3,
          date: {
            $date: "2025-07-25T15:21:41.586Z"
          },
          difficulty: 3,
          categoryStats: {
            Community: {
              correct: 3,
              total: 3
            }
          },
          answerHistory: {
            1: "correct",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 3,
              score: 0
            },
            tyz359: {
              correct: 0,
              score: 0
            }
          },
          color: "solo",
          teamScore: 327,
          teamAnswerHistory: {
            1: [
              "correct",
              {
                "Correct Answer": ["basic"],
                asd: ["tyz359"]
              }
            ],
            2: [
              "correct",
              {
                "Correct Answer": ["basic"],
                asd: ["tyz359"]
              }
            ],
            3: [
              "correct",
              {
                "Correct Answer": ["basic"],
                asd: ["tyz359"]
              }
            ]
          }
        },
        {
          type: "coop-classic",
          state: "coop",
          totalPlayed: 3,
          correctNumber: 3,
          date: {
            $date: "2025-07-25T15:22:22.654Z"
          },
          difficulty: 3,
          categoryStats: {
            General: {
              correct: 3,
              total: 3
            }
          },
          answerHistory: {
            1: "correct",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 3,
              score: 0
            },
            tyz359: {
              correct: 3,
              score: 0
            }
          },
          color: "solo",
          teamScore: 290,
          teamAnswerHistory: {
            1: [
              "correct",
              {
                3: ["basic", "tyz359"]
              }
            ],
            2: [
              "correct",
              {
                2: ["basic", "tyz359"]
              }
            ],
            3: [
              "correct",
              {
                2: ["basic", "tyz359"]
              }
            ]
          }
        },
        {
          type: "coop-classic",
          state: "coop",
          totalPlayed: 3,
          correctNumber: 2,
          date: {
            $date: "2025-07-25T15:22:43.382Z"
          },
          difficulty: 3,
          categoryStats: {
            Community: {
              correct: 2,
              total: 3
            }
          },
          answerHistory: {
            1: "correct",
            2: "correct",
            3: "wrong"
          },
          playerScoreSummary: {
            basic: {
              correct: 2,
              score: 0
            },
            tyz359: {
              correct: 3,
              score: 0
            }
          },
          color: "solo",
          teamScore: 281,
          teamAnswerHistory: {
            1: [
              "correct",
              {
                2: ["basic", "tyz359"]
              }
            ],
            2: [
              "correct",
              {
                2: ["basic", "tyz359"]
              }
            ],
            3: [
              "correct",
              {
                3: ["tyz359"],
                4: ["basic"]
              }
            ]
          }
        },
        {
          type: "versus-classic",
          state: "1st",
          totalPlayed: 3,
          correctNumber: 2,
          date: {
            $date: "2025-07-25T15:53:52.761Z"
          },
          difficulty: 3,
          categoryStats: {
            Testing: {
              correct: 2,
              total: 3
            }
          },
          answerHistory: {
            1: "missing",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 2,
              score: 210
            },
            tyz359: {
              correct: 1,
              score: 200
            }
          },
          color: "win",
          teamScore: 0
        },
        {
          type: "versus-classic",
          state: "1st",
          totalPlayed: 3,
          correctNumber: 2,
          date: {
            $date: "2025-07-25T16:29:58.887Z"
          },
          difficulty: 3,
          categoryStats: {
            Testing: {
              correct: 2,
              total: 3
            }
          },
          answerHistory: {
            1: "missing",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 2,
              score: 210
            },
            tyz359: {
              correct: 1,
              score: 200
            }
          },
          color: "win",
          teamScore: 0
        },
        {
          type: "versus-classic",
          state: "1st",
          totalPlayed: 3,
          correctNumber: 1,
          date: {
            $date: "2025-07-26T15:44:28.545Z"
          },
          difficulty: 3,
          categoryStats: {
            General: {
              correct: 1,
              total: 2
            },
            "Slang & Acronyms": {
              correct: 0,
              total: 1
            }
          },
          answerHistory: {
            1: "wrong",
            2: "wrong",
            3: "correct"
          },
          playerScoreSummary: {
            tyz359: {
              correct: 1,
              score: 100
            },
            basic: {
              correct: 1,
              score: 100
            }
          },
          color: "win",
          teamScore: 0
        },
        {
          type: "versus-classic",
          state: "2nd",
          totalPlayed: 3,
          correctNumber: 1,
          difficulty: 3,
          categoryStats: {
            General: {
              correct: 0,
              total: 1
            },
            "Slang & Acronyms": {
              correct: 1,
              total: 2
            }
          },
          answerHistory: {
            1: "wrong",
            2: "correct",
            3: "wrong"
          },
          playerScoreSummary: {
            tyz359: {
              correct: 3,
              score: 314
            },
            basic: {
              correct: 1,
              score: 100
            }
          },
          color: "lose",
          teamScore: 0
        }
      ],
      reports: {
        tyz359: ["Inappropriate Username"]
      },
      leaderboardStats: {
        classic: {
          solo: {
            General: {
              correct: 62,
              total: 105
            },
            overall: {
              correct: 62,
              total: 105,
              score: 7785,
              totalMatches: 0,
              wonMatches: 0
            }
          },
          coop: {
            General: {
              correct: 18,
              total: 31
            },
            overall: {
              correct: 18,
              total: 31,
              score: 987,
              totalMatches: 0,
              wonMatches: 0
            },
            Community: {
              correct: 2,
              total: 3,
              score: 141,
              totalMatches: 0,
              wonMatches: 0
            }
          },
          versus: {
            General: {
              correct: 45,
              total: 69
            },
            overall: {
              correct: 66,
              total: 102,
              score: 7214,
              totalMatches: 24,
              wonMatches: 20
            },
            Community: {
              correct: 2,
              total: 6,
              score: 300,
              totalMatches: 2,
              wonMatches: 2
            },
            Testing: {
              correct: 20,
              total: 30
            },
            "Slang & Acronyms": {
              correct: 1,
              total: 3
            }
          },
          overall: {
            overall: {
              correct: 146,
              total: 238,
              score: 15986,
              totalMatches: 24,
              wonMatches: 20
            },
            General: {
              correct: 125,
              total: 205
            },
            Community: {
              correct: 4,
              total: 9,
              score: 441,
              totalMatches: 2,
              wonMatches: 2
            },
            Testing: {
              correct: 20,
              total: 30
            },
            "Slang & Acronyms": {
              correct: 1,
              total: 3
            }
          }
        },
        knowledge: {
          solo: {
            Overall: {
              correct: 25,
              total: 31
            },
            overall: {
              correct: 25,
              total: 31,
              score: 3250,
              totalMatches: 0,
              wonMatches: 0
            },
            Community: {
              correct: 6,
              total: 6,
              score: 660,
              totalMatches: 0,
              wonMatches: 0
            }
          },
          coop: {
            Overall: {
              correct: 2,
              total: 3
            },
            overall: {
              correct: 2,
              total: 3,
              score: 88,
              totalMatches: 0,
              wonMatches: 0
            },
            Community: {
              correct: 3,
              total: 3,
              score: 164,
              totalMatches: 0,
              wonMatches: 0
            }
          },
          versus: {
            Community: {
              correct: 5,
              total: 6,
              score: 586,
              totalMatches: 2,
              wonMatches: 2
            },
            overall: {
              correct: 1,
              total: 3,
              score: 100,
              totalMatches: 1,
              wonMatches: 0
            },
            Overall: {
              correct: 1,
              total: 3
            }
          },
          overall: {
            overall: {
              correct: 28,
              total: 37,
              score: 3438,
              totalMatches: 1,
              wonMatches: 0
            },
            Overall: {
              correct: 28,
              total: 37
            },
            Community: {
              correct: 14,
              total: 15,
              score: 1410,
              totalMatches: 2,
              wonMatches: 2
            }
          }
        }
      },
      powerups: {
        hintBoosts: 3000,
        addTimes: 3000,
        doublePoints: 3000
      }
    });

    expect(player2).toMatchObject({
      username: "tyz359",
      currency: 116017,
      profilePicture:
        "https://wallpapers.com/images/featured/anime-meme-pfp-r7j6442x45qb56zs.jpg",
      matchHistory: [
        {
          type: "versus-knowledge",
          state: "1st",
          totalPlayed: 3,
          correctNumber: 2,
          date: {
            $date: "2025-07-25T15:19:13.454Z"
          },
          difficulty: 3,
          categoryStats: {
            Overall: {
              correct: 2,
              total: 3
            }
          },
          answerHistory: {
            1: "wrong",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 1,
              score: 100
            },
            tyz359: {
              correct: 2,
              score: 162
            }
          },
          color: "win",
          teamScore: 0
        },
        {
          type: "versus-knowledge",
          state: "2nd",
          totalPlayed: 3,
          correctNumber: 0,
          date: {
            $date: "2025-07-25T15:20:26.182Z"
          },
          difficulty: 3,
          categoryStats: {
            Community: {
              correct: 0,
              total: 3
            }
          },
          answerHistory: {
            1: "missing",
            2: "missing",
            3: "wrong"
          },
          playerScoreSummary: {
            basic: {
              correct: 3,
              score: 276
            },
            tyz359: {
              correct: 0,
              score: 0
            }
          },
          color: "lose",
          teamScore: 0
        },
        {
          type: "coop-knowledge",
          state: "coop",
          totalPlayed: 3,
          correctNumber: 0,
          date: {
            $date: "2025-07-25T15:21:16.422Z"
          },
          difficulty: 3,
          categoryStats: {
            Overall: {
              correct: 0,
              total: 3
            }
          },
          answerHistory: {
            1: "missing",
            2: "wrong",
            3: "wrong"
          },
          playerScoreSummary: {
            basic: {
              correct: 2,
              score: 0
            },
            tyz359: {
              correct: 0,
              score: 0
            }
          },
          color: "solo",
          teamScore: 176,
          teamAnswerHistory: {
            1: ["missing"],
            2: [
              "correct",
              {
                "Brr Brr Patapim": ["basic"],
                asd: ["tyz359"]
              }
            ],
            3: [
              "correct",
              {
                Doge: ["basic"],
                asd: ["tyz359"]
              }
            ]
          }
        },
        {
          type: "coop-knowledge",
          state: "coop",
          totalPlayed: 3,
          correctNumber: 0,
          date: {
            $date: "2025-07-25T15:21:41.586Z"
          },
          difficulty: 3,
          categoryStats: {
            Community: {
              correct: 0,
              total: 3
            }
          },
          answerHistory: {
            1: "wrong",
            2: "wrong",
            3: "wrong"
          },
          playerScoreSummary: {
            basic: {
              correct: 3,
              score: 0
            },
            tyz359: {
              correct: 0,
              score: 0
            }
          },
          color: "solo",
          teamScore: 327,
          teamAnswerHistory: {
            1: [
              "correct",
              {
                "Correct Answer": ["basic"],
                asd: ["tyz359"]
              }
            ],
            2: [
              "correct",
              {
                "Correct Answer": ["basic"],
                asd: ["tyz359"]
              }
            ],
            3: [
              "correct",
              {
                "Correct Answer": ["basic"],
                asd: ["tyz359"]
              }
            ]
          }
        },
        {
          type: "coop-classic",
          state: "coop",
          totalPlayed: 3,
          correctNumber: 3,
          date: {
            $date: "2025-07-25T15:22:22.654Z"
          },
          difficulty: 3,
          categoryStats: {
            General: {
              correct: 3,
              total: 3
            }
          },
          answerHistory: {
            1: "correct",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 3,
              score: 0
            },
            tyz359: {
              correct: 3,
              score: 0
            }
          },
          color: "solo",
          teamScore: 290,
          teamAnswerHistory: {
            1: [
              "correct",
              {
                3: ["basic", "tyz359"]
              }
            ],
            2: [
              "correct",
              {
                2: ["basic", "tyz359"]
              }
            ],
            3: [
              "correct",
              {
                2: ["basic", "tyz359"]
              }
            ]
          }
        },
        {
          type: "coop-classic",
          state: "coop",
          totalPlayed: 3,
          correctNumber: 3,
          date: {
            $date: "2025-07-25T15:22:43.382Z"
          },
          difficulty: 3,
          categoryStats: {
            Community: {
              correct: 3,
              total: 3
            }
          },
          answerHistory: {
            1: "correct",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            basic: {
              correct: 2,
              score: 0
            },
            tyz359: {
              correct: 3,
              score: 0
            }
          },
          color: "solo",
          teamScore: 281,
          teamAnswerHistory: {
            1: [
              "correct",
              {
                2: ["basic", "tyz359"]
              }
            ],
            2: [
              "correct",
              {
                2: ["basic", "tyz359"]
              }
            ],
            3: [
              "correct",
              {
                3: ["tyz359"],
                4: ["basic"]
              }
            ]
          }
        },
        {
          type: "versus-classic",
          state: "2nd",
          totalPlayed: 3,
          correctNumber: 1,
          date: {
            $date: "2025-07-25T15:53:52.761Z"
          },
          difficulty: 3,
          categoryStats: {
            Testing: {
              correct: 1,
              total: 3
            }
          },
          answerHistory: {
            1: "missing",
            2: "correct",
            3: "wrong"
          },
          playerScoreSummary: {
            basic: {
              correct: 2,
              score: 210
            },
            tyz359: {
              correct: 1,
              score: 200
            }
          },
          color: "lose",
          teamScore: 0
        },
        {
          type: "versus-classic",
          state: "2nd",
          totalPlayed: 3,
          correctNumber: 1,
          date: {
            $date: "2025-07-25T16:29:58.887Z"
          },
          difficulty: 3,
          categoryStats: {
            Testing: {
              correct: 1,
              total: 3
            }
          },
          answerHistory: {
            1: "missing",
            2: "correct",
            3: "wrong"
          },
          playerScoreSummary: {
            basic: {
              correct: 2,
              score: 210
            },
            tyz359: {
              correct: 1,
              score: 200
            }
          },
          color: "lose",
          teamScore: 0
        },
        {
          type: "versus-classic",
          state: "1st",
          totalPlayed: 3,
          correctNumber: 1,
          date: {
            $date: "2025-07-26T15:44:28.545Z"
          },
          difficulty: 3,
          categoryStats: {
            General: {
              correct: 1,
              total: 2
            },
            "Slang & Acronyms": {
              correct: 0,
              total: 1
            }
          },
          answerHistory: {
            1: "wrong",
            2: "wrong",
            3: "correct"
          },
          playerScoreSummary: {
            tyz359: {
              correct: 1,
              score: 100
            },
            basic: {
              correct: 1,
              score: 100
            }
          },
          color: "win",
          teamScore: 0
        },
        {
          type: "versus-classic",
          state: "1st",
          totalPlayed: 3,
          correctNumber: 3,
          difficulty: 3,
          categoryStats: {
            General: {
              correct: 1,
              total: 1
            },
            "Slang & Acronyms": {
              correct: 2,
              total: 2
            }
          },
          answerHistory: {
            1: "correct",
            2: "correct",
            3: "correct"
          },
          playerScoreSummary: {
            tyz359: {
              correct: 3,
              score: 314
            },
            basic: {
              correct: 1,
              score: 100
            }
          },
          color: "win",
          teamScore: 0
        }
      ],
      reports: {
        basic: [
          "Inappropriate Username",
          "Cheating",
          "Harassment or Abusive Communications",
          "Spam"
        ]
      },
      leaderboardStats: {
        classic: {
          coop: {
            General: {
              correct: 15,
              total: 28
            },
            overall: {
              correct: 15,
              total: 28,
              score: 915,
              totalMatches: 0,
              wonMatches: 0
            },
            Community: {
              correct: 3,
              total: 3,
              score: 141,
              totalMatches: 0,
              wonMatches: 0
            }
          },
          versus: {
            General: {
              correct: 32,
              total: 64
            },
            overall: {
              correct: 45,
              total: 100,
              score: 6016,
              totalMatches: 24,
              wonMatches: 5
            },
            Community: {
              correct: 0,
              total: 6,
              score: 0,
              totalMatches: 2,
              wonMatches: 0
            },
            Testing: {
              correct: 11,
              total: 33
            },
            "Slang & Acronyms": {
              correct: 2,
              total: 3
            }
          },
          overall: {
            overall: {
              correct: 60,
              total: 128,
              score: 6931,
              totalMatches: 24,
              wonMatches: 5
            },
            General: {
              correct: 47,
              total: 92
            },
            Community: {
              correct: 3,
              total: 9,
              score: 141,
              totalMatches: 2,
              wonMatches: 0
            },
            Testing: {
              correct: 11,
              total: 33
            },
            "Slang & Acronyms": {
              correct: 2,
              total: 3
            }
          }
        },
        knowledge: {
          coop: {
            Overall: {
              correct: 0,
              total: 3
            },
            overall: {
              correct: 0,
              total: 3,
              score: 88,
              totalMatches: 0,
              wonMatches: 0
            },
            Community: {
              correct: 0,
              total: 3,
              score: 164,
              totalMatches: 0,
              wonMatches: 0
            }
          },
          versus: {
            Community: {
              correct: 4,
              total: 9,
              score: 420,
              totalMatches: 3,
              wonMatches: 0
            },
            overall: {
              correct: 2,
              total: 3,
              score: 162,
              totalMatches: 1,
              wonMatches: 1
            },
            Overall: {
              correct: 2,
              total: 3
            }
          },
          overall: {
            overall: {
              correct: 2,
              total: 6,
              score: 250,
              totalMatches: 1,
              wonMatches: 1
            },
            Community: {
              correct: 4,
              total: 12,
              score: 584,
              totalMatches: 3,
              wonMatches: 0
            },
            Overall: {
              correct: 2,
              total: 6
            }
          }
        }
      },
      powerups: {
        hintBoosts: 3000,
        addTimes: 3000,
        doublePoints: 3000
      }
    });
  });
});
