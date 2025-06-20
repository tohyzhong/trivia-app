import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import "../../../styles/modeselect.css";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import ErrorPopup from "../../authentication/subcomponents/ErrorPopup";
import { setLobby } from "../../../redux/lobbySlice";

interface SubMode {
  name: string;
  description: string;
  image: string;
}

interface ModeSelectProps {
  mode: string; // 'Solo Mode', 'Multiplayer Mode'
  submodes: SubMode[];
  setActive: (active: boolean) => void;
}

const submodeSelect: React.FC<ModeSelectProps> = (props) => {
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest(".submode-select-container-full") &&
        !target.closest(".submode-select-container")
      ) {
        props.setActive(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // For error popup
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showError, setShowError] = useState<boolean>(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loggedInUser = useSelector((state: RootState) => state.user.username);

  const handleSubmodeClick = async (submode: string) => {
    if (submode === "Coming Soon...") return; // No effect for clicking on coming soon tab
    const mainMode = props.mode === "Solo Mode" ? "solo" : "multi";
    const subMode = submode.toLowerCase();
    const lobbyMode = mainMode + "-" + subMode;

    // Create a lobby
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/lobby/solo/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ gameType: lobbyMode, player: loggedInUser })
        }
      );
      const data = await response.json();

      if (response.ok) {
        dispatch(
          setLobby({ lobbyId: data.lobbyId, categories: data.categories })
        );
        navigate(`/play/${data.lobbyId}`);
      } else {
        setErrorMessage(data.message || "Failed to create lobby");
        setShowError(true);
      }
    } catch (error) {
      setErrorMessage("An error occurred while creating the lobby");
      setShowError(true);
    }
  };

  return (
    <>
      {showError && (
        <ErrorPopup message={errorMessage} setMessage={setErrorMessage} />
      )}
      <motion.div
        className="submode-select-container-full"
        initial={{ opacity: 0, y: "-20%" }}
        animate={{ opacity: 1, y: "0%", transition: { duration: 0.3 } }}
      >
        <div className="submode-select-container">
          <div className="submode-select-header">
            <h3>{props.mode}</h3>
            <IoClose
              className="submode-select-close"
              onClick={() => props.setActive(false)}
            />
          </div>
          <div className="submode-select-content">
            {props.submodes.map((submode, index) => (
              <div
                key={index}
                className="submode-select-item"
                onClick={() => handleSubmodeClick(submode.name)}
              >
                <h4 className="submode-item-header">{submode.name}</h4>
                <img
                  src={submode.image}
                  alt={`${submode.name} logo`}
                  className="submode-select-image"
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default submodeSelect;
