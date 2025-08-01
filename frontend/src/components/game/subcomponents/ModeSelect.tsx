import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import "../../../styles/modeselect.css";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { setLobby } from "../../../redux/lobbySlice";
import { playClickSound } from "../../../utils/soundManager";
import { setError } from "../../../redux/errorSlice";

interface SubMode {
  name: string;
  gameType: string;
  description: string;
  image: string;
}

interface ModeSelectProps {
  mode: string; // 'Solo Mode', 'Multiplayer Mode'
  submodes: SubMode[];
  setActive: (active: boolean) => void;
}

const submodeSelect: React.FC<ModeSelectProps> = (props) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;

    const handleWheel = (e: WheelEvent) => {
      if (scrollContainer && e.deltaY !== 0) {
        e.preventDefault();
        scrollContainer.scrollLeft += e.deltaY;
      }
    };

    if (scrollContainer) {
      scrollContainer.addEventListener("wheel", handleWheel, {
        passive: false
      });
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

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

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loggedInUser = useSelector((state: RootState) => state.user.username);

  const handleSubmodeClick = async (lobbyMode: string) => {
    playClickSound();
    if (lobbyMode === "Coming Soon...")
      return; // No effect for clicking on coming soon tab
    else if (lobbyMode === "Browse") {
      navigate("/play/lobbies");
      return;
    }

    // Create a lobby
    const gameMode = lobbyMode.split("-")[1];
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/${gameMode === "classic" ? "" : gameMode}lobby/create`,
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
          setLobby({
            lobbyId: data.lobbyId,
            categories: data.categories,
            currency: data.currency,
            powerups: data.powerups,
            status: data.status
          })
        );
        navigate(`/play/${data.lobbyId}`);
      } else {
        dispatch(
          setError({
            errorMessage: data.message || "Failed to create lobby.",
            success: false
          })
        );
      }
    } catch (error) {
      dispatch(
        setError({
          errorMessage: "An error occured while creating the lobby",
          success: false
        })
      );
      console.error(error);
    }
  };

  return (
    <>
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
          <div className="submode-select-content" ref={scrollRef}>
            {props.submodes.map((submode, index) => (
              <div
                key={index}
                className="submode-select-item"
                onClick={() => handleSubmodeClick(submode.gameType)}
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
