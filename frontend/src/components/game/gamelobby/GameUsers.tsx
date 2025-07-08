import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../../../assets/default-avatar.jpg";
import { clearLobby } from "../../../redux/lobbySlice";

import { playClickSound } from "../../../utils/soundManager";
import ErrorPopup from "../../authentication/subcomponents/ErrorPopup";
import { getNameOfJSDocTypedef } from "typescript";

interface User {
  username: string;
  profilePicture: string;
}

interface GameUsersProps {
  lobbyId: string;
  usernames: { [key: string]: { [key: string]: boolean } };
  joinRequests: { [key: string]: boolean };
  gameType: string;
  handleLeave: Function;
  host?: string;
}

const GameUsers: React.FC<GameUsersProps> = (props) => {
  const { lobbyId, usernames, joinRequests, gameType, handleLeave, host } =
    props;
  const loggedInUser = useSelector((state: RootState) => state.user.username);
  const [users, setUsers] = useState<User[]>([]);
  const [errorPopupMessage, setErrorPopupMessage] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState(false);

  const alreadyIn = Object.keys(usernames || {});

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
          body: JSON.stringify({
            usernames: Object.keys(usernames).concat(
              Object.keys(joinRequests || {})
            )
          })
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
  }, [usernames, joinRequests]);

  // Ready button
  const handleReady = async () => {
    playClickSound();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/lobby/ready/${lobbyId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error(error);
      setErrorPopupMessage(error.message || "Unable to change ready status");
      setSuccessMessage(false);
    }
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
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error(error);
      setErrorPopupMessage(error.message || "Unable to start lobby");
      setSuccessMessage(false);
    }
  };

  // Leaving Lobby
  const handleLeaveLocal = async () => {
    playClickSound();
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/lobby/leave/${lobbyId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ player: loggedInUser })
        }
      );
      const data = await response.json();
      if (response.ok) {
        handleLeave();
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
          success={successMessage}
        />
      )}

      {!gameType.includes("solo") ? (
        <div className="game-lobby-users-header">
          <h1>Players</h1>
          <button
            className="invite-link"
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/play/join/${lobbyId}`
              );
              setErrorPopupMessage("Invite Link Copied!");
              setSuccessMessage(true);
            }}
          >
            Copy Invite Link
          </button>
        </div>
      ) : (
        <div className="game-lobby-users-header-solo">
          <h1>Players</h1>
        </div>
      )}

      <div className="game-lobby-users-list">
        {users.length > 0 &&
          users.map((user, index) => (
            <ul
              key={user.username + index}
              className={
                !alreadyIn.includes(user.username)
                  ? "game-lobby-user-pending-approval"
                  : "game-lobby-user"
              }
            >
              <img
                src={user.profilePicture || defaultAvatar}
                alt={user.username + "'s Profile Picture"}
              />
              <h3 className="username-lobby">
                {user.username === host ? host + " (Host)" : user.username}
              </h3>
              {!alreadyIn.includes(user.username) ? (
                <></>
              ) : (
                <h3
                  className={
                    usernames[user.username]?.ready
                      ? "state-ready"
                      : "state-notready"
                  }
                >
                  {usernames[user.username]?.ready ? "Ready" : "Not Ready"}
                </h3>
              )}

              {loggedInUser === host && !alreadyIn.includes(user.username) && (
                <button
                  className="approve-join"
                  onClick={async () => {
                    await fetch(
                      `${import.meta.env.VITE_API_URL}/api/lobby/approve/${lobbyId}`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                          usernameToApprove: user.username
                        })
                      }
                    );
                  }}
                >
                  Approve
                </button>
              )}

              {loggedInUser === host && user.username !== host && (
                <button
                  className="kick-user"
                  onClick={async () => {
                    await fetch(
                      `${import.meta.env.VITE_API_URL}/api/lobby/kick/${lobbyId}`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ usernameToKick: user.username })
                      }
                    );
                  }}
                >
                  Kick
                </button>
              )}
            </ul>
          ))}
      </div>
      <div className="game-lobby-buttons">
        <button className="leave-button" onClick={handleLeaveLocal}>
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
