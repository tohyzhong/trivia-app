import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";

export function useLobbySocketRedirect(username: string) {
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    const handleApprove = (lobbyId: string) => {
      console.log("Approved to join lobby", lobbyId);
      navigate(`/play/lobby/${lobbyId}`);
    };

    const handleKick = (lobbyId: string) => {
      console.log("Kicked from lobby", lobbyId);
      navigate(`/`, {
        state: { errorMessage: "You were kicked from the lobby." }
      });
    };

    socket.on("approveUser", handleApprove);
    socket.on("kickUser", handleKick);

    return () => {
      socket.off("approveUser", handleApprove);
      socket.off("kickUser", handleKick);
    };
  }, [socket, navigate]);
}
