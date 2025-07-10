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
      <div className="currency-bar">
        <FaCoins className="coin-icon" />
        <span className="currency-value">{currency}</span>
        <button className="plus-button" onClick={() => setShowShop(true)}>
          <FaPlus size={12} />
        </button>
      </div>

      <div className="powerup-bar">
        <div className="powerup-item hint" title="Hint Boost">
          <HiOutlineLightBulb />
          <span>{powerups.hintBoosts}</span>
        </div>
        <div className="powerup-item freeze" title="Time Freeze">
          <TiMediaPauseOutline />
          <span>{powerups.timeFreezes}</span>
        </div>
        <div className="powerup-item double" title="Double Points">
          <TbMultiplier2X style={{ fontSize: "23" }} />
          <span>{powerups.doublePoints}</span>
        </div>
      </div>

      {showShop && <Shop onClose={() => setShowShop(false)} />}
    </div>
  );
};

export default CurrencyBar;
