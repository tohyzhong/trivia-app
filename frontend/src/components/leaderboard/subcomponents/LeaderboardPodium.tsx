import React from "react";
import defaultAvatar from "../../../assets/default-avatar.jpg";
import { useNavigate } from "react-router-dom";

interface RowData {
  username: string;
  profilePicture: string;
  correctAnswer: number;
  totalAnswer: number;
  correctRate?: number;
  wonMatches?: number;
  totalMatches?: number;
  winRate?: number;
  rank: number;
  score: number;
}

interface LeaderboardPodiumProps {
  podiumData: RowData[];
  sortField: string;
}

const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({
  podiumData,
  sortField
}) => {
  const navigate = useNavigate();
  const podiumDisplayData = [podiumData[1], podiumData[0], podiumData[2]];

  const getUserDetail = (data: RowData) => {
    if (sortField === "correctAnswer")
      return `${data.correctAnswer} Correct Answers`;
    if (sortField === "totalAnswer")
      return `${data.totalAnswer} Questions Answered`;
    if (sortField === "correctRate")
      return `${data.correctRate === -1 ? "N.A." : data.correctRate.toFixed(2) + "%"} Correct`;
    return sortField === "correctAnswer"
      ? `${data.correctAnswer} Correct Answers`
      : sortField === "totalAnswer"
        ? `${data.totalAnswer} Questions Answered`
        : sortField === "correctRate"
          ? `${data.correctRate === -1 ? "N.A." : data.correctRate.toFixed(2) + "%"}`
          : sortField === "wonMatches"
            ? `${data.wonMatches} Matches Won`
            : sortField === "totalMatches"
              ? `${data.totalMatches} Matches`
              : sortField === "winRate"
                ? `${data.winRate === -1 ? "N.A." : data.winRate.toFixed(2) + "%"} Won`
                : sortField === "score"
                  ? `${data.score}`
                  : "";
  };

  console.log(podiumData);
  console.log(sortField);

  return (
    <div className="leaderboard-podium-container">
      {podiumDisplayData.map((data) =>
        data ? (
          <div className={`podium-item podium-${data.rank}`}>
            <div className="podium-user-detail">
              <strong>{getUserDetail(data)}</strong>
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
        ) : (
          <></>
        )
      )}
    </div>
  );
};

export default LeaderboardPodium;
