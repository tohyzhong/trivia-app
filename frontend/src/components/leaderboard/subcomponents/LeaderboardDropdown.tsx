import React from "react";
import { useNavigate } from "react-router-dom";

interface LeaderboardDropdownProps {}

const LeaderboardDropdown: React.FC<LeaderboardDropdownProps> = ({}) => {
  const options = [
    {
      name: "Correct Rate (Sigma Snipers)",
      key: "correct-rate",
      link: "/leaderboard/correctrate"
    },
    {
      name: "Total Answered (Certified Quiz Addicts)",
      key: "total-answer",
      link: "/leaderboard/totalanswer"
    },
    {
      name: "Correctly Answered (Enlightened Rizzlers)",
      key: "correct-answer",
      link: "/leaderboard/correctanswer"
    }
  ];

  const navigate = useNavigate();
  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value;
    navigate(selected);
  };

  // Get current path to set as default selected option
  const currentPath = window.location.pathname;
  const defaultValue =
    options.find((option) => option.link === currentPath)?.link ||
    options[0].link;

  return (
    <div className="leaderboard-dropdown-container">
      <select
        className="leaderboard-dropdown"
        onChange={handleSelect}
        value={defaultValue}
      >
        {options.map((option) => (
          <option key={option.key} value={option.link}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LeaderboardDropdown;
