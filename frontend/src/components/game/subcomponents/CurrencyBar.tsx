import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { FaCoins, FaPlus } from "react-icons/fa";
import { HiOutlineLightBulb } from "react-icons/hi2";
import { TiMediaPauseOutline } from "react-icons/ti";
import { TbMultiplier2X } from "react-icons/tb";
import Shop from "./Shop";
import "../../../styles/CurrencyBar.css";

const CurrencyBar: React.FC = () => {
  const currency = useSelector((state: RootState) => state.lobby.currency);
  const powerups = useSelector((state: RootState) => state.lobby.powerups);
  const [showShop, setShowShop] = useState(false);

  return (
    <div className="currency-bar-container">
      <div className="bar-container currency-bar">
        <FaCoins className="coin-icon" />
        <span className="currency-value">{currency}</span>
        <button
          className="plus-button currency-value"
          onClick={() => setShowShop(true)}
        >
          <FaPlus size={12} />
        </button>
      </div>

      <div className="bar-container powerup-hint" title="Hint Boost">
        <div className="icon-value">
          <HiOutlineLightBulb style={{ fontSize: "20px" }} />
          <span>{powerups.hintBoosts}</span>
        </div>
        <button
          className="plus-button powerup-hint"
          onClick={() => setShowShop(true)}
        >
          <FaPlus size={12} />
        </button>
      </div>

      <div className="bar-container powerup-freeze" title="Time Freeze">
        <div className="icon-value">
          <TiMediaPauseOutline style={{ fontSize: "20px" }} />
          <span>{powerups.timeFreezes}</span>
        </div>
        <button
          className="plus-button powerup-freeze"
          onClick={() => setShowShop(true)}
        >
          <FaPlus size={12} />
        </button>
      </div>

      <div className="bar-container powerup-double" title="Double Points">
        <div className="icon-value">
          <TbMultiplier2X style={{ fontSize: "20px" }} />
          <span>{powerups.doublePoints}</span>
        </div>
        <button
          className="plus-button powerup-double"
          onClick={() => setShowShop(true)}
        >
          <FaPlus size={12} />
        </button>
      </div>

      {showShop && <Shop onClose={() => setShowShop(false)} />}
    </div>
  );
};

export default CurrencyBar;
