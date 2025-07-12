import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { IoIosInformationCircle } from "react-icons/io";
import Explanation from "./Explanation";
import { playClickSound } from "../../../utils/soundManager";
import defaultAvatar from "../../../assets/default-avatar.jpg";

interface ClassicQuestion {
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
  difficulty: number;
  category: string;
}

interface ClassicQuestionProps {
  lobbyId: string;
  currentQuestion: number;
  totalQuestions: number;
  classicQuestion: ClassicQuestion;
  optionSelected: number;
  submitted: boolean;
  answerRevealed: boolean;
  playerStates: Object;
  teamStates: {
    [key: string]: {
      [key: string]: number | Array<string | { [key: number]: Array<string> }>;
    };
  };
  profilePictures: { [username: string]: string };
  host: string;
  serverTimeNow: Date;
  readyCountdown: { [key: string]: boolean | Date };
}

const Classic: React.FC<ClassicQuestionProps> = ({
  lobbyId,
  currentQuestion,
  totalQuestions,
  classicQuestion,
  optionSelected,
  submitted,
  answerRevealed,
  playerStates,
  teamStates,
  profilePictures,
  host,
  serverTimeNow,
  readyCountdown
}) => {
  const loggedInUser = useSelector((state: RootState) => state.user.username);
  const answerHistory = teamStates
    ? teamStates["teamAnswerHistory"]
    : playerStates[loggedInUser]?.answerHistory || [];

  // Next Question / Return to Lobby Countdown
  const start =
    readyCountdown.countdownStarted &&
    typeof readyCountdown.countdownStartTime === "string"
      ? new Date(readyCountdown.countdownStartTime).getTime()
      : null;

  const now = new Date(serverTimeNow).getTime();
  const initialTimeLeft = start ? Math.max(0, 10 - (now - start) / 1000) : null;

  const [countdownLeft, setCountdownLeft] = useState<number>(
    Math.floor(initialTimeLeft ?? 10)
  );

  useEffect(() => {
    if (initialTimeLeft === null) return;

    const interval = setInterval(() => {
      setCountdownLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (loggedInUser === host) handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [start]);

  // Reset countdown on new question
  useEffect(() => {
    setCountdownLeft(Math.floor(initialTimeLeft ?? 10));
  }, [currentQuestion]);

  // Option submission
  const handleSubmit = async (option) => {
    playClickSound();
    await fetch(`${import.meta.env.VITE_API_URL}/api/lobby/submit/${lobbyId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ user: loggedInUser, option })
    });
  };

  // Update option styles (correct, wrong, selected)
  useEffect(() => {
    const optionButtons = document.querySelectorAll(".option");
    if (answerRevealed) {
      if (optionSelected !== 0)
        optionButtons[optionSelected - 1].classList.remove("selected");

      if (optionSelected === classicQuestion.correctOption) {
        optionButtons[optionSelected - 1].classList.add("correct");
      } else {
        if (optionSelected !== 0)
          optionButtons[optionSelected - 1].classList.add("wrong");

        optionButtons[classicQuestion.correctOption - 1].classList.add(
          "correct"
        );
      }
    } else {
      if (optionSelected !== 0)
        optionButtons[optionSelected - 1].classList.add("selected");
    }
  }, [optionSelected, answerRevealed]);

  // Next question
  const handleNextQuestion = async () => {
    if (loggedInUser !== host && playerStates[loggedInUser]?.ready) return;
    playClickSound();
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/lobby/advancelobby/${lobbyId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        }
      );
    } catch (error) {
      console.error("Failed to advance lobby", error);
    }
  };

  // Explanation popup
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const handleIconClick = () => {
    playClickSound();
    setShowExplanation(true);
  };

  const renderAnswerHistory = () => {
    const recentAnswers = Object.keys(answerHistory)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .slice(-5);

    return recentAnswers.map((questionId) => {
      const status = teamStates
        ? answerHistory[questionId][0]
        : answerHistory[questionId];

      let color = "grey";
      if (status === "correct") color = "green";
      else if (status === "wrong") color = "red";
      return (
        <div key={questionId} className={`answer-history-item ${color}`} />
      );
    });
  };

  const MAX_VISIBLE = 5;
  const renderVoteAvatars = (optionIndex: number) => {
    if (!teamStates || !answerRevealed) return null;

    const voteDetails = answerHistory[currentQuestion]?.[1] ?? {};
    const voters = voteDetails[optionIndex + 1];

    if (!voters) return null;

    const usernames = voters;
    const visibleVoters = usernames.slice(0, MAX_VISIBLE);
    const extraCount = usernames.length - MAX_VISIBLE;

    return (
      <div className="vote-avatars">
        {visibleVoters.map((username) => (
          <div className="avatar-wrapper" key={username} title={username}>
            <img
              src={profilePictures[username] || defaultAvatar}
              alt={username}
              className="avatar-img"
            />
          </div>
        ))}

        {extraCount > 0 && (
          <div
            className="avatar-wrapper extra-voters"
            title={usernames.slice(MAX_VISIBLE).join(", ")}
          >
            +{extraCount} more
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="question-details">
      {showExplanation && (
        <Explanation
          setActive={setShowExplanation}
          explanation={classicQuestion.explanation}
        />
      )}
      <div className="question-header-details">
        <div className="question-number-container">
          <p>
            Question {currentQuestion} / {totalQuestions}
          </p>
          <div className="answer-history-bar">{renderAnswerHistory()}</div>
        </div>

        {answerRevealed && (
          <button
            className="advance-lobby-button"
            onClick={handleNextQuestion}
            disabled={playerStates[loggedInUser]?.ready}
          >
            {playerStates[loggedInUser]?.ready
              ? `Waiting... (${countdownLeft}s)`
              : currentQuestion === totalQuestions
                ? `Back to Lobby → ${readyCountdown.countdownStarted ? countdownLeft + "s" : ""}`
                : `Next Question → ${readyCountdown.countdownStarted ? countdownLeft + "s" : ""}`}
          </button>
        )}
        <p>Category: {classicQuestion.category}</p>
      </div>

      <p className="score-display">
        {teamStates
          ? `Score: ${teamStates["teamScore"] ?? 0} \
        (+${teamStates["teamCorrectScore"] ?? 0} (Correct Score) \
        +${teamStates["teamStreakBonus"] ?? 0} (Streak Bonus))`
          : `Score: ${playerStates[loggedInUser]?.score ?? 0} \
        (+${playerStates[loggedInUser]?.correctScore ?? 0} (Correct Score) \
        +${playerStates[loggedInUser]?.streakBonus ?? 0} (Streak Bonus))`}
      </p>

      <div className="question-question">
        {classicQuestion.question}
        {answerRevealed && (
          <IoIosInformationCircle
            className="question-explanation-icon"
            onClick={handleIconClick}
          />
        )}
      </div>
      <div className="question-options-grid">
        {classicQuestion.options.map((option, index) => (
          <div key={index} className="option-container">
            <button
              className={`option option-${index + 1} ${submitted ? "disabled" : ""}`}
              onClick={!submitted ? () => handleSubmit(index + 1) : null}
            >
              {option}
            </button>
            {renderVoteAvatars(index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Classic;
