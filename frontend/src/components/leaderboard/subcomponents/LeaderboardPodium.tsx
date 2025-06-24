import React from "react";
import defaultAvatar from "../../../assets/default-avatar.jpg";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const podiumDisplayData = [podiumData[1], podiumData[0], podiumData[2]];

  return (
    <div className="leaderboard-podium-container">
      {podiumDisplayData.map((data) => (
        <div className={`podium-item podium-${data.rank}`}>
          <div className="podium-user-detail">
            <strong>{data.value}</strong>
          </div>
          <div className="podium-user-detail podium-username">
            <strong onClick={() => navigate(`/profile/${data.username}`)}>
              {data.username}
            </strong>
          </div>
          <div className="podium-stand">
            <img
              src={data.profilePicture || defaultAvatar}
              alt={data.username}
              onError={(e) => (e.currentTarget.src = defaultAvatar)}
              onClick={() => navigate(`/profile/${data.username}`)}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeaderboardPodium;
