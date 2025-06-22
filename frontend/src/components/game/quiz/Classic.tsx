import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { IoIosInformationCircle } from "react-icons/io";
import Explanation from "./Explanation";

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
}

const Classic: React.FC<ClassicQuestionProps> = ({
  lobbyId,
  currentQuestion,
  totalQuestions,
  classicQuestion,
  optionSelected,
  submitted,
  answerRevealed
}) => {
  const loggedInUser = useSelector((state: RootState) => state.user.username);

  // Option submission
  const handleSubmit = async (option) => {
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
    await fetch(
      `${import.meta.env.VITE_API_URL}/api/lobby/advancelobby/${lobbyId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      }
    );
  };

  // Explanation popup
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const handleIconClick = () => {
    setShowExplanation(true);
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
        <p>
          Question {currentQuestion} / {totalQuestions}
        </p>
        {answerRevealed && (
          <button className="advance-lobby-button" onClick={handleNextQuestion}>
            Next Question →
          </button>
        )}
        <p>Category: {classicQuestion.category}</p>
      </div>
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
          <button
            className={`option option-${index + 1} ${submitted ? "disabled" : ""}`}
            onClick={!submitted ? () => handleSubmit(index + 1) : null}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Classic;
