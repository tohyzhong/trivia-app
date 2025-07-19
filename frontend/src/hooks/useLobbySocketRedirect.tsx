import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setError } from "../redux/errorSlice";

export function useLobbySocketRedirect() {
  const socket = useSocket();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!socket) return;

    const handleApprove = (lobbyId: string) => {
      navigate(`/play/lobby/${lobbyId}`);
      dispatch(
        setError({
          errorMessage: "Your lobby join request was approved.",
          success: true
        })
      );
    };

    const handleKick = () => {
      dispatch(
        setError({
          errorMessage: "You were kicked from the lobby.",
          success: false
        })
      );
    };

    const handleReject = () => {
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
