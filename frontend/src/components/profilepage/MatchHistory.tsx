import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/matchhistory.css";

interface MatchDetails {
  type: string;
  state: string;
  totalPlayed: number;
  correctNumber: number;
  date: Date;
}

const MatchHistory: React.FC = () => {
  // Loading state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // User details
  const { username } = useParams<{ username: string }>();

  // Match history details
  const [matchHistory, setMatchHistory] = useState<MatchDetails[]>([]);

  // Navigate back to profile
  const navigate = useNavigate();
  const handleBackClick = () => {
    navigate(`/profile/${username}`);
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
      console.log(data);
      if (!response.ok) {
        throw new Error(data.message);
      } else {
        setMatchHistory(data.matchHistory);
      }
    } catch (error) {
      console.error("Error fetching match history:", error);
      setError(true);
    }
  };

  useEffect(() => {
    if (username) {
      getMatchHistory();
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    console.log(matchHistory);
  }, [matchHistory]);

  return loading ? (
    <></>
  ) : (
    <div className="match-history-div-full">
      <div className="match-history-div-header">
        <h1>
          <span onClick={handleBackClick}>{username}'s</span> Game History (Last
          10)
        </h1>
      </div>
      <div className="match-history-container">
        {matchHistory.map((match, index) => {
          const date = new Date(match.date);
          const formatted = date.toLocaleString(undefined, {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          });

          return (
            <ul
              key={`match-${index}`}
              className={`match-history-item ${match.state}`}
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
                    {match.correctNumber}
                    <br />
                    <strong>Total Questions: </strong>
                    {match.totalPlayed}
                  </p>
                </div>
              </div>
              <h4
                className="match-detailed-view"
                onClick={() => alert("Feature coming soon...")}
              >
                See Details →
              </h4>
            </ul>
          );
        })}
      </div>
    </div>
  );
};

export default MatchHistory;
