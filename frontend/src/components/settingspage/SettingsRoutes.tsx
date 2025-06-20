import React from "react";
import { Routes, Route } from "react-router-dom";
import SettingsActions from "./SettingsActions";
import Settings from "./Settings";

const SettingsRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Settings />} />
      <Route path="/verify-action" element={<SettingsActions />} />
    </Routes>
  );
};

export default SettingsRoutes;
