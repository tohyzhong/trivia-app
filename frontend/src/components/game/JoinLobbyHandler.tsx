import React, { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import GameLoading from "./gamelobby/GameLoading";
import ErrorPopup from "../authentication/subcomponents/ErrorPopup";
import { useLobbySocketRedirect } from "../../hooks/useLobbySocketRedirect";
import { useInitSound } from "../../hooks/useInitSound";
import useBGMResumeOverlay from "../../hooks/useBGMResumeOverlay";
import PauseOverlay from "./PauseOverlay";
import { IoClose, IoSettingsOutline } from "react-icons/io5";
import { playClickSound } from "../../utils/soundManager";
import SoundSettings from "./subcomponents/SoundSettings";
import "../../styles/game.css";

const JoinLobbyHandler: React.FC = () => {
  useInitSound("Lobby");
  const { bgmBlocked, handleResume } = useBGMResumeOverlay("Lobby");
  const [isSoundPopupOpen, setIsSoundPopupOpen] = useState<boolean>(false);

  const [status, setStatus] = useState<
    "pending" | "approved" | "rejected" | "error"
  >("pending");
  const [error, setError] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();
  const { lobbyId } = useParams();
  const loggedInUser = useSelector((state: RootState) => state.user.username);

  useLobbySocketRedirect(loggedInUser);

  useEffect(() => {
    if (!lobbyId) return;

    const requestJoin = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/lobby/requestjoin/${lobbyId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
          }
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message || "There was an error. Please try again later."
          );
        }

        if (res.status === 200 && data.message === "Already in lobby.") {
          setStatus("approved");
          navigate(`/lobby/${lobbyId}`);
        } else if (res.status === 200) {
          setStatus("pending");
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
        setError(err.message);
      }
    };

    requestJoin();

    socket.emit("joinLobby", lobbyId);

    socket.on("kickUser", setStatus("rejected"));

    return () => {
      socket.emit("leaveLobby", lobbyId);
      socket.off("kickUser");
    };
  }, [lobbyId]);

  useEffect(() => {
    if (status === "rejected") {
      setError("You were rejected from the lobby.");
    }
  }, [status]);

  if (status === "pending") {
    return (
      <>
        {bgmBlocked && <PauseOverlay onResume={handleResume} />}
        <IoSettingsOutline
          onClick={() => {
            playClickSound();
            setIsSoundPopupOpen(true);
          }}
          className="sound-settings-icon"
        />
        <p className="hover-text-2 sound-settings-icon-text">Sound Settings</p>

        {isSoundPopupOpen && (
          <div className="sound-settings-popup">
            <IoClose
              className="submode-select-close"
              onClick={() => {
                playClickSound();
                setIsSoundPopupOpen(false);
              }}
            />
            <SoundSettings />
          </div>
        )}
        <GameLoading message="Waiting for host to approve your request..." />
      </>
    );
  }

  return (
    <div>
      {bgmBlocked && <PauseOverlay onResume={handleResume} />}
      <IoSettingsOutline
        onClick={() => {
          playClickSound();
          setIsSoundPopupOpen(true);
        }}
        className="sound-settings-icon"
      />
      <p className="hover-text-2 sound-settings-icon-text">Sound Settings</p>

      {isSoundPopupOpen && (
        <div className="sound-settings-popup">
          <IoClose
            className="submode-select-close"
            onClick={() => {
              playClickSound();
              setIsSoundPopupOpen(false);
            }}
          />
          <SoundSettings />
        </div>
      )}
      <ErrorPopup message={error} setMessage={setError} />
    </div>
  );
};

export default JoinLobbyHandler;
