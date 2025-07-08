import React, { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import GameLoading from "./gamelobby/GameLoading";
import ErrorPopup from "../authentication/subcomponents/ErrorPopup";

const JoinLobbyHandler: React.FC = () => {
  const [status, setStatus] = useState<
    "pending" | "approved" | "rejected" | "error"
  >("pending");
  const [error, setError] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();
  const { lobbyId } = useParams();
  const loggedInUser = useSelector((state: RootState) => state.user.username);

  useEffect(() => {
    if (!lobbyId) return;

    const requestJoin = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/lobby/requestjoin/${lobbyId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
          }
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message || "There was an error. Please try again later."
          );
        }

        if (res.status === 200 && data.message === "Already in lobby.") {
          setStatus("approved");
          navigate(`/lobby/${lobbyId}`);
        } else if (res.status === 200) {
          setStatus("pending");
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
        setError(err.message);
      }
    };

    requestJoin();

    socket.emit("joinLobby", lobbyId);

    socket.on("updateUsers", (data) => {
      if (Object.keys(data.players).includes(loggedInUser)) {
        setStatus("approved");
        const pictures: { [username: string]: string } = {};
        Object.entries(data.players).forEach(
          ([username, player]: [string, any]) => {
            pictures[username] = player.profilePicture || "";
          }
        );
        navigate(`/play/lobby/${lobbyId}`, {
          state: {
            players: data.players,
            host: data.host,
            profilePictures: pictures
          }
        });
      }
    });

    socket.on("updateJoinRequests", (data) => {
      if (status !== "approved" && !Object.keys(data).includes(loggedInUser)) {
        setStatus("rejected");
      }
    });

    return () => {
      socket.emit("leaveLobby", lobbyId);
      socket.off("updateUsers");
      socket.off("updateJoinRequests");
    };
  }, [lobbyId]);

  useEffect(() => {
    if (status === "rejected") {
      setError("You were rejected from the lobby.");
    }
  }, [status]);

  if (status === "pending") {
    return (
      <GameLoading message="Waiting for host to approve your request..." />
    );
  }

  return (
    <div>
      <ErrorPopup message={error} setMessage={setError} />
    </div>
  );
};

export default JoinLobbyHandler;
