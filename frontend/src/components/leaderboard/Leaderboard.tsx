import React from "react";
import LeaderboardTable from "./subcomponents/LeaderboardTable";
import "../../styles/leaderboard.css";
import { useInitSound } from "../../hooks/useInitSound";
import useBGMResumeOverlay from "../../hooks/useBGMResumeOverlay";
import PauseOverlay from "../game/PauseOverlay";

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
  const { bgmBlocked, handleResume } = useBGMResumeOverlay("Lobby");
  return (
    <div className="leaderboard-container-full">
      {bgmBlocked && <PauseOverlay onResume={handleResume} />}
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
