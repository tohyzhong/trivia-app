import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../redux/userSlice";
import { clearLobby } from "../../redux/lobbySlice";
import { useDispatch } from "react-redux";
import { setError } from "../../redux/errorSlice";

const LogoutButton: React.FC = () => {
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
        dispatch(
          setError({
            errorMessage: "Logout failed: " + data.message,
            success: false
          })
        );
      }
    } catch (err) {
      console.error("Error logging out:", err);
      dispatch(
        setError({
          errorMessage: "Error logging out: " + String(err),
          success: false
        })
      );
    }
  };

  return (
    <button onClick={handleLogout} className="logout-button">
      Logout
    </button>
  );
};

export default LogoutButton;
