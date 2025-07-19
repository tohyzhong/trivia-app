import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Leaderboard from "./Leaderboard";

const LeaderboardRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/leaderboard/classic/Overall/Overall" />}
      />
      <Route path="/:gameFormat/:mode/:category" element={<Leaderboard />} />
      <Route
        path="/*"
        element={<Navigate to="/leaderboard/classic/Overall/Overall" />}
      />
    </Routes>
  );
};

export default LeaderboardRoutes;
