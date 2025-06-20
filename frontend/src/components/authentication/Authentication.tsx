import React from "react";
import { Route, Routes } from "react-router-dom";
import LoginPage from "./subcomponents/LoginPage";
import PasswordReset from "./subcomponents/PasswordReset";
import SignupPage from "./subcomponents/SignupPage";

const Authentication: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgotpassword" element={<PasswordReset />} />
    </Routes>
  );
};

export default Authentication;
