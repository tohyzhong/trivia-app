import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { RootState } from "../../redux/store";
import GameLoading from "./gamelobby/GameLoading";
import GameLobby from "./gamelobby/GameLobby";
import { clearLobby } from "../../redux/lobbySlice";

interface GameSetting {
  numQuestions: number;
  timePerQuestion: number;
  difficulty: number;
  categories: string[];
}

interface ChatMessage {
  sender: string;
  message: string;
}

interface LobbyDetails {
  lobbyId: string;
  players: string[];
  gameType: "solo-classic" | "solo-knowledge";
  status: "waiting" | "in-progress" | "finished";
  gameSettings: GameSetting;
  chatMessages: { sender: string; message: string; timestamp: Date }[];
}

const socket = io(import.meta.env.VITE_API_URL);

const QuizHandler: React.FC = () => {
  // Loading state
  const [loading, setLoading] = useState<boolean>(true);
  const [lobbyState, setLobbyState] = useState<LobbyDetails>(null);

  // Details needed for lobby display
  const [users, setUsers] = useState<string[]>(null);
  const [gameSettings, setGameSettings] = useState<GameSetting>(null);
  const [gameChat, setGameChat] = useState<ChatMessage[]>(null);

  // Access check variables
  const { lobbyId } = useParams();
  const loggedInUser = useSelector((state: RootState) => state.user.username);

  // Socket management
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const disconnect = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/lobby/solo/disconnect/${lobbyId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ player: loggedInUser })
        }
      );
    } catch (error) {
      navigate("/", {
        state: {
          errorMessage:
            "There was an issue disconnecting you. A report has been sent to the admins"
        }
      });
    }
  };

  useEffect(() => {
    socket.emit("joinLobby", lobbyId);

    socket.on("updateChat", (data) => {
      setGameChat(data.chatMessages);
    });

    socket.on("updateSettings", (data) => {
      setGameSettings(data.gameSettings);
    });

    socket.on("updateUsers", (data) => {
      setUsers(data.players);
    });

    return () => {
      socket.emit("leaveLobby", lobbyId);
      disconnect();
      socket.off("updateSettings");
      socket.off("updateChat");
      socket.off("updateUsers");
    };
  }, []);

  // Handle access check and connection to lobby
  const checkAccess = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/lobby/solo/connect/${lobbyId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ player: loggedInUser })
        }
      );
      const data = await response.json();

      if (response.ok) {
        const lobbyDetails = data.lobbyDetails;
        setLobbyState(lobbyDetails);
        setGameSettings(lobbyDetails.gameSettings);
        setUsers(lobbyDetails.players);
        setGameChat(lobbyDetails.chatMessages);
        setLoading(false);
      } else {
        dispatch(clearLobby());
        navigate("/", { state: { errorMessage: data.message || "" } });
      }
    } catch (error) {
      dispatch(clearLobby());
      navigate("/", {
        state: {
          errorMessage:
            "Error fetching lobby details. Contact support if you believe this is an error."
        }
      });
    }
  };

  // Check player's access to lobby after the variables are loaded in
  useEffect(() => {
    if (lobbyId && loggedInUser) {
      checkAccess();
    }
  }, [lobbyId, loggedInUser]);

  return loading && lobbyState ? (
    <GameLoading />
  ) : (
    <GameLobby
      lobbyId={lobbyId}
      lobbySettings={gameSettings}
      lobbyUsers={users}
      lobbyChat={gameChat}
    />
  );
};

export default QuizHandler;
