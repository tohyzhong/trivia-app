import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setError } from "../../../redux/errorSlice";
import { RootState } from "../../../redux/store";
import defaultAvatar from "../../../assets/default-avatar.jpg";
import { resetHintRevealed } from "../../../redux/lobbySlice";
import { playClickSound } from "../../../utils/soundManager";
import { IoIosInformationCircle } from "react-icons/io";
import Explanation from "./Explanation";

interface SearchInput {
  correctOption: string;
}

interface KnowledgeQuestion {
  question: string;
  correctOption: string;
  difficulty: number;
  createdBy?: string;
}

interface KnowledgeQuestionProps {
  lobbyId: string;
  currentQuestion: number;
  totalQuestions: number;
  knowledgeQuestion: KnowledgeQuestion;
  submitted: boolean;
  answerRevealed: boolean;
  playerStates: object;
  teamStates: {
    [key: string]: {
      [key: string]: number | Array<string | { [key: number]: Array<string> }>;
    };
  };
  profilePictures: { [username: string]: string };
  serverTimeNow: Date;
  readyCountdown: { [key: string]: boolean | Date };
}

const Knowledge: React.FC<KnowledgeQuestionProps> = ({
  lobbyId,
  currentQuestion,
  totalQuestions,
  knowledgeQuestion,
  submitted,
  answerRevealed,
  playerStates,
  teamStates,
  profilePictures,
  serverTimeNow,
  readyCountdown
}) => {
  const loggedInUser = useSelector((state: RootState) => state.user.username);
  const currentQuestionRef = useRef(currentQuestion);
  const dispatch = useDispatch();
  const answerHistory = teamStates
    ? teamStates["teamAnswerHistory"]
    : playerStates[loggedInUser]?.answerHistory || [];

  // Input handlers
  const [answerInput, setAnswerInput] = useState<string>(
    playerStates[loggedInUser]?.selectedOption ?? ""
  );
  const [matchingInputs, setMatchingInputs] = useState<SearchInput[]>([]);

  const handleInputChange = async (e) => {
    const query = e.target.value;
    setAnswerInput(query);
    setMatchingInputs([]);

    if (query.length < 1) return; // Skip autocomplete
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/knowledgelobby/search-inputs?query=${encodeURIComponent(query)}`,
        { method: "GET", credentials: "include" }
      );
      const data = await response.json();
      setMatchingInputs(data);
      setCurrentSelection(data.length - 1);
    } catch (err) {
      console.error(err);
      dispatch(setError({ errorMessage: err, success: false }));
    }
  };

  // Selected Input Change
  const [currentSelection, setCurrentSelection] = useState<number>(0);

  const handleKeyDown = (event) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setCurrentSelection((selection) => Math.max(selection - 1, 0));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setCurrentSelection((selection) =>
        Math.min(selection + 1, matchingInputs.length - 1)
      );
    } else if (event.key === "Enter") {
      if (matchingInputs.length !== 0) {
        setAnswerInput(matchingInputs[currentSelection].correctOption);
        setMatchingInputs([]);
        setCurrentSelection(0);
      } else {
        handleSendAnswer();
      }
    } else if (event.key === "Escape") {
      setMatchingInputs([]);
    }
  };

  // Sending Answer
  const handleSendAnswer = async () => {
    if (
      answerRevealed ||
      playerStates[loggedInUser]?.selectedOption === answerInput ||
      answerInput === ""
    ) {
      return;
    }

    await fetch(`${import.meta.env.VITE_API_URL}/api/lobby/submit/${lobbyId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ user: loggedInUser, option: answerInput })
    });
  };

  // Update/Reset input states when answer is revealed
  useEffect(() => {
    if (answerRevealed) {
      setMatchingInputs([]);
    }
  }, [answerRevealed]);

  // Advance lobby
  const handleNextQuestion = async () => {
    if (currentQuestionRef.current !== currentQuestion) return;
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/lobby/advancelobby/${lobbyId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        }
      );
      setAnswerInput("");
    } catch (error) {
      console.error("Failed to advance lobby", error);
    }
  };

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
      if (currentQuestionRef.current !== currentQuestion) {
        clearInterval(interval);
        return 0;
      }

      setCountdownLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [start]);

  // Reset countdown on new question
  useEffect(() => {
    dispatch(resetHintRevealed());
    setPlaceholder("Meme Name");
    currentQuestionRef.current = currentQuestion;
    setCountdownLeft(Math.floor(initialTimeLeft ?? 10));
  }, [currentQuestion]);

  // Hint revelation
  const [placeholder, setPlaceholder] = useState<string>("Meme Name");
  const hint = useSelector((state: RootState) => state.lobby.hintRevealed);
  useEffect(() => {
    if (typeof hint === "string" && hint?.length !== 0 && !submitted) {
      setPlaceholder(hint + "...");
      setAnswerInput(String(hint));
    }
  }, [hint]);

  // Answer popup (for long answers)
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const handleIconClick = () => {
    playClickSound();
    setShowAnswer(true);
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

  return (
    <div className="knowledge-question-display">
      {showAnswer && (
        <Explanation
          setActive={setShowAnswer}
          explanation={
            (knowledgeQuestion.createdBy
              ? `[Contributed by: ${knowledgeQuestion.createdBy}]  \n`
              : "") + knowledgeQuestion.correctOption
          }
        />
      )}

      {answerRevealed && (
        <div className="players-display">
          {Object.entries(playerStates).map(([username, state]) => (
            <div className="player-display-item" key={username}>
              <img src={profilePictures[username] || defaultAvatar} />
              {answerRevealed && (
                <div
                  className="speech-bubble"
                  style={{
                    "--bg-color":
                      state.selectedOption === knowledgeQuestion.correctOption
                        ? "#088b3fff"
                        : "#ff4d4dff",
                    color: "white"
                  }}
                >
                  {state.selectedOption === ""
                    ? "(no answer)"
                    : state.selectedOption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        className="knowledge-question-details"
        style={!answerRevealed ? { width: "95%", maxWidth: "95%" } : {}}
      >
        <div className="knowledge-question-header">
          <div
            className="question-number-answer-history"
            style={{
              width: "33%",
              alignItems: "center",
              justifyContent: "center",
              justifyItems: "center",
              display: "flex",
              textAlign: "left",
              paddingLeft: "23px",
              position: "relative"
            }}
          >
            <p style={{ width: "100%" }}>
              Question {currentQuestion} / {totalQuestions}
            </p>
            <div className="answer-history-bar" style={{ paddingLeft: "23px" }}>
              {renderAnswerHistory()}
            </div>
          </div>
          <div className="knowledge-question-answer">
            {answerRevealed ? (
              <>
                {knowledgeQuestion.createdBy && (
                  <p className="contribution-credit">
                    [Contributed by: {knowledgeQuestion.createdBy}]
                  </p>
                )}
                <IoIosInformationCircle
                  className="question-explanation-icon"
                  onClick={handleIconClick}
                />
                <h4>{knowledgeQuestion.correctOption}</h4>
              </>
            ) : (
              <p>?</p>
            )}
          </div>
          <div className="advance-lobby-button-container">
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
          </div>
        </div>

        <div className="knowledge-question-image">
          <img src={knowledgeQuestion.question} />
        </div>

        <div className="knowledge-question-input">
          <div className="input-search">
            <input
              className={
                answerRevealed
                  ? playerStates[loggedInUser]?.selectedOption ===
                    knowledgeQuestion.correctOption
                    ? "answer-correct"
                    : "answer-wrong"
                  : ""
              }
              type="text"
              placeholder={placeholder}
              value={
                answerRevealed
                  ? playerStates[loggedInUser]?.selectedOption
                  : answerInput
              }
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={answerRevealed}
            />
            {matchingInputs.length > 0 && (
              <div className="input-dropdown">
                <ul>
                  {matchingInputs.map((input, index) => (
                    <li
                      key={input.correctOption}
                      className={
                        index === currentSelection ? "input-selected" : ""
                      }
                      onClick={() => {
                        setAnswerInput(input.correctOption);
                        setMatchingInputs([]);
                      }}
                    >
                      {input.correctOption}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            className={`confirm-button ${answerRevealed || playerStates[loggedInUser]?.selectedOption === answerInput || answerInput === "" ? "disabled" : ""}`}
            onClick={handleSendAnswer}
          >
            Confirm
          </button>
        </div>

        <p className="submitted-answer-display">
          Submitted: {playerStates[loggedInUser]?.selectedOption}
        </p>

        <p className="knowledge-score-display">
          {teamStates
            ? `Score: ${teamStates["teamScore"] ?? 0} \
        (+${teamStates["teamCorrectScore"] ?? 0} (Correct Score) \
        +${teamStates["teamStreakBonus"] ?? 0} (Streak Bonus))`
            : `Score: ${playerStates[loggedInUser]?.score ?? 0} \
        (+${playerStates[loggedInUser]?.correctScore ?? 0} (Correct Score) \
        +${playerStates[loggedInUser]?.streakBonus ?? 0} (Streak Bonus))`}
        </p>
      </div>
    </div>
  );
};

export default Knowledge;
