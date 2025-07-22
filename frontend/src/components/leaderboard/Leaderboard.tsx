import React, { useEffect, useState } from "react";
import LeaderboardTable from "./subcomponents/LeaderboardTable";
import "../../styles/leaderboard.css";
import { useInitSound } from "../../hooks/useInitSound";
import useBGMResumeOverlay from "../../hooks/useBGMResumeOverlay";
import PauseOverlay from "../game/PauseOverlay";
import { IoClose, IoSettingsOutline } from "react-icons/io5";
import SoundSettings from "../game/subcomponents/SoundSettings";
import { playClickSound } from "../../utils/soundManager";
import { useNavigate, useParams } from "react-router-dom";
import LeaderboardDropdown from "./subcomponents/LeaderboardDropdown";
import { motion } from "framer-motion";

const Leaderboard: React.FC = () => {
  useInitSound("Lobby");
  const { bgmBlocked, handleResume } = useBGMResumeOverlay("Lobby");
  const [isSoundPopupOpen, setIsSoundPopupOpen] = useState<boolean>(false);

  const { gameFormat, mode, category } = useParams();
  const navigate = useNavigate();

  const [format, setFormat] = useState(gameFormat || "classic");
  const [selectedMode, setSelectedMode] = useState(mode || "Overall");
  const [selectedCategory, setSelectedCategory] = useState(
    category || "Overall"
  );
  const [fetchedCategories, setFetchedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!gameFormat || !mode || !category) {
      navigate(`/leaderboard/${format}/${selectedMode}/${selectedCategory}`);
    }
  }, [gameFormat, mode, category]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/leaderboard/categories`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
          }
        );
        const data = await response.json();
        // Make sure Community only appears once. Community is needed in case all questions are approved.
        const categories = ["Overall", ...data];
        if (!categories.includes("Community")) {
          categories.splice(1, 0, "Community");
        }
        setFetchedCategories(categories);
      } catch (err) {
        console.error(err);
        setFetchedCategories(["Overall", "Community"]);
      }
    };
    fetchCategories();
  }, []);

  const getHeaderTitle = () => {
    const formatTitle = format === "classic" ? "Classic" : "Knowledge";
    const modeTitle =
      selectedMode === "Overall" ? "All Modes" : `${selectedMode} Mode`;
    const categoryTitle =
      selectedCategory === "Overall"
        ? "All Categories"
        : `${selectedCategory} Category`;
    return `${formatTitle} Game | ${modeTitle} | ${categoryTitle}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="leaderboard-container-full">
        {bgmBlocked && <PauseOverlay onResume={handleResume} />}
        <h1 className="leaderboard-header">{getHeaderTitle()}</h1>

        <LeaderboardDropdown
          gameFormat={format}
          setGameFormat={setFormat}
          mode={selectedMode}
          setMode={setSelectedMode}
          category={selectedCategory}
          setCategory={setSelectedCategory}
          categories={fetchedCategories}
        />

        <LeaderboardTable
          gameFormat={format}
          mode={selectedMode}
          category={selectedCategory}
        />

        <IoSettingsOutline
          onClick={() => {
            playClickSound();
            setIsSoundPopupOpen(true);
          }}
          className="sound-settings-icon"
        />
        <p className="hover-text-2 sound-settings-icon-text">Game Settings</p>

        {isSoundPopupOpen && (
          <div className="sound-settings-popup">
            <IoClose
              className="submode-select-close"
              onClick={() => {
                playClickSound();
                setIsSoundPopupOpen(false);
              }}
            />
            <SoundSettings />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Leaderboard;
