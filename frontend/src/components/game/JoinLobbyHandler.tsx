import React, { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import GameLoading from "./gamelobby/GameLoading";
import { useLobbySocketRedirect } from "../../hooks/useLobbySocketRedirect";
import { useInitSound } from "../../hooks/useInitSound";
import useBGMResumeOverlay from "../../hooks/useBGMResumeOverlay";
import PauseOverlay from "./PauseOverlay";
import { IoClose, IoSettingsOutline } from "react-icons/io5";
import { playClickSound } from "../../utils/soundManager";
import SoundSettings from "./subcomponents/SoundSettings";
import "../../styles/game.css";
import { setError } from "../../redux/errorSlice";
import { motion } from "framer-motion";
import CurrencyBar from "./subcomponents/CurrencyBar";

const JoinLobbyHandler: React.FC = () => {
  useInitSound("Lobby");
  const { bgmBlocked, handleResume } = useBGMResumeOverlay("Lobby");
  const [isSoundPopupOpen, setIsSoundPopupOpen] = useState<boolean>(false);

  const [status, setStatus] = useState<
    "pending" | "approved" | "rejected" | "error"
  >("pending");

  const socket = useSocket();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { lobbyId } = useParams();

  useLobbySocketRedirect();

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
        dispatch(setError({ errorMessage: err.message, success: false }));
      }
    };

    requestJoin();

    socket.on("kickUser", () => navigate("/play"));
    socket.on("rejectUser", () => navigate("/play"));

    return () => {
      socket.off("kickUser");
      socket.off("rejectUser");
    };
  }, [lobbyId]);

  useEffect(() => {
    if (status === "rejected") {
      dispatch(
        setError({
          errorMessage: "You were rejected from the lobby.",
          success: false
        })
      );
    }
  }, [status]);

  if (status === "pending") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <CurrencyBar />
        {bgmBlocked && <PauseOverlay onResume={handleResume} />}
        <IoSettingsOutline
          onClick={() => {
            playClickSound();
            setIsSoundPopupOpen(true);
          }}
          className="sound-settings-icon"
        />
        <p className="hover-text-2 sound-settings-icon-text">Game Settings</p>

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
      </motion.div>
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
      <p className="hover-text-2 sound-settings-icon-text">Game Settings</p>

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
    </div>
  );
};

export default JoinLobbyHandler;
