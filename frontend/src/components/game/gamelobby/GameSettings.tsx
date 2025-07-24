import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { IoClose, IoInformationCircleOutline } from "react-icons/io5";
import { playClickSound } from "../../../utils/soundManager";
import { setError } from "../../../redux/errorSlice";

interface GameSetting {
  numQuestions: number;
  timePerQuestion: number;
  difficulty: number;
  categories?: string[];
  community?: boolean;
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
  const availableCategories = useSelector(
    (state: RootState) => state.lobby.categories
  );
  const localUsername = useSelector((state: RootState) => state.user.username);
  const dispatch = useDispatch();

  const lobbyType = gameType.split("-")[0];
  const gameMode = gameType.split("-")[1];

  // Keep community mode separate from default categories
  const [isCommunitySelected, setCommunitySelected] = useState<boolean>(
    gameMode === "classic"
      ? gameSettings.categories?.includes("Community")
      : gameSettings.community
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
      if (name === "community") setCommunitySelected(checked);
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
    if (!settingsChanged) return;

    playClickSound();
    if (gameMode === "classic" && settings.categories.length === 0) {
      dispatch(
        setError({
          errorMessage: "Please select at least one category.",
          success: false
        })
      );
      return;
    } else if (settings.numQuestions < 3 || settings.numQuestions > 20) {
      dispatch(
        setError({
          errorMessage:
            "Number of questions must be between 3 and 20 (inclusive).",
          success: false
        })
      );
      return;
    } else if (settings.timePerQuestion < 5 || settings.timePerQuestion > 60) {
      dispatch(
        setError({
          errorMessage:
            "Time per question must be between 5 and 60 (inclusive).",
          success: false
        })
      );
      return;
    } else if (settings.difficulty < 1 || settings.difficulty > 5) {
      dispatch(
        setError({
          errorMessage: "Difficulty must be between 1 and 5 (inclusive).",
          success: false
        })
      );
      return;
    } else if (settings.name.length < 5 || settings.name.length > 30) {
      dispatch(
        setError({
          errorMessage:
            "Lobby name must be between 5 and 30 characters (inclusive).",
          success: false
        })
      );
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/${gameMode === "classic" ? "" : gameMode}lobby/updateSettings/${lobbyId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify(
            gameMode === "classic"
              ? isCommunitySelected
                ? { gameSettings: { ...settings, categories: ["Community"] } }
                : { gameSettings: settings }
              : { gameSettings: settings }
          )
        }
      );

      const data = await response.json();
      if (response.ok) {
        dispatch(
          setError({
            errorMessage: "Settings saved successfully.",
            success: true
          })
        );
      } else {
        console.error(data.message);
        dispatch(
          setError({
            errorMessage: "Error saving settings: " + data.message,
            success: false
          })
        );
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      dispatch(
        setError({
          errorMessage: "Error saving settings: " + error,
          success: false
        })
      );
    }
  };

  // Enable and disable button accordingly
  useEffect(() => {
    setSettingsChanged(
      !(
        JSON.stringify(gameSettings) ===
        JSON.stringify({
          ...settings,
          categories: settings.categories?.includes("Community")
            ? ["Community"]
            : settings.categories
        })
      )
    );
    if (settings.categories?.includes("Community") || settings.community)
      setCommunitySelected(true);
    else setCommunitySelected(false);
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
                  5. Stats and Coins are only credited upon returning to Lobby
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
                  5. Stats and Coins are only credited upon returning to Lobby
                  6. Every player will get one chance to vote for their preferred option - the team's final answer will be the option with the most votes
                  7. Ties between 2 options will be considered "Correct" if the correct option is one of them; 3/4 tied options will be considered "Wrong"
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
                  5. Stats and Coins are only credited upon returning to Lobby
                  6. The Top 50% of players (by score) will win
                Stats Earnable:
                  Profile & Leaderboard: 100% Score, 100% Question Answered + Total Count (Questions and Match), Wins
                  Match History: Individual Answer History, Team Answer History, Individual Categorical Breakdown, Score, Correct Number
                Coins Earnable:
                  1% of Score`;
      case "solo-knowledge":
        return `Solo Knowledge Mode: Test your knowledge in a open-ended solo challenge!
                Rules:
                  1. Enter your answer before the time run out
                  2. Possible options will appear in a dropdown as you type
                  3. Answer as fast as possible for maximum score
                  4. The lowest attainable score is 40
                  5. Consecutive correct answers will grant additional bonus score (10 - 50)
                  6. Stats and Coins are only credited upon returning to Lobby
                Stats Earnable:
                  Profile & Leaderboard: 100% Score, 100% Question Answered + Total Count (Questions and Match)
                  Match History: Individual Answer History, Team Answer History, Individual Categorical Breakdown, Score, Correct Number
                Coins Earnable:
                  1% of Score`;
      case "coop-knowledge":
        return `Co-op Knowledge Mode: Collaborate with friends in this knowledge-based open-ended challenge!
                Rules:
                  1. Enter your answer before the time run out
                  2. Possible options will appear in a dropdown as you type
                  2. Answer as fast as possible for maximum score
                  3. The lowest attainable score is 40
                  4. Consecutive correct answers will grant additional bonus score (10 - 50)
                  5. Stats and Coins are only credited upon returning to Lobby
                  6. Every player will get one chance to vote for their preferred option - the team's final answer will be the option with the most votes
                  7. Ties between 2 options will be considered "Correct" if the correct option is one of them; Other numbers of tied options will be considered "Wrong"
                Stats Earnable:
                  Profile & Leaderboard: Score = Team Score ÷ Number of Players, 100% Question Answered + Total Count (Questions and Match)
                  Match History: Individual Answer History, Team Answer History, Individual Categorical Breakdown, Score, Correct Number
                Coins Earnable:
                  1% of Score Credited to Profile & Leaderboard`;
      case "versus-knowledge":
        return `Versus Knowledge Mode: Compete against other players in an open-ended battle of knowledge!
                Rules:
                  1. Enter your answer before the time run out
                  2. Possible options will appear in a dropdown as you type
                  3. Answer as fast as possible for maximum score
                  4. The lowest attainable score is 40
                  5. Consecutive correct answers will grant additional bonus score (10 - 50)
                  6. Stats and Coins are only credited upon returning to Lobby
                  7. The Top 50% of players (by score) will win
                Stats Earnable:
                  Profile & Leaderboard: Score = Team Score ÷ Number of Players, 100% Question Answered + Total Count (Questions and Match)
                  Match History: Individual Answer History, Team Answer History, Individual Categorical Breakdown, Score, Correct Number
                Coins Earnable:
                  1% of Score Credited to Profile & Leaderboard`;
      default:
        return `Select a mode to see the description.`;
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest(".popup-overlay") &&
        !target.closest(".popup-content")
      ) {
        setIsPopupOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div className="game-lobby-settings">
      <div className="game-lobby-settings-header">
        <h1>
          Lobby Settings - {gameMode === "classic" ? "Classic " : "Knowledge "}
          <IoInformationCircleOutline
            size={20}
            style={{
              cursor: "pointer",
              marginLeft: "10px",
              verticalAlign: "middle"
            }}
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
                  if (line.includes("Mode")) {
                    return <h2 key={index}>{line}</h2>;
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
        {host !== localUsername && (
          <div className="disabled-overlay">
            <h3 className="disabled-text">
              Only the host can change the settings.
            </h3>
          </div>
        )}
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
          {lobbyType !== "solo" && (
            <>
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
            </>
          )}
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
        {gameMode === "classic" ? (
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
                    checked={settings.categories?.includes(category)}
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
        ) : (
          <div className="game-lobby-settings-item">
            <label>Community Mode:</label>
            <label>
              {isCommunitySelected ? "Enabled" : "Disabled"}
              <input
                type="checkbox"
                name="community"
                checked={isCommunitySelected}
                onChange={handleChange}
                disabled={host !== localUsername}
              />
            </label>
          </div>
        )}
        {isCommunitySelected && (
          <div className="community-mode-warning-container">
            <p className="community-mode-warning">
              Note: Community Mode uses a separate question bank built from
              player contributions.{" "}
              {gameMode === "classic" &&
                "Other categories cannot be selected together with this mode."}
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
