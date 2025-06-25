import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/game.css";
import ModeSelect from "./subcomponents/ModeSelect";
import SoundSettings from "./subcomponents/SoundSettings";
import { IoSettingsOutline, IoClose } from "react-icons/io5";
import { IoHelp } from "react-icons/io5";
import { FaWpforms } from "react-icons/fa";
import SoloModeLogo from "../../assets/solo_mode.png";
import MultiplayerModeLogo from "../../assets/multiplayer_mode.png";
import LeaderboardLogo from "../../assets/leaderboard_logo.png";

import { useInitSound } from "../../hooks/useInitSound";
import PauseOverlay from "./PauseOverlay";
import { useBGMResumeOverlay } from "../../hooks/useBGMResumeOverlay";
import { playClickSound } from "../../utils/soundManager";
import ErrorPopup from "../authentication/subcomponents/ErrorPopup";

interface SubModes {
  name: string;
  description: string;
  image: string;
}

export const GameMainpage: React.FC = () => {
  useInitSound("Lobby");
  const { bgmBlocked, handleResume } = useBGMResumeOverlay("Lobby");
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string>(
    location.state?.errorMessage || ""
  );

  const modes = [
    {
      name: "Solo Mode",
      description: "Play alone and test your meme knowledge!",
      logo: SoloModeLogo,
      link: "/solo",
      buttonText: "Play Solo!"
    },
    {
      name: "Multiplayer Mode",
      description: "Compete with friends or players worldwide!",
      logo: MultiplayerModeLogo,
      link: "/multiplayer",
      buttonText: "Play Multiplayer!"
    },
    {
      name: "Leaderboard",
      description: "Check out the top memers and their scores!",
      logo: LeaderboardLogo,
      link: "/leaderboard",
      buttonText: "View"
    }
  ];

  const soloSubmodes: SubModes[] = [
    {
      name: "Classic",
      description:
        "Answer multiple-choice questions about memes in a timed format.",
      image: SoloModeLogo
    },
    {
      name: "Coming Soon...",
      description: "",
      image: SoloModeLogo
    }
  ];

  const multiplayerSubmodes: SubModes[] = [
    {
      name: "Coming Soon...",
      description: "",
      image: SoloModeLogo
    }
  ];

  const [popupMode, setPopupMode] = useState<string>("");
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [isSoundPopupOpen, setIsSoundPopupOpen] = useState<boolean>(false);

  const navigate = useNavigate();
  const handleModeClick = (mode) => {
    if (mode === "Leaderboard") {
      navigate("/leaderboard");
    } else {
      setPopupMode(mode);
      setIsPopupOpen(true);
    }
  };

  return (
    <div
      className={`game-mainpage ${isSoundPopupOpen ? "dimmed-background" : ""}`}
    >
      <ErrorPopup message={errorMessage} setMessage={setErrorMessage} />
      {bgmBlocked && <PauseOverlay onResume={handleResume} />}
      {isPopupOpen && (
        <ModeSelect
          mode={popupMode}
          submodes={
            popupMode === "Solo Mode" ? soloSubmodes : multiplayerSubmodes
          }
          setActive={setIsPopupOpen}
        />
      )}
      <div className="welcome-message">
        <h1>Welcome to The Rizz Quiz</h1>
        <p>Select a game mode below</p>
      </div>
      <div className="mode-selection">
        {modes.map((mode, index) => (
          <div className="mode-card" key={index}>
            <img
              src={mode.logo}
              alt={`${mode.name} logo`}
              className="mode-logo"
            />
            <h2 className="mode-name">{mode.name}</h2>
            <p className="mode-description">{mode.description}</p>
            <button
              className="mode-play-button"
              onClick={() => {
                playClickSound();
                handleModeClick(mode.name);
              }}
              disabled={isSoundPopupOpen}
            >
              {mode.buttonText}
            </button>
          </div>
        ))}
      </div>
      <IoSettingsOutline
        onClick={() => {
          playClickSound();
          setIsSoundPopupOpen(true);
        }}
        className="sound-settings-icon"
      />

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

      <FaWpforms
        onClick={() => {
          playClickSound();
          navigate("/question-request");
        }}
        className="question-submit-icon"
      />

      <IoHelp
        onClick={() => {
          playClickSound();
          navigate("/contact");
        }}
        className="help-icon"
      />
    </div>
  );
};

export default GameMainpage;
