import React, { useState } from "react";
import LeaderboardTable from "./subcomponents/LeaderboardTable";
import "../../styles/leaderboard.css";
import { useInitSound } from "../../hooks/useInitSound";
import useBGMResumeOverlay from "../../hooks/useBGMResumeOverlay";
import PauseOverlay from "../game/PauseOverlay";
import { IoClose, IoSettingsOutline } from "react-icons/io5";
import SoundSettings from "../game/subcomponents/SoundSettings";
import { playClickSound } from "../../utils/soundManager";

interface LeaderboardProps {
  headerTitle: string;
  apiRoute: string;
  valueField: string;
  valueHeader: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  headerTitle,
  apiRoute,
  valueField,
  valueHeader
}) => {
  useInitSound("Lobby");
  const { bgmBlocked, handleResume } = useBGMResumeOverlay("Lobby");

  const [isSoundPopupOpen, setIsSoundPopupOpen] = useState<boolean>(false);

  return (
    <div className="leaderboard-container-full">
      {bgmBlocked && <PauseOverlay onResume={handleResume} />}
      <h1 className="leaderboard-header">Top {headerTitle}</h1>
      <LeaderboardTable
        apiRoute={apiRoute}
        valueField={valueField}
        valueHeader={valueHeader}
      />

      <IoSettingsOutline
        onClick={() => {
          playClickSound();
          setIsSoundPopupOpen(true);
        }}
        className="sound-settings-icon"
      />

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
  );
};

export default Leaderboard;
