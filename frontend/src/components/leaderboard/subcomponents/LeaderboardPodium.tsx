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
  const podiumSetup = (arr: PodiumData[]) => {
    arr.push(arr.shift());
    arr.push(arr.shift());
    return arr;
  };
  const podiumDisplayData = podiumSetup([...podiumData]);

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
