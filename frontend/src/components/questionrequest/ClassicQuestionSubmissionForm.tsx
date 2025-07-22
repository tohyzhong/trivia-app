import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import "../../styles/questionsubmissionform.css";
import { setError } from "../../redux/errorSlice";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ClassicQuestionSubmissionForm: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState<number | null>(null);
  const [explanation, setExplanation] = useState("");
  const category = "Community";
  const [difficulty, setDifficulty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();

  const user = useSelector((state: RootState) => state.user);
  const username = user.username;

  const handleChangeOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const validateForm = (): string | null => {
    if (!question.trim()) return "Question is required.";
    if (options.some((opt) => !opt.trim()))
      return "All options must be filled.";
    if (
      correctOption === null ||
      correctOption < 1 ||
      correctOption > 4 ||
      !Number.isInteger(correctOption)
    )
      return "Correct option must be an integer between 1 and 4.";
    if (!explanation.trim()) return "Explanation is required.";
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
        `${import.meta.env.VITE_API_URL}/api/questions/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            question,
            options,
            correctOption,
            explanation,
            category,
            difficulty,
            approved: false,
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
      setOptions(["", "", "", ""]);
      setCorrectOption(null);
      setExplanation("");
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="question-submission-page">
        <Link to="/question-request">
          <button className="back-button">Back</button>
        </Link>
        <h2>Submit a Question</h2>
        <form onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="question-input">Question:</label>
          <input
            id="question-input"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
          <label>Options:</label>
          {options.map((option, index) => (
            <div key={index} className="option-input-wrapper">
              <input
                type="text"
                value={option}
                onChange={(e) => handleChangeOption(index, e.target.value)}
                required
              />
            </div>
          ))}
          <label htmlFor="correct-option-input">Correct Option (1-4):</label>
          <input
            id="correct-option-input"
            type="number"
            value={correctOption ?? ""}
            onChange={(e) => setCorrectOption(Number(e.target.value))}
            required
          />
          <label htmlFor="explanation-textarea">Explanation:</label>
          <textarea
            id="explanation-textarea"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
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
    </motion.div>
  );
};

export default ClassicQuestionSubmissionForm;
