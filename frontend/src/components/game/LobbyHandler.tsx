import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { RootState } from "../../redux/store";
import GameLoading from "./gamelobby/GameLoading";
import GameLobby from "./gamelobby/GameLobby";
import QuizDisplay from "./quiz/QuizDisplay";
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

/*
interface LobbyDetails {
  lobbyId: string;
  players: string[];
  gameType: "solo-classic" | "solo-knowledge";
  status: "waiting" | "in-progress" | "finished";
  gameSettings: GameSetting;
  chatMessages: { sender: string; message: string; timestamp: Date }[];
}
*/

interface ClassicQuestion {
  question: string;
  options: string[];
  correctOption: number;
  difficulty: number;
  category: string;
}

interface KnowledgeQuestion {
  question: string;
  answer: string;
}

interface GameState {
  currentQuestion: number;
  question: ClassicQuestion | KnowledgeQuestion;
  lastUpdate: Date;
}

const socket = io(import.meta.env.VITE_API_URL);

const LobbyHandler: React.FC = () => {
  // Loading state
  const [loading, setLoading] = useState<boolean>(true);
  // const [lobbyState, setLobbyState] = useState<LobbyDetails>(null);

  // Details needed for lobby display
  const [users, setUsers] = useState<string[]>(null);
  const [gameType, setGameType] = useState<string>("");
  const [gameSettings, setGameSettings] = useState<GameSetting>(null);
  const [gameChat, setGameChat] = useState<ChatMessage[]>(null);

  // Details needed for quiz display
  const [gameState, setGameState] = useState<GameState>(null);
  const [status, setStatus] = useState<string>("");

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

    socket.on("updateState", (data) => {
      setGameState(data.gameState);
    });

    socket.on("updateStatus", (data) => {
      setStatus(data.status);
    });

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
        // setLobbyState(lobbyDetails);

        setStatus(lobbyDetails.status);
        setUsers(lobbyDetails.players);

        setGameType(lobbyDetails.gameType);
        setGameSettings(lobbyDetails.gameSettings);
        setGameState(lobbyDetails.gameState);
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

  return loading ? (
    <GameLoading />
  ) : status === "waiting" ? (
    <GameLobby
      lobbyId={lobbyId}
      lobbySettings={gameSettings}
      lobbyUsers={users}
      lobbyChat={gameChat}
      socket={socket}
    />
  ) : (
    <QuizDisplay
      lobbyId={lobbyId}
      lobbyChat={gameChat}
      gameType={gameType}
      gameState={gameState}
      timeLimit={gameSettings.timePerQuestion}
    />
  );
};

export default LobbyHandler;
