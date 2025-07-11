import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { FaCoins, FaPlus } from "react-icons/fa";
import { HiOutlineLightBulb } from "react-icons/hi2";
import { MdOutlineTimer } from "react-icons/md";
import { TbMultiplier2X } from "react-icons/tb";
import Shop from "./Shop";
import { setCurrency, setPowerups } from "../../../redux/lobbySlice";
import "../../../styles/CurrencyBar.css";
import { useLocation } from "react-router-dom";

const confirmAndBuyPowerup = async (powerupName: string, dispatch: any) => {
  const confirmed = window.confirm(`Purchase ${powerupName} for 40 coins?`);
  if (!confirmed) return;

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/shop/buy-powerup`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ powerupName })
      }
    );

    const data = await res.json();

    if (res.ok) {
      dispatch(setCurrency(data.currency));
      dispatch(setPowerups(data.powerups));
      alert(`${powerupName} purchased successfully!`);
    } else {
      alert(data.message || "Purchase failed.");
    }
  } catch (error) {
    console.error("Error purchasing powerup:", error);
    alert("Error purchasing powerup.");
  }
};

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
      alert("You can only use powerups during an active game.");
      return;
    }

    const confirmed = window.confirm(`Use ${powerupName}?`);
    if (!confirmed) return;

    const res = await fetch(`/api/lobby/use-powerup/${lobbyId}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ powerupName })
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      dispatch(setPowerups(data.powerups));
      if (powerupName === "Hint Boost") {
        // TODO: Update display to mark out the 2 wrong options revealde
        let revealed = data.hintBoost;
        console.log("WRONG ANSWERS:", revealed);
      }
    } else {
      alert(data.message);
    }
  };

  return (
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
        <button
          className="plus-button powerup-hint"
          onClick={(e) => {
            e.stopPropagation();
            confirmAndBuyPowerup("Hint Boost", dispatch);
          }}
        >
          <FaPlus size={12} />
        </button>
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
        <button
          className="plus-button powerup-freeze"
          onClick={(e) => {
            e.stopPropagation();
            confirmAndBuyPowerup("Add Time", dispatch);
          }}
        >
          <FaPlus size={12} />
        </button>
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
        <button
          className="plus-button powerup-double"
          onClick={(e) => {
            e.stopPropagation();
            confirmAndBuyPowerup("Double Points", dispatch);
          }}
        >
          <FaPlus size={12} />
        </button>
      </div>

      {showShop && <Shop onClose={() => setShowShop(false)} />}
    </div>
  );
};

export default CurrencyBar;
