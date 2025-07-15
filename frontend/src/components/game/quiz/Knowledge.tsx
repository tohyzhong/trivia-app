import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setError } from "../../../redux/errorSlice";
import { RootState } from "../../../redux/store";

interface SearchInput {
  answer: string;
}

interface KnowledgeQuestion {
  question: string;
  answer: string;
  difficulty: number;
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
  profilePictures
}) => {
  const loggedInUser = useSelector((state: RootState) => state.user.username);
  const dispatch = useDispatch();

  // Input handlers
  const [answerInput, setAnswerInput] = useState<string>("");
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
        setAnswerInput(matchingInputs[currentSelection].answer);
        setMatchingInputs([]);
        setCurrentSelection(0);
      } else {
        handleSendAnswer();
      }
    }
  };

  useEffect(() => {
    console.log(matchingInputs);
  }, [matchingInputs]);

  // Sending Answer
  const handleSendAnswer = () => {
    console.log("test");
  };

  return (
    <div className="knowledge-question-display">
      <div className="players-display"></div>

      <div className="knowledge-question-details">
        <div className="knowledge-question-header">
          <p>
            Question {currentQuestion} / {totalQuestions}
          </p>
          <div className="knowledge-question-answer">
            {answerRevealed ? <h3>{knowledgeQuestion.answer}</h3> : <p>?</p>}
          </div>
          <p>Difficulty: {knowledgeQuestion.difficulty}</p>
        </div>

        <div className="knowledge-question-image">
          <img src={knowledgeQuestion.question} />
        </div>

        <div className="knowledge-question-input">
          <div className="input-search">
            <input
              type="text"
              placeholder="Meme Name"
              value={answerInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={false && (submitted || answerRevealed)}
            />
            {matchingInputs.length > 0 && (
              <div className="input-dropdown">
                <ul>
                  {matchingInputs.map((input, index) => (
                    <li
                      key={input.answer}
                      className={
                        index === currentSelection ? "input-selected" : ""
                      }
                      onClick={() => {
                        setAnswerInput(input.answer);
                        setMatchingInputs([]);
                      }}
                    >
                      {input.answer}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button className="confirm-button" onClick={handleSendAnswer}>
            Confirm
          </button>
        </div>

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
