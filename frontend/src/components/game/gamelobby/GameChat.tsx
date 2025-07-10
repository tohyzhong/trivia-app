import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { playClickSound } from "../../../utils/soundManager";
import ErrorPopup from "../../authentication/subcomponents/ErrorPopup";
import { motion, AnimatePresence } from "framer-motion";
import defaultAvatar from "../../../assets/default-avatar.jpg";
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
    const matches = matcher.getAllMatches(message);
    return censor.applyTo(message, matches);
  }

  const { lobbyId, chatMessages, playerStates, gameType, profilePictures } =
    props;
  const [chatInput, setChatInput] = useState<string>("");
  const loggedInUser = useSelector((state: RootState) => state.user.username);
  const [errorPopupMessage, setErrorPopupMessage] = React.useState("");
  const [isSuccess, setIsSuccess] = useState(false);

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
        setIsSuccess(false);
        setErrorPopupMessage(
          `Error sending chat message: ${String(data.message)}`
        );
      }
    } catch (error) {
      console.error("Error sending chat message:", error);
      setIsSuccess(false);
      setErrorPopupMessage(`Error sending chat message: ${String(error)}`);
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

  const handleReport = async (usernameToReport: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            reported: usernameToReport,
            source: "lobby",
            lobbyId
          })
        }
      );

      const data = await response.json();
      if (response.ok) {
        setIsSuccess(true);
        setErrorPopupMessage("User reported successfully.");
      } else {
        setIsSuccess(false);
        setErrorPopupMessage("Failed to report user: " + data.message);
      }
    } catch (err) {
      console.error("Error reporting user:", err);
      setIsSuccess(false);
      setErrorPopupMessage("Error reporting user:" + String(err));
    }
  };

  return (
    <div className="stats-chat-container">
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
                            style={{ cursor: "pointer" }}
                          >
                            ❗
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
        {errorPopupMessage !== "" && (
          <ErrorPopup
            message={errorPopupMessage}
            setMessage={setErrorPopupMessage}
            success={isSuccess}
          />
        )}
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
