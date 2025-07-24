import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../../styles/matchhistory.css";
import { motion } from "framer-motion";

interface MatchDetails {
  type: string;
  state: string;
  totalPlayed: number;
  correctNumber: number;
  date: Date;
  difficulty: number;
  categoryStats: { [key: string]: { [key: string]: number } }; // categoryStats keys are categories, each value consists of 'correct' number and 'total' number
  answerHistory: { [key: number]: string }; // answerHistory keys are integers, each value is either "correct" or "wrong" or "missing"
  playerScoreSummary: { [key: string]: { [key: string]: number } }; // keys are usernames, each value has a key 'correct' with value the number of correct answers
  color: string; // solo / rank (1st 2nd 3rd 4th...)
  teamScore: number;
  teamAnswerHistory: { [key: number]: any[] };
}

const MatchHistory: React.FC = () => {
  // Loading state
  const [loading, setLoading] = useState<boolean>(true);

  // User details
  const { username } = useParams<{ username: string }>();

  // Match history details
  const [matchHistory, setMatchHistory] = useState<MatchDetails[]>([]);
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(
    new Set()
  );

  const toggleDetails = (index: number) => {
    setExpandedIndexes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getMatchHistory = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/matchhistory/${username}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setMatchHistory(data.matchHistory);
    } catch (error) {
      console.error("Error fetching match history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) getMatchHistory();
  }, [username]);

  return loading ? (
    <></>
  ) : (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="match-history-div-full">
        <div className="match-history-div-header">
          <h1>
            <Link className="user-name" to={`/profile/${username}`}>
              {username}&apos;s
            </Link>{" "}
            Game History (Last 10)
          </h1>
        </div>
        <div className="match-history-container">
          {matchHistory.map((match, index) => {
            const date = new Date(match.date);
            const parts = date
              .toLocaleString(undefined, {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true
              })
              .replace(/,/g, "")
              .split(" ");

            const formatted = `${parts[0]}, ${parts[2]} ${parts[1]} ${parts[3]}, ${parts[4]} ${parts[5].toUpperCase()}`;

            const isExpanded = expandedIndexes.has(index);

            return (
              <div key={`match-${index}`}>
                <ul
                  className={`match-history-item ${match.color}`}
                  onClick={() => toggleDetails(index)}
                >
                  <div className="match-date">
                    <h3>Date Finished:</h3>
                    <h4>{formatted}</h4>
                  </div>
                  <h3 className="match-state">{match.state.toUpperCase()}</h3>
                  <div className="match-details">
                    <div className="match-type">
                      <h3>
                        Mode: <br />
                        {match.type}
                      </h3>
                    </div>
                    <div className="match-stats">
                      <h3>Game Stats:</h3>
                      <p>
                        <strong>Correctly Answered: </strong>
                        {match.type.includes("coop")
                          ? Object.values(match.teamAnswerHistory).filter(
                              (entry) => entry[0] === "correct"
                            ).length
                          : match.correctNumber}
                        <br />
                        <strong>Total Questions: </strong>
                        {match.totalPlayed}
                      </p>
                    </div>
                  </div>
                  <h4 className="match-detailed-view">
                    {isExpanded ? "Collapse ↑" : "See Details →"}
                  </h4>
                </ul>

                {isExpanded && (
                  <div className="match-details-expanded">
                    <div className="difficulty">
                      <h4>Difficulty: {match.difficulty}</h4>
                    </div>

                    {match.type.includes("coop") && (
                      <div className="answer-history">
                        <h4>Team Answer History:</h4>
                        <div className="dots-container">
                          {Object.entries(match.teamAnswerHistory).map(
                            ([q, result]) => {
                              const color =
                                result[0] === "correct"
                                  ? "green"
                                  : result[0] === "wrong"
                                    ? "red"
                                    : "gray";
                              return (
                                <span
                                  key={`dot-${index}-${q}`}
                                  className="dot"
                                  style={{ backgroundColor: color }}
                                  title={`Q${q}: ${result}`}
                                ></span>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}

                    <div className="answer-history">
                      <h4>Answer History:</h4>
                      <div className="dots-container">
                        {Object.entries(match.answerHistory).map(
                          ([q, result]) => {
                            const color =
                              result === "correct"
                                ? "green"
                                : result === "wrong"
                                  ? "red"
                                  : "gray";
                            return (
                              <span
                                key={`dot-${index}-${q}`}
                                className="dot"
                                style={{ backgroundColor: color }}
                                title={`Q${q}: ${result}`}
                              ></span>
                            );
                          }
                        )}
                      </div>
                    </div>

                    <div className="category-stats">
                      <h4>{username}&apos;s Stats:</h4>
                      <ul>
                        {Object.entries(match.categoryStats).map(
                          ([cat, stat]) => (
                            <li key={cat}>
                              <strong>{cat}</strong>: {stat.correct} Correct /{" "}
                              {stat.total} Questions
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="player-scores">
                      <h4>Player Scores:</h4>
                      <ul>
                        {Object.entries(match.playerScoreSummary)
                          .sort(([, a], [, b]) => b.score - a.score)
                          .map(([player, stat]) => (
                            <li
                              className={
                                player === username
                                  ? "player-score-user"
                                  : "player-score"
                              }
                              key={player}
                            >
                              <Link
                                className="player-name"
                                to={`/profile/${player}`}
                              >
                                {player}
                              </Link>
                              <span className="player-score-value">
                                {match.type.includes("coop")
                                  ? match.teamScore
                                  : stat.score}{" "}
                                Score
                              </span>
                              <span className="player-correct-value">
                                {stat.correct} Correct
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default MatchHistory;
