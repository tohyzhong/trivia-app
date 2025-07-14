import React from "react";

interface KnowledgeQuestion {
  question: string;
  answer: string;
}

interface KnowledgeQuestionProps {
  lobbyId: string;
  currentQuestion: number;
  totalQuestions: number;
  knowledgeQuestion: KnowledgeQuestion;
  submitted: boolean;
  answerRevealed: boolean;
}

const Knowledge: React.FC<KnowledgeQuestionProps> = ({
  lobbyId,
  currentQuestion,
  totalQuestions,
  knowledgeQuestion,
  submitted,
  answerRevealed
}) => {
  console.log(knowledgeQuestion);
  return (
    <div className="question-details">
      <div className="knowledge-question-header"></div>
    </div>
  );
};

export default Knowledge;
