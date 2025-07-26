import React from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "motion/react";
import "../../../styles/gamelobby.css";

interface Props {
  message?: string;
}

const GameLoading: React.FC<Props> = ({ message = "Loading Lobby . . ." }) => {
  return (
    <div className="loader-full">
      <motion.div
        className="loading-icon-container"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
      >
        <AiOutlineLoading3Quarters
          className="loading-icon"
          style={{
            fontSize: "2.5rem"
          }}
        />
      </motion.div>
      <h1>{message}</h1>
    </div>
  );
};

export default GameLoading;
