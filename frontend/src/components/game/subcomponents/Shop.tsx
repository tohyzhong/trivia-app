import React from "react";
import { FaCoins } from "react-icons/fa";
import { GiShoppingCart } from "react-icons/gi";
import "../../../styles/Shop.css";
import { IoClose } from "react-icons/io5";
import { HiOutlineLightBulb } from "react-icons/hi2";
import { MdOutlineTimer } from "react-icons/md";
import { TbMultiplier2X } from "react-icons/tb";
import { setCurrency, setPowerups } from "../../../redux/lobbySlice";
import { useDispatch } from "react-redux";

const Shop = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useDispatch();
  const topups = [
    { amount: 100, price: "$1.49" },
    { amount: 500, price: "$4.99" },
    { amount: 1000, price: "$7.99" }
  ];

  const powerups = [
    {
      name: "Hint Boost",
      description: "Eliminates 2 wrong answers",
      cost: 40,
      image: <HiOutlineLightBulb />
    },
    {
      name: "Add Time",
      description: "Adds 5 seconds for the entire lobby",
      cost: 40,
      image: <MdOutlineTimer />
    },
    {
      name: "Double Points",
      description: "Doubles the score for 1 question",
      cost: 40,
      image: <TbMultiplier2X />
    }
  ];

  const handleTopUp = async (item: any) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/shop/create-checkout-session`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: item.amount })
        }
      );

      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        alert("Failed to start checkout.");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating checkout session.");
    }
  };

  const handlePurchase = async (item: any) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/shop/buy-powerup`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ powerupName: item.name })
        }
      );

      const data = await res.json();

      if (res.ok) {
        dispatch(setCurrency(data.currency));
        dispatch(setPowerups(data.powerups));
        alert(`${item.name} purchased successfully!`);
      } else {
        alert(data.message || "Purchase failed.");
      }
    } catch (error) {
      console.error("Error purchasing powerup:", error);
      alert("Error purchasing powerup.");
    }
  };

  return (
    <div className="shop-overlay">
      <div className="shop-window">
        <IoClose className="close-button" onClick={onClose} />

        <h2 className="shop-title">
          <GiShoppingCart /> Currency Shop
        </h2>

        <div className="section">
          <h3 className="section-title">Top Up</h3>
          {topups.map((item) => (
            <button
              key={item.amount}
              className="shop-item topup"
              onClick={() => handleTopUp(item)}
            >
              <span className="topup-amount">
                {item.amount} <FaCoins className="coin-icon" />
              </span>
              <span className="topup-price bold">{item.price}</span>
            </button>
          ))}
        </div>

        <div className="section">
          <h3 className="section-title">Power-ups</h3>
          {powerups.map((item) => (
            <div className="shop-item powerup" key={item.name}>
              <div className="powerup-icon">{item.image}</div>
              <div className="powerup-info">
                <div className="bold">{item.name}</div>
                <div className="desc">{item.description}</div>
              </div>
              <button
                className="powerup-button"
                onClick={() => handlePurchase(item)}
              >
                {item.cost} <FaCoins className="coin-icon" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Shop;
