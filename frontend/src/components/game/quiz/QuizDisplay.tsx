import React, { useEffect, useState } from "react";
import GameChat from "../gamelobby/GameChat";
import GameLoading from "../gamelobby/GameLoading";
import Classic from "./Classic";
import Knowledge from "./Knowledge";
import { useDispatch, useSelector } from "react-redux";
import { clearLobby } from "../../../redux/lobbySlice";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../../redux/store";
import { motion } from "motion/react";

interface ChatMessage {
  sender: string;
  message: string;
}

interface ClassicQuestion {
  question: string;
  options: string[];
  correctOption: number;
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
  question: QuizQuestion;
  lastUpdate: Date;
}

interface QuizDisplayProps {
  lobbyId: string;
  lobbyChat: ChatMessage[];
  gameType: string;
  gameState: GameState;
  timeLimit: number;
  totalQuestions: number;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({
  lobbyId,
  lobbyChat,
  gameType,
  gameState,
  timeLimit,
  totalQuestions
}) => {
  const loggedInUser = useSelector((state: RootState) => state.user.username);
  const [loading, setLoading] = useState<boolean>(true);

  // Calculate question time left
  const getSecondsDifference = (date1: Date, date2: Date) => {
    return Math.abs((date2.getTime() - date1.getTime()) / 1000);
  };
  const timeLeft =
    timeLimit -
    getSecondsDifference(new Date(), new Date(gameState.lastUpdate));
  const percentageLeft = (timeLeft / timeLimit) * 100;

  // Leaving Lobby
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLeave = async () => {
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
        navigate("/", { state: { errorMessage: "You left the lobby." } });
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

  return loading ? (
    <GameLoading />
  ) : (
    <div className="game-lobby-full">
      <div className="game-lobby-container">
        <div className="question-display-container">
          <div className="question-display-lobby-details">
            <button className="leave-button" onClick={handleLeave}>
              Leave
            </button>
            <p>Lobby ID: {lobbyId}</p>
            <p>Host: you</p>
          </div>
          {gameType === "solo-classic" ? (
            <Classic
              currentQuestion={gameState.currentQuestion}
              totalQuestions={totalQuestions}
              classicQuestion={gameState.question as ClassicQuestion}
            />
          ) : (
            <Knowledge />
          )}
          <div className="question-timer-border">
            <motion.div
              className="question-timer"
              initial={{ width: `${percentageLeft}%` }}
              animate={{
                width: 0,
                transition: { duration: timeLeft, ease: "linear" }
              }}
            />
          </div>
        </div>
        <GameChat lobbyId={lobbyId} chatMessages={lobbyChat} />
      </div>
    </div>
  );
};

export default QuizDisplay;
