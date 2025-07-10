import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../../../assets/default-avatar.jpg";

import { playClickSound } from "../../../utils/soundManager";
import { setError } from "../../../redux/errorSlice";
import { FaExclamation } from "react-icons/fa";

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
      navigate("/");
      dispatch(
        setError({
          errorMessage:
            "Error loading lobby. A report has been sent to the admins",
          success: false
        })
      );
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
      dispatch(
        setError({
          errorMessage: "Unable to change ready status",
          success: false
        })
      );
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
      dispatch(
        setError({
          errorMessage: error.message || "Unable to start lobby.",
          success: false
        })
      );
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
      dispatch(
        setError({ errorMessage: "Error leaving lobby.", success: false })
      );
    }
  };

  const handleReport = async (usernameToReport: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            reported: usernameToReport,
            source: "lobby",
            lobbyId
          })
        }
      );

      const data = await response.json();
      if (response.ok) {
        dispatch(
          setError({
            errorMessage: "User reported successfully.",
            success: true
          })
        );
      } else {
        dispatch(
          setError({
            errorMessage: `Failed to report user: ${data.message}`,
            success: false
          })
        );
      }
    } catch (err) {
      console.error("Error reporting user:", err);
      dispatch(
        setError({
          errorMessage: `Error reporting user: ${String(err)}`,
          success: false
        })
      );
    }
  };

  return (
    <div className="game-lobby-users">
      {!gameType.includes("solo") ? (
        <div className="game-lobby-users-header">
          <h1>Players</h1>
          <button
            className="invite-link"
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/play/join/${lobbyId}`
              );
              dispatch(
                setError({ errorMessage: "Invite Link Copied!", success: true })
              );
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
                {user.username !== loggedInUser && (
                  <span
                    className="report-button"
                    onClick={() => handleReport(user.username)}
                    title="Report User"
                    style={{ cursor: "pointer", marginLeft: "10px" }}
                  >
                    <FaExclamation
                      color="red"
                      style={{ verticalAlign: "middle" }}
                    />
                  </span>
                )}
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
                <>
                  <button
                    className="approve-join"
                    onClick={async () => {
                      try {
                        const res = await fetch(
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

                        const data = await res.json();
                        if (!res.ok) {
                          throw new Error(data.message);
                        } else {
                          dispatch(
                            setError({
                              errorMessage: "User approved.",
                              success: true
                            })
                          );
                        }
                      } catch (err) {
                        dispatch(
                          setError({
                            errorMessage: `Error approving user: ${String(err) ?? "Unknown"}`,
                            success: false
                          })
                        );
                      }
                    }}
                  >
                    Approve
                  </button>
                  <button
                    className="kick-user"
                    onClick={async () => {
                      await fetch(
                        `${import.meta.env.VITE_API_URL}/api/lobby/kick/${lobbyId}`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({
                            usernameToKick: user.username,
                            isRejection: true
                          })
                        }
                      );
                    }}
                  >
                    Reject
                  </button>
                </>
              )}

              {loggedInUser === host &&
                user.username !== host &&
                alreadyIn.includes(user.username) && (
                  <button
                    className="kick-user"
                    onClick={async () => {
                      await fetch(
                        `${import.meta.env.VITE_API_URL}/api/lobby/kick/${lobbyId}`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({
                            usernameToKick: user.username,
                            isRejection: false
                          })
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
