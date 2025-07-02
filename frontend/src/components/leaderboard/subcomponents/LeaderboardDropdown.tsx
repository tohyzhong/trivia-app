import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  gameFormat: string;
  setGameFormat: (val: string) => void;
  mode: string;
  setMode: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  categories: string[];
}

const LeaderboardDropdown: React.FC<Props> = ({
  gameFormat,
  setGameFormat,
  mode,
  setMode,
  category,
  setCategory,
  categories
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/leaderboard/${gameFormat}/${mode}/${category}`);
  }, [gameFormat, mode, category]);

  return (
    <div className="leaderboard-dropdown-container">
      <div className="dropdown-group">
        <label className="dropdown-label">Game Type</label>
        <select
          className="leaderboard-dropdown"
          value={gameFormat}
          onChange={(e) => setGameFormat(e.target.value)}
        >
          <option value="classic">Classic</option>
          <option value="knowledge">Knowledge</option>
        </select>
      </div>

      <div className="dropdown-group">
        <label className="dropdown-label">Mode</label>
        <select
          className="leaderboard-dropdown"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="Overall">Overall</option>
          <option value="Solo">Solo</option>
          <option value="Versus">Versus</option>
          <option value="Co-Op">Co-Op</option>
        </select>
      </div>

      <div className="dropdown-group">
        <label className="dropdown-label">Category</label>
        <select
          className="leaderboard-dropdown"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LeaderboardDropdown;
