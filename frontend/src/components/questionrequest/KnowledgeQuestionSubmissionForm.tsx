import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useNavigate } from "react-router-dom";
import "../../styles/questionsubmissionform.css";
import { setError } from "../../redux/errorSlice";

const KnowledgeQuestionSubmissionForm: React.FC = () => {
  const [question, setQuestion] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [difficulty, setDifficulty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state: RootState) => state.user);
  const username = user.username;

  const validateForm = (): string | null => {
    if (!question.trim()) return "Question is required.";
    const parts = question.split(".");
    if (!["jpg", "jpeg", "png"].includes(parts[parts.length - 1]))
      return "Please provide a valid image URL";

    if (!answer.trim()) return "Answer is required";
    if (difficulty < 1 || difficulty > 5)
      return "Difficulty must be between 1 and 5.";
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      dispatch(setError({ errorMessage: error, success: false }));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/questions/requestknowledge`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            question,
            answer,
            difficulty,
            createdBy: username
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit question");
      }

      dispatch(
        setError({ errorMessage: "Question submitted!", success: true })
      );
      setQuestion("");
      setAnswer("");
      setDifficulty(1);
    } catch (error) {
      console.error("Error submitting question:", error);
      dispatch(
        setError({
          errorMessage:
            "An error occurred while submitting your question. Please try again later.",
          success: false
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="question-submission-page">
      <button
        className="back-button"
        onClick={() => navigate("/question-request")}
      >
        Back
      </button>
      <h2>Submit a Question</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="question-input">Question: (Image URL)</label>
        <input
          id="question-input"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />
        <label htmlFor="correct-option-input">Answer:</label>
        <input
          id="correct-option-input"
          type="text"
          value={answer ?? ""}
          onChange={(e) => setAnswer(e.target.value)}
          required
        />
        <label htmlFor="difficulty-input">Difficulty (1-5):</label>
        <input
          id="difficulty-input"
          type="number"
          min={1}
          max={5}
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          required
        />
        <button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Question"}
        </button>
      </form>
    </div>
  );
};

export default KnowledgeQuestionSubmissionForm;
