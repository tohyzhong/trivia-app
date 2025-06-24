import React from "react";
import LeaderboardTable from "./subcomponents/LeaderboardTable";
import "../../styles/leaderboard.css";
import { useInitSound } from "../../hooks/useInitSound";

interface LeaderboardProps {
  headerTitle: string;
  apiRoute: string;
  valueField: string;
  valueHeader: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  headerTitle,
  apiRoute,
  valueField,
  valueHeader
}) => {
  useInitSound("Lobby");
  return (
    <div className="leaderboard-container-full">
      <h1 className="leaderboard-header">Top {headerTitle}</h1>
      <LeaderboardTable
        apiRoute={apiRoute}
        valueField={valueField}
        valueHeader={valueHeader}
      />
    </div>
  );
};

export default Leaderboard;
