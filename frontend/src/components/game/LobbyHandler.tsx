import React, { useEffect, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { RootState } from "../../redux/store";
import GameLoading from "./gamelobby/GameLoading";
import GameLobby from "./gamelobby/GameLobby";
import QuizDisplay from "./quiz/QuizDisplay";
import {
  clearLobby,
  setCurrency,
  setStatusRedux
} from "../../redux/lobbySlice";
import { useSocket } from "../../context/SocketContext";

interface GameSetting {
  numQuestions: number;
  timePerQuestion: number;
  difficulty: number;
  categories: string[];
  name: string;
  publicVisible: boolean;
}

interface ChatMessage {
  sender: string;
  message: string;
}

interface ClassicQuestion {
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
  difficulty: number;
  category: string;
}

interface KnowledgeQuestion {
  question: string;
  correctOption: string;
  difficulty: number;
}

type QuizQuestion = ClassicQuestion | KnowledgeQuestion;

interface GameState {
  currentQuestion: number;
  questionIds: string[];
  question: QuizQuestion;
  playerStates: any;
  answerRevealed: boolean;
  lastUpdate: Date;
}

const LobbyHandler: React.FC = () => {
  // Loading state
  const [loading, setLoading] = useState<boolean>(true);
  const [joined, setJoined] = useState(false);
  const hasManuallyLeftRef = useRef(false);

  // Details needed for lobby display
  const [users, setUsers] = useState<{
    [key: string]: { [key: string]: boolean | string };
  }>(null);
  const [host, setHost] = useState<string>("");
  const [gameType, setGameType] = useState<string>("");
  const [gameSettings, setGameSettings] = useState<GameSetting>(null);
  const [gameChat, setGameChat] = useState<ChatMessage[]>(null);
  const [joinRequests, setJoinRequests] = useState<{
    [key: string]: { [key: string]: boolean | string };
  }>(null);

  // Details needed for quiz display
  const [gameState, setGameState] = useState<GameState>(null);
  const [timeNow, setTimeNow] = useState<Date>(null);
  const [status, setStatus] = useState<string>("");
  const [profilePictures, setProfilePictures] = useState<{
    [key: string]: string;
  }>(null);

  // Access check variables
  const { lobbyId } = useParams();
  const loggedInUser = useSelector((state: RootState) => state.user.username);

  // Socket management
  const socket = useSocket();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const disconnect = async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/lobby/disconnect/${lobbyId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ player: loggedInUser })
        }
      );
    } catch (error) {
      console.error(error);
      navigate("/", {
        state: {
          errorMessage:
            "There was an issue disconnecting you. A report has been sent to the admins"
        }
      });
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!hasManuallyLeftRef.current) {
        disconnect();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    socket.emit("joinLobby", lobbyId);

    socket.on("lobbyJoined", () => {
      setJoined(true);
    });

    socket.on("updateState", (data) => {
      if (data.gameState) setGameState(data.gameState);
      if (data.serverTimeNow) setTimeNow(data.serverTimeNow);
    });

    socket.on("updateStatus", (data) => {
      setStatus(data.status);
      dispatch(setStatusRedux(data.status));
    });

    socket.on("updateChat", (data) => {
      setGameChat(data.chatMessages);
    });

    socket.on("updateSettings", (data) => {
      setGameSettings(data.gameSettings);
    });

    socket.on("updateUsers", (data) => {
      setUsers(data.players);
      setHost(data.host);
      const pictures: { [username: string]: string } = {};
      Object.entries(data.players).forEach(
        ([username, player]: [string, any]) => {
          pictures[username] = player.profilePicture || "";
        }
      );
      setProfilePictures(pictures);
    });

    socket.on("updateKick", (data) => {
      if (loggedInUser === data) {
        dispatch(clearLobby());
        navigate("/play");
      }
    });

    socket.on("updateJoinRequests", (data) => {
      setJoinRequests(data);
    });

    socket.on("updateCurrency", (data) => {
      dispatch(setCurrency(data));
    });

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      socket.emit("leaveLobby", lobbyId);
      socket.off("lobbyJoined");
      socket.off("updateState");
      socket.off("updateStatus");
      socket.off("updateSettings");
      socket.off("updateChat");
      socket.off("updateUsers");
      socket.off("updateKick");
      socket.off("updateJoinRequests");
      socket.off("updateCurrency");
    };
  }, []);

  // Handle access check and connection to lobby
  const checkAccess = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/lobby/connect/${lobbyId}`,
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

        setStatus(lobbyDetails.status);
        dispatch(setStatusRedux(lobbyDetails.status));
        setUsers(lobbyDetails.players);
        setJoinRequests(lobbyDetails.joinRequests);

        setGameType(lobbyDetails.gameType);
        setGameSettings(lobbyDetails.gameSettings);
        setGameState(lobbyDetails.gameState);
        setTimeNow(data.serverTimeNow);
        setGameChat(lobbyDetails.chatMessages);

        setLoading(false);
      } else {
        dispatch(clearLobby());
        navigate("/", { state: { errorMessage: data.message || "" } });
      }
    } catch (error) {
      console.error(error);
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

  return loading || !socket || !socket.connected || !joined ? (
    <GameLoading />
  ) : status === "waiting" ? (
    <GameLobby
      lobbyId={lobbyId}
      lobbySettings={gameSettings}
      lobbyUsers={users}
      joinRequests={joinRequests}
      lobbyChat={gameChat}
      gameType={gameType}
      profilePictures={profilePictures}
      handleLeave={() => {
        hasManuallyLeftRef.current = true;
        dispatch(clearLobby());
        navigate("/play", { state: { errorMessage: "You left the lobby." } });
      }}
      socket={socket}
      host={host}
    />
  ) : (
    <QuizDisplay
      lobbyId={lobbyId}
      lobbyChat={gameChat}
      gameType={gameType}
      gameState={gameState}
      serverTimeNow={timeNow}
      timeLimit={gameSettings.timePerQuestion}
      totalQuestions={gameSettings.numQuestions}
      profilePictures={profilePictures}
      handleLeave={() => {
        hasManuallyLeftRef.current = true;
        dispatch(clearLobby());
        navigate("/play", { state: { errorMessage: "You left the lobby." } });
      }}
      host={host}
    />
  );
};

export default LobbyHandler;
