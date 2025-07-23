import React, { useState } from "react";
import "../../styles/game.css";
import ModeSelect from "./subcomponents/ModeSelect";
import SoundSettings from "./subcomponents/SoundSettings";
import { IoSettingsOutline, IoClose } from "react-icons/io5";
import { IoHelp } from "react-icons/io5";
import { FaWpforms } from "react-icons/fa";
import SoloModeLogo from "../../assets/solo_mode.png";
import MultiplayerModeLogo from "../../assets/multiplayer_mode.png";
import LeaderboardLogo from "../../assets/leaderboard_logo.png";
import ClassicLogo from "../../assets/classic.png";
import KnowledgeLogo from "../../assets/knowledge.png";
import CoopClassicLogo from "../../assets/coop_classic.png";
import CoopKnowledgeLogo from "../../assets/coop_knowledge.png";
import VersusClassicLogo from "../../assets/versus_classic.png";
import VersusKnowledgeLogo from "../../assets/versus_knowledge.png";
import BrowseLogo from "../../assets/browse.png";

import { useInitSound } from "../../hooks/useInitSound";
import PauseOverlay from "./PauseOverlay";
import { useBGMResumeOverlay } from "../../hooks/useBGMResumeOverlay";
import { playClickSound } from "../../utils/soundManager";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import CurrencyBar from "./subcomponents/CurrencyBar";

interface SubModes {
  name: string;
  gameType: string;
  description: string;
  image: string;
}

export const GameMainpage: React.FC = () => {
  useInitSound("Lobby");
  const { bgmBlocked, handleResume } = useBGMResumeOverlay("Lobby");

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
      gameType: "solo-classic",
      description:
        "Answer multiple-choice questions about memes in a timed format.",
      image: ClassicLogo
    },
    {
      name: "Knowledge",
      gameType: "solo-knowledge",
      description: "Test your knowledge with open-ended questions.",
      image: KnowledgeLogo
    },
    {
      name: "Coming Soon...",
      gameType: "Coming Soon...",
      description: "",
      image: SoloModeLogo
    }
  ];

  const multiplayerSubmodes: SubModes[] = [
    {
      name: "Co-op - Classic",
      gameType: "coop-classic",
      description:
        "Team up with your buddies in a quiz with multiple-choice questions about memes in a timed format.",
      image: CoopClassicLogo
    },
    {
      name: "Co-op - Knowledge",
      gameType: "coop-knowledge",
      description:
        "Team up with your buddies in an open-ended test of meme knowledge",
      image: CoopKnowledgeLogo
    },
    {
      name: "Versus - Classic",
      gameType: "versus-classic",
      description:
        "Compete against your friends in a quiz with multiple-choice questions about memes in a timed format.",
      image: VersusClassicLogo
    },
    {
      name: "Versus - Knowledge",
      gameType: "versus-knowledge",
      description:
        "Compete against your friends and test your knowledge with open-ended questions.",
      image: VersusKnowledgeLogo
    },
    {
      name: "Browse Lobbies",
      gameType: "Browse",
      description:
        "Look for public multiplayer lobbies to join and make new friends!",
      image: BrowseLogo
    },
    {
      name: "Coming Soon...",
      gameType: "Coming Soon...",
      description: "",
      image: MultiplayerModeLogo
    }
  ];

  const [popupMode, setPopupMode] = useState<string>("");
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [isSoundPopupOpen, setIsSoundPopupOpen] = useState<boolean>(false);

  const handleModeClick = (mode) => {
    setPopupMode(mode);
    setIsPopupOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CurrencyBar />
      <div
        className={`game-mainpage ${isSoundPopupOpen ? "dimmed-background" : ""}`}
      >
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
              {mode.name === "Leaderboard" ? (
                <Link to="/leaderboard">
                  <button
                    className="mode-play-button"
                    onClick={() => {
                      playClickSound();
                    }}
                    disabled={isSoundPopupOpen}
                  >
                    {mode.buttonText}
                  </button>
                </Link>
              ) : (
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
              )}
            </div>
          ))}
        </div>
        <IoSettingsOutline
          onClick={() => {
            playClickSound();
            setIsSoundPopupOpen(true);
          }}
          className="sound-settings-icon"
          data-testid="game-settings"
        />
        <p className="hover-text sound-settings-icon-text">Game Settings</p>

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

        <div className="icon-wrapper">
          <Link to="/question-request">
            <FaWpforms
              onClick={playClickSound}
              className="question-submit-icon"
              data-testid="submit-question"
            />
          </Link>
          <p className="hover-text question-submit-icon-text">
            Submit A Question
          </p>
        </div>

        <div className="icon-wrapper">
          <Link to="/contact">
            <IoHelp
              onClick={playClickSound}
              className="help-icon"
              data-testid="contact-us"
            />
          </Link>
          <p className="hover-text help-icon-text">Contact Us</p>
        </div>
      </div>
    </motion.div>
  );
};

export default GameMainpage;
