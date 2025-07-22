import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import "../../styles/questionsubmissionform.css";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const QuestionTypeSelection: React.FC = () => {
  const role = useSelector((state: RootState) => state.user.role);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="question-submission-page">
        <h2>Select a Question Type to Submit</h2>
        <div className="type-selection-buttons">
          <Link to="/question-request/classic">
            <button>Classic</button>
          </Link>
          <Link to="/question-request/knowledge">
            <button>Knowledge</button>
          </Link>
        </div>
        {role.includes("admin") && (
          <div className="type-selection-buttons">
            <h2>Admin Dashboard</h2>
            <Link to="/question-request/admin-dashboard">
              <button className="admin-dashboard-btn">
                Go to Admin Dashboard
              </button>
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default QuestionTypeSelection;
