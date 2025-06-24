import React from "react";
import { Routes, Route } from "react-router-dom";
import QuestionSubmissionForm from "./QuestionSubmissionForm";
import AdminApprovalDashboard from "./AdminApprovalDashboard";

const QuestionRequestRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/admin-dashboard" element={<AdminApprovalDashboard />} />
      <Route path="/*" element={<QuestionSubmissionForm />} />
    </Routes>
  );
};

export default QuestionRequestRoutes;
