import { number } from "motion";
import React, { useEffect, useState } from "react";

interface ClassicQuestion {
  question: string;
  options: string[];
  correctOption: number;
  difficulty: number;
  category: string;
}

interface ClassicQuestionProps {
  currentQuestion: number;
  classicQuestion: ClassicQuestion;
}

const Classic: React.FC<ClassicQuestionProps> = ({
  currentQuestion,
  classicQuestion
}) => {
  const [timer, setTimer] = useState<number>(0);

  console.log(currentQuestion);
  console.log(classicQuestion);

  return (
    <div className="question-details">
      <div className="question-header-details">
        <p>Question {currentQuestion} / ??</p>
        <p>Category: {classicQuestion.category}</p>
      </div>
      <div className="question-question">{classicQuestion.question}</div>
      <div className="question-options-grid">
        {classicQuestion.options.map((option, index) => (
          <button className={`option option-${index}`}>{option}</button>
        ))}
      </div>
    </div>
  );
};

export default Classic;
