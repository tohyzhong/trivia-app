import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { Link } from "react-router-dom";

const PlayButton = () => {
  const username = useSelector((state: RootState) => state.user.username);
  const lobby = useSelector((state: RootState) => state.lobby);

  return (
    <div>
      <Link
        className="button-link-container"
        to={
          username
            ? lobby.lobbyId
              ? `/play/${lobby.lobbyId}`
              : "/play"
            : "/auth/login?error=login_required"
        }
      >
        <button className="play-button">
          {lobby.lobbyId ? "Return to Lobby" : "Play The Rizz Quiz"}
        </button>
      </Link>
    </div>
  );
};

export default PlayButton;
