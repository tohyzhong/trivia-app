import React from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/LobbyNotFound.css";

const LobbyNotFound = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate("/play");
  };

  return (
    <div className="lobby-not-found-container">
      <h1 className="lobby-not-found-title">Oops! Lobby Not Found</h1>
      <p className="lobby-not-found-message">
        The lobby you're trying to access doesn't exist or has expired.
      </p>
      <button onClick={handleBackToHome} className="lobby-not-found-button">
        Back to Home
      </button>
    </div>
  );
};

export default LobbyNotFound;
