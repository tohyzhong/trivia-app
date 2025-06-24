import React from "react";

interface PodiumData {
  rank: number;
  username: string;
  profilePicture: string;
  value: number | string;
}

interface LeaderboardPodiumProps {
  podiumData: PodiumData[];
}

const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({
  podiumData
}) => {
  const podiumDisplayData = [podiumData[1], podiumData[0], podiumData[2]];

  return (
    <div className="leaderboard-podium-container">
      {podiumDisplayData.map((data) => (
        <div className={`podium-item podium-${data.rank}`}>
          <div className="podium-user-detail">
            <strong>{data.value}</strong>
          </div>
          <div className="podium-user-detail">
            <strong>{data.username}</strong>
          </div>
          <div className="podium-stand">
            <img src={data.profilePicture} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeaderboardPodium;
