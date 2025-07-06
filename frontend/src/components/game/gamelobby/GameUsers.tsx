import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../../../assets/default-avatar.jpg";
import { clearLobby } from "../../../redux/lobbySlice";

import { playClickSound } from "../../../utils/soundManager";
import ErrorPopup from "../../authentication/subcomponents/ErrorPopup";

interface User {
  username: string;
  profilePicture: string;
}

interface GameUsersProps {
  lobbyId: string;
  usernames: string[];
}

const GameUsers: React.FC<GameUsersProps> = (props) => {
  const { lobbyId, usernames } = props;
  const loggedInUser = useSelector((state: RootState) => state.user.username);
  const [users, setUsers] = useState<User[]>([]);
  const [errorPopupMessage, setErrorPopupMessage] = React.useState("");

  // Render all users and avatars
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const renderUsers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/get-profiles`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ usernames })
        }
      );
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
      } else {
        throw new Error();
      }
    } catch (error) {
      console.error(error);
      navigate("/", {
        state: {
          errorMessage:
            "Error loading lobby. A report has been sent to the admins"
        }
      });
    }
  };

  useEffect(() => {
    if (usernames) renderUsers();
  }, [usernames]);

  // Ready button
  const handleReady = () => {
    playClickSound();
    // TODO for multiplayer
  };

  // Start button
  const handleStart = async () => {
    playClickSound();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/lobby/startlobby/${lobbyId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        }
      );
      if (!response.ok) {
        throw new Error();
      }
    } catch (error) {
      console.error(error);
      setErrorPopupMessage("Unable to start lobby");
    }
  };

  // Leaving Lobby
  const handleLeave = async () => {
    playClickSound();
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/lobby/solo/leave/${lobbyId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ player: loggedInUser })
        }
      );
      const data = await response.json();
      if (response.ok) {
        dispatch(clearLobby());
        navigate("/play", { state: { errorMessage: "You left the lobby." } });
      } else {
        throw new Error();
      }
    } catch (error) {
      console.error(error);
      navigate("/", {
        state: {
          errorMessage:
            "Error loading lobby. A report has been sent to the admins"
        }
      });
    }
  };

  return (
    <div className="game-lobby-users">
      {errorPopupMessage !== "" && (
        <ErrorPopup
          message={errorPopupMessage}
          setMessage={setErrorPopupMessage}
        />
      )}
      <div className="game-lobby-users-header">
        <h1>Players</h1>
      </div>
      <div className="game-lobby-users-list">
        {users.length > 0 &&
          users.map((user, index) => (
            <ul key={user.username + index} className="game-lobby-user">
              <img
                src={user.profilePicture || defaultAvatar}
                alt={user.username + "'s Profile Picture"}
              />
              <h3>&nbsp;{user.username}</h3>
            </ul>
          ))}
      </div>
      <div className="game-lobby-buttons">
        <button className="leave-button" onClick={handleLeave}>
          Leave
        </button>
        <button className="ready-button" onClick={handleReady}>
          Ready
        </button>
        <button className="start-button" onClick={handleStart}>
          Start
        </button>
      </div>
    </div>
  );
};

export default GameUsers;
