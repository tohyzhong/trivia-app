import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../redux/store";
import "../../styles/questionsubmissionform.css";

const QuestionTypeSelection: React.FC = () => {
  const navigate = useNavigate();
  const role = useSelector((state: RootState) => state.user.role);
  return (
    <div className="question-submission-page">
      <h2>Select a Question Type to Submit</h2>
      <div className="type-selection-buttons">
        <button onClick={() => navigate("/question-request/classic")}>
          Classic
        </button>
        <button onClick={() => navigate("/question-request/knowledge")}>
          Knowledge
        </button>
      </div>
      {role.includes("admin") && (
        <>
          <h2>Admin Dashboard</h2>
          <button
            className="admin-dashboard-btn"
            onClick={() => navigate("/question-request/admin-dashboard")}
          >
            Go to Admin Dashboard
          </button>
        </>
      )}
    </div>
  );
};

export default QuestionTypeSelection;
