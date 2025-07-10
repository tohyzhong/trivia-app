import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import ErrorPopup from "../../authentication/subcomponents/ErrorPopup";
import { IoClose, IoInformationCircleOutline } from "react-icons/io5";

import { playClickSound } from "../../../utils/soundManager";

interface GameSetting {
  numQuestions: number;
  timePerQuestion: number;
  difficulty: number;
  categories: string[];
  name: string;
  publicVisible: boolean;
}

interface GameSettingsProps {
  gameSettings: GameSetting;
  lobbyId: string;
  host: string;
  gameType: string;
}

const GameSettings: React.FC<GameSettingsProps> = ({
  gameSettings,
  lobbyId,
  host,
  gameType
}) => {
  const [settings, setSettings] = useState<GameSetting>(gameSettings);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const availableCategories = useSelector(
    (state: RootState) => state.lobby.categories
  );
  const localUsername = useSelector((state: RootState) => state.user.username);

  // Keep community mode separate from default categories
  const [isCommunitySelected, setCommunitySelected] = useState<boolean>(
    gameSettings.categories.includes("Community")
  );

  // For button disabling
  const [settingsChanged, setSettingsChanged] = useState<boolean>(false);

  useEffect(() => {
    setSettings(gameSettings);
  }, [gameSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;

    if (name === "categories") {
      if (value === "Community") {
        setCommunitySelected(checked);
      }

      setSettings((prevSettings) => ({
        ...prevSettings,
        categories: checked
          ? [...prevSettings.categories, value]
          : prevSettings.categories.filter((category) => category !== value)
      }));
    } else if (type === "checkbox") {
      setSettings((prev) => ({ ...prev, [name]: checked }));
    } else {
      setSettings((prevSettings) => ({
        ...prevSettings,
        [name]:
          name === "difficulty" ||
          name === "numQuestions" ||
          name === "timePerQuestion"
            ? parseInt(value)
            : value
      }));
    }
  };

  const handleSaveSettings = async () => {
    if (!settingsChanged) return; //

    playClickSound();
    if (settings.categories.length === 0) {
      setSuccessMessage("Please select at least one category.");
      return;
    } else if (settings.numQuestions < 3 || settings.numQuestions > 20) {
      setSuccessMessage(
        "Number of questions must be between 3 and 20 (inclusive)."
      );
      return;
    } else if (settings.timePerQuestion < 5 || settings.timePerQuestion > 60) {
      setSuccessMessage(
        "Time per question must be between 5 and 60 (inclusive)."
      );
      return;
    } else if (settings.difficulty < 1 || settings.difficulty > 5) {
      setSuccessMessage("Difficulty must be between 1 and 5 (inclusive).");
      return;
    } else if (settings.name.length < 5 || settings.name.length > 30) {
      setSuccessMessage(
        "Lobby name must be between 5 and 30 characters (inclusive)."
      );
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/lobby/updateSettings/${lobbyId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify(
            isCommunitySelected
              ? { gameSettings: { ...settings, categories: ["Community"] } }
              : { gameSettings: settings }
          )
        }
      );

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage("Settings Saved.");
      } else {
        console.error(data.message);
        setSuccessMessage("Error saving settings: " + data.message);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setSuccessMessage("Error saving settings: " + error);
    }
  };

  // Enable and disable button accordingly
  useEffect(() => {
    setSettingsChanged(
      !(
        JSON.stringify(gameSettings) ===
        JSON.stringify({
          ...settings,
          categories: settings.categories.includes("Community")
            ? ["Community"]
            : settings.categories
        })
      )
    );
  }, [settings, gameSettings]);

  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);

  const getGameDescription = (gameType: string) => {
    switch (gameType) {
      case "solo-classic":
        return `Solo Classic Mode: Classic MCQ with 4 Options
                Rules:
                  1. Select the correct option before the time run out
                  2. Answer as fast as possible for maximum score
                  3. The lowest attainable score is 40
                  4. Consecutive correct answers will grant additional bonus score (10 - 50)
                Stats Earnable:
                  Profile & Leaderboard: 100% Score, 100% Question Answered + Total Count (Questions and Match)
                  Match History: Answer History, Categorical Breakdown, Score, Correct Number
                Coins Earnable:
                  1% of Score Earned`;
      case "coop-classic":
        return `Co-op Classic Mode: 4 Option MCQ with Friends
                Rules:
                  1. Select the correct option before the time run out
                  2. Answer as fast as possible for maximum score
                  3. The lowest attainable score is 40
                  4. Consecutive correct answers will grant additional bonus score (10 - 50)
                  5. Every player will get one chance to vote for their preferred option - the team's final answer will be the option with the most votes
                  6. Ties between 2 options will be considered "Correct" if the correct option is one of them; 3/4 tied options will be considered "Wrong"
                Stats Earnable:
                  Profile & Leaderboard: Score = Team Score ÷ Number of Players, 100% Question Answered + Total Count (Questions and Match)
                  Match History: Individual Answer History, Team Answer History, Individual Categorical Breakdown, Score, Correct Number
                Coins Earnable:
                  1% of Score Credited to Profile & Leaderboard`;
      case "versus-classic":
        return `Versus Classic Mode: Battle against other players!
                Rules:
                  1. Select the correct option before the time run out
                  2. Answer as fast as possible for maximum score
                  3. The lowest attainable score is 40
                  4. Consecutive correct answers will grant additional bonus score (10 - 50)
                  5. The Top 50% of players (by score) will win
                Stats Earnable:
                  Profile & Leaderboard: 100% Score, 100% Question Answered + Total Count (Questions and Match), Wins
                  Match History: Individual Answer History, Team Answer History, Individual Categorical Breakdown, Score, Correct Number
                Coins Earnable:
                  1% of Score`;
      case "solo-knowledge":
        return `Solo Knowledge Mode: Test your knowledge in a open-ended solo challenge!
                Stats Earnable:
                  Profile & Leaderboard: 100% Score, 100% Question Answered + Total Count (Questions and Match)
                  Match History: Individual Answer History, Team Answer History, Individual Categorical Breakdown, Score, Correct Number
                Coins Earnable:
                  1% of Score`;
      case "coop-knowledge":
        return `Co-op Knowledge Mode: Collaborate with friends in this knowledge-based open-ended challenge!
                Stats Earnable:
                  Profile & Leaderboard: Score = Team Score ÷ Number of Players, 100% Question Answered + Total Count (Questions and Match)
                  Match History: Individual Answer History, Team Answer History, Individual Categorical Breakdown, Score, Correct Number
                Coins Earnable:
                  1% of Score Credited to Profile & Leaderboard`;
      case "versus-knowledge":
        return `Versus Knowledge Mode: Compete against other players in an open-ended battle of knowledge!
                Stats Earnable:
                  Profile & Leaderboard: Score = Team Score ÷ Number of Players, 100% Question Answered + Total Count (Questions and Match)
                  Match History: Individual Answer History, Team Answer History, Individual Categorical Breakdown, Score, Correct Number
                Coins Earnable:
                  1% of Score Credited to Profile & Leaderboard`;
      default:
        return `Select a mode to see the description.`;
    }
  };

  return (
    <div className="game-lobby-settings">
      <ErrorPopup
        message={successMessage}
        setMessage={setSuccessMessage}
        success={successMessage === "Settings Saved."}
      />

      <div className="game-lobby-settings-header">
        <h1>
          Game Settings{" "}
          <IoInformationCircleOutline
            size={20}
            style={{ cursor: "pointer", marginLeft: "10px" }}
            onClick={() => setIsPopupOpen(true)}
          />
        </h1>
      </div>

      {isPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-content">
            <IoClose
              className="close-popup-overlay"
              onClick={() => {
                playClickSound();
                setIsPopupOpen(false);
              }}
            />
            <div className="game-description">
              {getGameDescription(gameType)
                .split("\n")
                .map((line, index) => {
                  // Check if the line contains "Stats Earnable" or "Coins Earnable" to bold them
                  if (line.includes("Mode")) {
                    return <h2>{line}</h2>;
                  }
                  if (
                    line.includes("Stats Earnable") ||
                    line.includes("Coins Earnable") ||
                    line.includes("Rules")
                  ) {
                    return (
                      <p key={index} className="bold-text">
                        {line}
                      </p>
                    );
                  }

                  // Add tabbed indentation for the subitems (like Profile & Leaderboard)
                  if (line.startsWith("  ")) {
                    return (
                      <p key={index} className="tabbed-text">
                        {line}
                      </p>
                    );
                  }

                  return <p key={index}>{line}</p>;
                })}
            </div>
          </div>
        </div>
      )}

      <div className="game-lobby-settings-content">
        <div className="game-lobby-settings-item">
          <label>Lobby Name:</label>
          <input
            type="text"
            name="name"
            value={settings.name || ""}
            onChange={handleChange}
            disabled={host !== localUsername}
            minLength={5}
            maxLength={30}
          />
        </div>
        <div className="game-lobby-settings-item">
          <label>Lobby Visibility:</label>
          <div className="game-lobby-public-checkbox">
            <label>
              <input
                type="checkbox"
                name="publicVisible"
                checked={settings.publicVisible || false}
                onChange={handleChange}
                disabled={host !== localUsername}
              />
              Public
            </label>
          </div>
        </div>
        <div className="game-lobby-settings-item">
          <label>Number of Questions:</label>
          <input
            type="number"
            name="numQuestions"
            value={settings.numQuestions}
            onChange={handleChange}
            min={3}
            max={20}
            disabled={host !== localUsername}
          />
        </div>
        <div className="game-lobby-settings-item">
          <label>Time Limit:</label>
          <input
            type="number"
            name="timePerQuestion"
            value={settings.timePerQuestion}
            onChange={handleChange}
            min={5}
            max={60}
            disabled={host !== localUsername}
          />
        </div>
        <div className="game-lobby-settings-item">
          <label>Difficulty:</label>
          <input
            type="number"
            name="difficulty"
            value={settings.difficulty}
            onChange={handleChange}
            min={1}
            max={5}
            disabled={host !== localUsername}
          />
        </div>
        <div className="game-lobby-settings-item">
          <label>Categories:</label>
          <div>
            {availableCategories.map((category) => (
              <div key={category} className="game-lobby-settings-category">
                <input
                  type="checkbox"
                  id={category}
                  name="categories"
                  value={category}
                  checked={settings.categories.includes(category)}
                  onChange={handleChange}
                  disabled={
                    (isCommunitySelected && category !== "Community") ||
                    host !== localUsername
                  }
                />
                <label htmlFor={category}>{category}</label>
              </div>
            ))}
          </div>
        </div>
        {isCommunitySelected && (
          <div className="community-mode-warning-container">
            <p className="community-mode-warning">
              Note: Community Mode uses a separate question bank built from
              player contributions. Stats will not be counted in this category.
            </p>
          </div>
        )}
      </div>
      <div className="game-lobby-settings-footer">
        <button
          className={`save-settings-button ${settingsChanged ? "" : "disabled"}`}
          onClick={handleSaveSettings}
        >
          Update Settings
        </button>
      </div>
    </div>
  );
};

export default GameSettings;
