import React, { useEffect, useRef, useState } from "react";
import GameChat from "../gamelobby/GameChat";
import GameLoading from "../gamelobby/GameLoading";
import Classic from "./Classic";
import Knowledge from "./Knowledge";
import { useDispatch, useSelector } from "react-redux";
import { clearLobby } from "../../../redux/lobbySlice";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../../redux/store";
import { motion } from "motion/react";

import { useInitSound } from "../../../hooks/useInitSound";
import PauseOverlay from "../PauseOverlay";
import { useBGMResumeOverlay } from "../../../hooks/useBGMResumeOverlay";
import { playClickSound } from "../../../utils/soundManager";
import { IoClose, IoSettingsOutline } from "react-icons/io5";
import SoundSettings from "../subcomponents/SoundSettings";

interface ChatMessage {
  sender: string;
  message: string;
}

interface ClassicQuestion {
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
  difficulty: number;
  category: string;
}

interface KnowledgeQuestion {
  question: string;
  answer: string;
}

type QuizQuestion = ClassicQuestion | KnowledgeQuestion;

interface GameState {
  currentQuestion: number;
  questionIds: string[];
  question: QuizQuestion;
  playerStates: any;
  answerRevealed: boolean;
  lastUpdate: Date;
  team?: any;
  countdownStarted?: boolean;
  countdownStartTime?: Date;
}

interface QuizDisplayProps {
  lobbyId: string;
  lobbyChat: ChatMessage[];
  profilePictures: { [username: string]: string };
  gameType: string;
  gameState: GameState;
  serverTimeNow: Date;
  timeLimit: number;
  totalQuestions: number;
  handleLeave: Function;
  host: string;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({
  lobbyId,
  lobbyChat,
  profilePictures,
  gameType,
  gameState,
  serverTimeNow,
  timeLimit,
  totalQuestions,
  handleLeave,
  host
}) => {
  useInitSound("Quiz");
  const { bgmBlocked, handleResume } = useBGMResumeOverlay("Quiz");
  const [isSoundPopupOpen, setIsSoundPopupOpen] = useState<boolean>(false);

  const loggedInUser = useSelector((state: RootState) => state.user.username);
  const [loading, setLoading] = useState<boolean>(true);
  const timesUpCalledRef = useRef(false);

  // Option selection states
  const username = useSelector((state: RootState) => state.user.username);
  const playerState = username ? gameState.playerStates[username] : null;
  const optionSelected = playerState?.selectedOption ?? 0;
  const submitted = playerState?.submitted ?? false;
  let answerRevealed = gameState.answerRevealed ?? false;

  // Question time states
  let timeLeft = 0;
  if (!answerRevealed) {
    const getSecondsDifference = (date1: Date, date2: Date) => {
      return (date1.getTime() - date2.getTime()) / 1000;
    };
    timeLeft = Math.max(
      Math.min(
        timeLimit -
          getSecondsDifference(
            new Date(serverTimeNow),
            new Date(gameState.lastUpdate)
          ),
        timeLimit
      ),
      0
    );
  }

  // Leaving Lobby
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (gameState) {
      setLoading(false);
    }
  }, [gameState]);

  useEffect(() => {
    timesUpCalledRef.current = false;
  }, [gameState.currentQuestion]);

  const percentageLeft = (timeLeft / timeLimit) * 100;

  const handleTimesUp = async () => {
    if (timesUpCalledRef.current || !gameState || gameState.answerRevealed)
      return;

    timesUpCalledRef.current = true;

    await fetch(
      `${import.meta.env.VITE_API_URL}/api/lobby/revealanswer/${lobbyId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      }
    );
  };

  return loading ? (
    <GameLoading />
  ) : (
    <div className="game-lobby-full">
      {bgmBlocked && <PauseOverlay onResume={handleResume} />}
      <div className="game-lobby-container">
        <div className="question-display-container">
          <div className="question-display-lobby-details">
            <button className="leave-button" onClick={handleLeaveLocal}>
              Leave
            </button>
            <p>Lobby ID: {lobbyId}</p>
            <p>Host: {host}</p>
          </div>
          {gameState.question ? (
            gameType.includes("classic") ? (
              <Classic
                lobbyId={lobbyId}
                currentQuestion={gameState.currentQuestion}
                totalQuestions={totalQuestions}
                classicQuestion={gameState.question as ClassicQuestion}
                optionSelected={optionSelected}
                submitted={submitted || answerRevealed}
                answerRevealed={answerRevealed}
                playerStates={gameState.playerStates}
                teamStates={gameState.team}
                profilePictures={profilePictures}
                host={host}
                serverTimeNow={serverTimeNow}
                readyCountdown={{
                  countdownStarted: gameState.countdownStarted,
                  countdownStartTime: gameState.countdownStartTime
                }}
              />
            ) : (
              <Knowledge />
            )
          ) : (
            <GameLoading />
          )}
          <div className="question-timer-border">
            <motion.div
              key={gameState.currentQuestion + "-" + answerRevealed}
              className={"question-timer"}
              initial={{ width: `${percentageLeft}%` }}
              animate={{
                width: 0,
                transition: {
                  duration: answerRevealed ? 0 : Math.max(timeLeft, 0),
                  ease: "linear"
                }
              }}
              onAnimationComplete={handleTimesUp}
            />
          </div>
        </div>
        <GameChat
          lobbyId={lobbyId}
          chatMessages={lobbyChat}
          playerStates={gameState.playerStates}
          gameType={gameType}
          profilePictures={profilePictures}
        />
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
    </div>
  );
};

export default QuizDisplay;
