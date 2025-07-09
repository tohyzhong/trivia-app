import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useLocation, useNavigate } from "react-router-dom";

export function useLobbySocketRedirect(username: string) {
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!socket) return;

    const handleApprove = (lobbyId: string) => {
      console.log("Approved to join lobby", lobbyId);
      navigate(`/play/lobby/${lobbyId}`);
    };

    const handleKick = (lobbyId: string) => {
      console.log("Kicked from lobby", lobbyId);
      if (!location.pathname.startsWith("/play/")) {
        navigate(`/`, {
          state: { errorMessage: "You were kicked from the lobby." }
        });
      }
    };

    socket.on("approveUser", handleApprove);
    socket.on("kickUser", handleKick);

    return () => {
      socket.off("approveUser", handleApprove);
      socket.off("kickUser", handleKick);
    };
  }, [socket, navigate]);
}
