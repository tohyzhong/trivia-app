import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import defaultAvatar from "../../../assets/default-avatar.jpg";

import { playClickSound } from "../../../utils/soundManager";
import { setError } from "../../../redux/errorSlice";
import { FaExclamation } from "react-icons/fa";
import ReportUser from "./ReportUser";

interface GameUsersProps {
  lobbyId: string;
  usernames: { [key: string]: { [key: string]: boolean | string } };
  profilePictures: { [key: string]: string };
  joinRequests: { [key: string]: { [key: string]: boolean | string } };
  gameType: string;
  handleLeave: () => void;
  host?: string;
}

const GameUsers: React.FC<GameUsersProps> = (props) => {
  const {
    lobbyId,
    usernames,
    profilePictures,
    joinRequests,
    gameType,
    handleLeave,
    host
  } = props;
  const loggedInUser = useSelector((state: RootState) => state.user.username);

  const alreadyIn = Object.keys(usernames || {});

  // Render all users and avatars
  const dispatch = useDispatch();

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
      await response.json();
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

  // User report handlers
  const [reportPopupActive, setReportPopupActive] = useState(false);
  const [usernameToReport, setUsernameToReport] = useState("");
  const handleReport = async (username: string) => {
    setReportPopupActive(true);
    setUsernameToReport(username);
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

      {reportPopupActive && (
        <ReportUser
          username={usernameToReport}
          setActive={setReportPopupActive}
          lobbyId={lobbyId}
        />
      )}

      <div className="game-lobby-users-list">
        {[
          ...Object.keys(usernames ?? {}),
          ...Object.keys(joinRequests ?? {})
        ].map((username, index) => {
          const profilePic =
            profilePictures?.[username] ||
            joinRequests?.[username]?.profilePicture ||
            defaultAvatar;
          const isReady = usernames[username]?.ready || false;
          const isPending = !alreadyIn.includes(username);
          return (
            <ul
              key={username + index}
              className={
                isPending
                  ? "game-lobby-user-pending-approval"
                  : "game-lobby-user"
              }
            >
              <img
                src={String(profilePic)}
                alt={username + "'s Profile Picture"}
              />
              <h3 className="username-lobby">
                {username === host ? host + " (Host)" : username}
                {username !== loggedInUser && (
                  <span
                    className="report-button"
                    onClick={() => handleReport(username)}
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

              {!isPending && (
                <h3 className={isReady ? "state-ready" : "state-notready"}>
                  {isReady ? "Ready" : "Not Ready"}
                </h3>
              )}

              {loggedInUser === host && isPending && (
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
                              usernameToApprove: username,
                              gameType: gameType
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
                            usernameToKick: username,
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

              {loggedInUser === host && username !== host && !isPending && (
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
                          usernameToKick: username,
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
          );
        })}
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
