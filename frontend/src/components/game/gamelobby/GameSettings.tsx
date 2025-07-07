import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import ErrorPopup from "../../authentication/subcomponents/ErrorPopup";

import { playClickSound } from "../../../utils/soundManager";

interface GameSetting {
  numQuestions: number;
  timePerQuestion: number;
  difficulty: number;
  categories: string[];
}

interface GameSettingsProps {
  gameSettings: GameSetting;
  lobbyId: string;
  host: string;
}

const GameSettings: React.FC<GameSettingsProps> = ({
  gameSettings,
  lobbyId,
  host
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
    const { name, value, checked } = e.target;

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

  return (
    <div className="game-lobby-settings">
      <ErrorPopup
        message={successMessage}
        setMessage={setSuccessMessage}
        success={successMessage === "Settings Saved."}
      />

      <div className="game-lobby-settings-header">
        <h1>Game Settings</h1>
      </div>
      <div className="game-lobby-settings-content">
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
