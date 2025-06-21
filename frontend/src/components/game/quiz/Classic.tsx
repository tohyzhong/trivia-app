import { number } from "motion";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";

interface ClassicQuestion {
  question: string;
  options: string[];
  correctOption: number;
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

  const handleSubmit = async (option) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/lobby/submit/${lobbyId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user: loggedInUser, option })
      }
    );
  };

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
  }, [optionSelected - 1, answerRevealed]);

  return (
    <div className="question-details">
      <div className="question-header-details">
        <p>
          Question {currentQuestion} / {totalQuestions}
        </p>
        <p>Category: {classicQuestion.category}</p>
      </div>
      <div className="question-question">{classicQuestion.question}</div>
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
