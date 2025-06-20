import React from "react";
import "../../styles/PauseOverlay.css";

interface PauseOverlayProps {
  onResume: () => void;
}

const PauseOverlay: React.FC<PauseOverlayProps> = ({ onResume }) => {
  return (
    <div className="pause-overlay">
      <div className="pause-message">
        <h2>Game Paused</h2>
        <button className="resume-button" onClick={onResume}>
          Resume
        </button>
      </div>
    </div>
  );
};

export default PauseOverlay;
