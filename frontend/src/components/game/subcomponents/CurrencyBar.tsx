import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { FaCoins, FaPlus } from "react-icons/fa";
import { HiOutlineLightBulb } from "react-icons/hi2";
import { MdOutlineTimer } from "react-icons/md";
import { TbMultiplier2X } from "react-icons/tb";
import Shop from "./Shop";
import { setHintRevealed, setPowerups } from "../../../redux/lobbySlice";
import "../../../styles/CurrencyBar.css";
import { useLocation } from "react-router-dom";
import { setError } from "../../../redux/errorSlice";
import { motion } from "framer-motion";

const CurrencyBar: React.FC = () => {
  const currency = useSelector((state: RootState) => state.lobby.currency);
  const powerups = useSelector((state: RootState) => state.lobby.powerups);
  const status = useSelector((state: RootState) => state.lobby.status);
  const lobbyId = useSelector((state: RootState) => state.lobby.lobbyId);
  const location = useLocation();
  const dispatch = useDispatch();
  const [showShop, setShowShop] = useState(false);

  const handleUsePowerup = async (
    powerupName: "Hint Boost" | "Add Time" | "Double Points"
  ) => {
    const isCorrectPage = /^\/play\/[^/]+$/.test(location.pathname);
    const isGameActive = status === "in-progress";

    if (!isCorrectPage || !isGameActive) {
      dispatch(
        setError({
          errorMessage: "You can only use powerups during an active game.",
          success: false
        })
      );
      return;
    }

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/lobby/use-powerup/${lobbyId}`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ powerupName })
      }
    );
    const data = await res.json();
    if (res.ok) {
      dispatch(setError({ errorMessage: data.message, success: true }));
      dispatch(setPowerups(data.powerups));
      if (powerupName === "Hint Boost") {
        dispatch(setHintRevealed(data.hintBoost));
      }
    } else {
      dispatch(setError({ errorMessage: data.message, success: false }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="currency-bar-container">
        <div className="bar-container-coins currency-bar">
          <div className="icon-value">
            <FaCoins className="coin-icon" />
            <span className="currency-value">{currency}</span>
          </div>
          <button
            className="plus-button currency-value"
            onClick={() => setShowShop(true)}
          >
            <FaPlus size={12} />
          </button>
        </div>

        <div className="bar-container powerup-hint" title="Hint Boost">
          <div
            className="icon-value"
            onClick={() => handleUsePowerup("Hint Boost")}
          >
            <HiOutlineLightBulb style={{ fontSize: "20px" }} />
            <span>{powerups.hintBoosts}</span>
          </div>
        </div>

        <div
          className="bar-container powerup-freeze"
          title="Add Time"
          onClick={() => handleUsePowerup("Add Time")}
        >
          <div className="icon-value">
            <MdOutlineTimer style={{ fontSize: "20px" }} />
            <span>{powerups.addTimes}</span>
          </div>
        </div>

        <div
          className="bar-container powerup-double"
          title="Double Points"
          onClick={() => handleUsePowerup("Double Points")}
        >
          <div className="icon-value">
            <TbMultiplier2X style={{ fontSize: "20px" }} />
            <span>{powerups.doublePoints}</span>
          </div>
        </div>

        {showShop && <Shop onClose={() => setShowShop(false)} />}
      </div>
    </motion.div>
  );
};

export default CurrencyBar;
