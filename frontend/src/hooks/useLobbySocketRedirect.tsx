import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setError } from "../redux/errorSlice";

export function useLobbySocketRedirect(username: string) {
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!socket) return;

    const handleApprove = (lobbyId: string) => {
      console.log("Approved to join lobby", lobbyId);
      navigate(`/play/lobby/${lobbyId}`);
    };

    const handleKick = (lobbyId: string) => {
      console.log("Kicked from lobby", lobbyId);
      dispatch(
        setError({
          errorMessage: "You were kicked from the lobby.",
          success: false
        })
      );

      /*
      if (!location.pathname.startsWith("/play/")) {
        navigate(`/`, {
          state: { errorMessage: "You were kicked from the lobby." }
        });
      }
        */
    };

    const handleReject = (lobbyId: string) => {
      console.log("Rejected from lobby", lobbyId);
      dispatch(
        setError({
          errorMessage: "You were rejected from the lobby.",
          success: false
        })
      );
    };

    socket.on("approveUser", handleApprove);
    socket.on("kickUser", handleKick);
    socket.on("rejectUser", handleReject);

    return () => {
      socket.off("approveUser", handleApprove);
      socket.off("kickUser", handleKick);
      socket.off("rejectUser", handleReject);
    };
  }, [socket, navigate]);
}
