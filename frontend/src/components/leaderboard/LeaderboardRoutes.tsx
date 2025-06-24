import React from "react";
import { Route, Routes } from "react-router-dom";
import "../../styles/leaderboard.css";
import Leaderboard from "./Leaderboard";

const LeaderboardRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Leaderboard
            headerTitle="Sigma Snipers"
            apiRoute="correctrate"
            valueField="correctRate"
            valueHeader="Correct Answer Rate"
          />
        }
      />
      <Route
        path="/correctrate"
        element={
          <Leaderboard
            headerTitle="Sigma Snipers"
            apiRoute="correctrate"
            valueField="correctRate"
            valueHeader="Correct Answer Rate"
          />
        }
      />
      <Route
        path="/totalanswer"
        element={
          <Leaderboard
            headerTitle="Certified Quiz Addicts"
            apiRoute="totalanswer"
            valueField="totalAnswer"
            valueHeader="Total Answered"
          />
        }
      />
      <Route
        path="/correctanswer"
        element={
          <Leaderboard
            headerTitle="Enlightened Rizzlers"
            apiRoute="correctanswer"
            valueField="correctAnswer"
            valueHeader="Correct Answers"
          />
        }
      />
    </Routes>
  );
};

export default LeaderboardRoutes;
