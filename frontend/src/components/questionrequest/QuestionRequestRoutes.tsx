import React from "react";
import { Routes, Route } from "react-router-dom";
import ClassicQuestionSubmissionForm from "./ClassicQuestionSubmissionForm";
import KnowledgeQuestionSubmissionForm from "./KnowledgeQuestionSubmissionForm";
import AdminApprovalDashboard from "./AdminApprovalDashboard";
import QuestionTypeSelection from "./QuestionTypeSelection";

const QuestionRequestRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/admin-dashboard" element={<AdminApprovalDashboard />} />
      <Route path="/classic" element={<ClassicQuestionSubmissionForm />} />
      <Route path="/knowledge" element={<KnowledgeQuestionSubmissionForm />} />
      <Route path="/*" element={<QuestionTypeSelection />} />
    </Routes>
  );
};

export default QuestionRequestRoutes;
