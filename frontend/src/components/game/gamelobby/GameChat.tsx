import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { playClickSound } from "../../../utils/soundManager";
import { motion, AnimatePresence } from "framer-motion";
import defaultAvatar from "../../../assets/default-avatar.jpg";
import { FaExclamation } from "react-icons/fa";
import { setError } from "../../../redux/errorSlice";
import ReportUser from "./ReportUser";
import {
  RegExpMatcher,
  TextCensor,
  asteriskCensorStrategy,
  englishDataset,
  englishRecommendedTransformers,
  keepStartCensorStrategy
} from "obscenity";

interface ChatMessage {
  sender: string;
  message: string;
}

interface GameChatProps {
  lobbyId: string;
  chatMessages: ChatMessage[];
  playerStates?: {
    [username: string]: {
      score: number;
      answerHistory: { [questionNum: number]: string };
      ready?: boolean;
    };
  };
  gameType?: string;
  profilePictures?: { [username: string]: string };
}

const GameChat: React.FC<GameChatProps> = (props) => {
  const isChatBanned = useSelector((state: RootState) => state.user.chatBan);
  const profanityEnabled = useSelector(
    (state: RootState) => state.soundSettings.profanityEnabled
  );
  const matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers
  });
  const censor = new TextCensor().setStrategy(
    keepStartCensorStrategy(asteriskCensorStrategy())
  );
  function getFilteredMessage(message: string, enabled: boolean): string {
    if (enabled) return message;

    const noSpacesMessage = message.split(" ").join("");
    const matches = matcher.getAllMatches(noSpacesMessage);
    let filteredMessage = censor.applyTo(noSpacesMessage, matches);

    // Build original message with spaces
    let finalMessage = "";
    let filterIndex = 0;
    for (let i = 0; i < message.length; i++) {
      if (message[i] === " ") {
        finalMessage += " ";
      } else {
        finalMessage += filteredMessage[filterIndex] || "";
        filterIndex++;
      }
    }

    return finalMessage;
  }

  const { lobbyId, chatMessages, playerStates, gameType, profilePictures } =
    props;
  const [chatInput, setChatInput] = useState<string>("");
  const loggedInUser = useSelector((state: RootState) => state.user.username);
  const dispatch = useDispatch();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(event.target.value);
  };

  const handleSend = async () => {
    playClickSound();
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/lobby/chat/${lobbyId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ player: loggedInUser, message: chatInput })
        }
      );
      if (response.ok) {
        setChatInput("");
      } else {
        const data = await response.json();
        console.error("Error sending chat message: ", data.message);
        dispatch(
          setError({ errorMessage: String(data.message), success: false })
        );
      }
    } catch (error) {
      console.error("Error sending chat message:", error);
      dispatch(setError({ errorMessage: String(error), success: false }));
    }
  };

  const handleKeyPress = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter" && chatInput.trim() !== "") {
      await handleSend();
    }
  };

  const chatContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // User report handlers
  const [reportPopupActive, setReportPopupActive] = useState(false);
  const [usernameToReport, setUsernameToReport] = useState("");
  const handleReport = async (username: string) => {
    setReportPopupActive(true);
    setUsernameToReport(username);
  };

  return (
    <div className="stats-chat-container">
      {reportPopupActive && (
        <ReportUser
          username={usernameToReport}
          setActive={setReportPopupActive}
          lobbyId={lobbyId}
        />
      )}

      {playerStates && (
        <div className="player-stats-container">
          <h3 className="stats-header">Score Summary</h3>
          <AnimatePresence mode="sync">
            {Object.entries(playerStates)
              .sort(([, a], [, b]) => (b.score ?? 0) - (a.score ?? 0))
              .map(([username, state]) => {
                const last5 = Object.keys(state?.answerHistory || {})
                  .sort((a, b) => parseInt(b) - parseInt(a))
                  .slice(0, 5)
                  .reverse()
                  .map((qNum) => {
                    const status = state.answerHistory[qNum];
                    let colorClass = "dot-grey";
                    if (status === "correct") colorClass = "dot-green";
                    else if (status === "wrong") colorClass = "dot-red";
                    return (
                      <div key={qNum} className={`answer-dot ${colorClass}`} />
                    );
                  });

                return (
                  <motion.div
                    layout
                    key={username}
                    className="player-stat-row"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="player-name-with-avatar">
                      <div className="avatar-wrapper">
                        <img
                          src={profilePictures[username] || defaultAvatar}
                          alt={username}
                          className={`player-avatar ${
                            playerStates?.[username]?.ready
                              ? "greyscale-avatar"
                              : ""
                          }`}
                        />
                        {playerStates?.[username]?.ready && (
                          <div className="ready-tick">✓</div>
                        )}
                      </div>

                      <span
                        className="player-name"
                        style={
                          username === loggedInUser
                            ? { color: "lightblue" }
                            : {}
                        }
                      >
                        {username}
                        {username !== loggedInUser && (
                          <span
                            className="report-button"
                            onClick={() => handleReport(username)}
                            title="Report User"
                            style={{ cursor: "pointer", marginLeft: "10px" }}
                          >
                            <FaExclamation
                              color="red"
                              style={{ verticalAlign: "middle" }}
                            />
                          </span>
                        )}
                      </span>
                    </div>
                    {!gameType?.includes("coop") && (
                      <span className="player-score">{state.score ?? 0}</span>
                    )}
                    <div className="answer-dot-row">{last5}</div>
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      )}

      <div
        className="game-lobby-chat-container"
        style={playerStates ? { height: "50%" } : { height: "100%" }}
      >
        <div className="game-lobby-chat-messages" ref={chatContainerRef}>
          {chatMessages &&
            chatMessages.map((msg, index) => (
              <ul key={msg.sender + index} className="chat-container">
                <p className="chat-sender">{msg.sender}:&nbsp;</p>
                <p className="chat-content">
                  {getFilteredMessage(msg.message, profanityEnabled)}
                </p>
              </ul>
            ))}
        </div>
        <div className="game-lobby-chat-entry">
          {isChatBanned && (
            <div className="disabled-overlay">
              <h3 className="disabled-text">You are currently chat banned.</h3>
            </div>
          )}
          <input
            type="text"
            className="chat-input"
            placeholder="Type your message here..."
            value={chatInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
          />
          <button className="chat-send-button" onClick={handleSend}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameChat;
