import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../redux/userSlice";
import { clearLobby } from "../../redux/lobbySlice";
import { useDispatch } from "react-redux";
import ErrorPopup from "../authentication/subcomponents/ErrorPopup";

const LogoutButton: React.FC = () => {
  const [errorPopupMessage, setErrorPopupMessage] = React.useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleLogout = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include"
        }
      );

      if (res.ok) {
        dispatch(logout());
        dispatch(clearLobby());
        navigate("/");
        window.location.reload();
      } else {
        const data = await res.json();
        console.error("Logout failed:", data.message || "An error occurred");
        setErrorPopupMessage(
          "Logout failed:" + data.message || "An error occurred"
        );
      }
    } catch (err) {
      console.error("Error logging out:", err);
      setErrorPopupMessage("Error logging out: " + String(err));
    }
  };

  return (
    <button onClick={handleLogout} className="logout-button">
      {errorPopupMessage !== "" && (
        <ErrorPopup
          message={errorPopupMessage}
          setMessage={setErrorPopupMessage}
        />
      )}
      Logout
    </button>
  );
};

export default LogoutButton;
