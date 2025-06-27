import React, { useEffect, useState } from "react";

import "../../../styles/gamelobby.css";
import GameSettings from "./GameSettings";
import GameUsers from "./GameUsers";
import GameChat from "./GameChat";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { useNavigate } from "react-router-dom";

import { useInitSound } from "../../../hooks/useInitSound";
import PauseOverlay from "../PauseOverlay";
import { useBGMResumeOverlay } from "../../../hooks/useBGMResumeOverlay";
import SoundSettings from "../subcomponents/SoundSettings";
import { playClickSound } from "../../../utils/soundManager";
import { IoClose, IoSettingsOutline } from "react-icons/io5";

interface GameSetting {
  numQuestions: number;
  timePerQuestion: number;
  difficulty: number;
  categories: string[];
}

interface ChatMessage {
  sender: string;
  message: string;
}

interface GameLobbyProps {
  lobbyId: string;
  lobbySettings: GameSetting;
  lobbyUsers: string[];
  lobbyChat: ChatMessage[];
  socket: any;
}

const GameLobby: React.FC<GameLobbyProps> = (props) => {
  useInitSound("Lobby");
  const { bgmBlocked, handleResume } = useBGMResumeOverlay("Lobby");

  // Handle component loading
  const [loading, setLoading] = useState<boolean>(true);
  const [isLobbyDeleted, setIsLobbyDeleted] = useState<boolean>(false);
  const [isSoundPopupOpen, setIsSoundPopupOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  // Lobby details
  const { lobbyId, lobbySettings, lobbyUsers, lobbyChat, socket } = props;

  useEffect(() => {
    if (lobbyId) {
      socket.on("lobbyDeleted", (deletedLobbyId: string) => {
        if (deletedLobbyId === lobbyId) {
          setIsLobbyDeleted(true);
        }
      });

      return () => {
        socket.off("lobbyDeleted");
      };
    }
  }, [lobbyId]);

  useEffect(() => {
    if (isLobbyDeleted) {
      window.location.reload();
    }
  }, [isLobbyDeleted, navigate]);

  // Ensure that the states are loaded
  useEffect(() => {
    if (lobbyId && lobbySettings && lobbyUsers && lobbyChat) {
      setLoading(false);
    }
  }, [lobbyId, lobbySettings, lobbyUsers, lobbyChat]);

  return loading ? (
    <></>
  ) : (
    <div className="game-lobby-full">
      {bgmBlocked && <PauseOverlay onResume={handleResume} />}
      <div className="game-lobby-container">
        <GameSettings lobbyId={lobbyId} gameSettings={lobbySettings} />
        <GameUsers lobbyId={lobbyId} userIds={lobbyUsers} />
        <GameChat lobbyId={lobbyId} chatMessages={lobbyChat} />
      </div>

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
    </div>
  );
};

export default GameLobby;
