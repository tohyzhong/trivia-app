import React from "react";
import LeaderboardTable from "./subcomponents/LeaderboardTable";
import "../../styles/leaderboard.css";

interface LeaderboardProps {
  apiRoute: string;
  valueField: string;
  valueHeader: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  apiRoute,
  valueField,
  valueHeader
}) => {
  return (
    <div className="leaderboard-container-full">
      <LeaderboardTable
        apiRoute={apiRoute}
        valueField={valueField}
        valueHeader={valueHeader}
      />
    </div>
  );
};

export default Leaderboard;
