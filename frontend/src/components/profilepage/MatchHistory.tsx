import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { RootState } from "../../redux/store";
import "../../styles/matchhistory.css";

interface MatchDetails {
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
      console.log(matchHistory);
    }
  }, [username]);

  return loading ? (
    <></>
  ) : (
    <div className="match-history-div-full">
      <div className="match-history-div-header">
        <h1>
          <span onClick={handleBackClick}>{username}'s</span> Match History
        </h1>
      </div>
      <div className="match-history-container"></div>
    </div>
  );
};

export default MatchHistory;
