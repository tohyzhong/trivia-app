import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { playClickSound } from "../../../utils/soundManager";
import ErrorPopup from "../../authentication/subcomponents/ErrorPopup";

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
    };
  };
  gameType?: string;
}

const GameChat: React.FC<GameChatProps> = (props) => {
  const { lobbyId, chatMessages, playerStates, gameType } = props;
  const [chatInput, setChatInput] = useState<string>("");
  const loggedInUser = useSelector((state: RootState) => state.user.username);
  const [errorPopupMessage, setErrorPopupMessage] = React.useState("");

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
        setErrorPopupMessage(
          `Error sending chat message: ${String(data.message)}`
        );
      }
    } catch (error) {
      console.error("Error sending chat message:", error);
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

  return (
    <div className="stats-chat-container">
      {playerStates && (
        <div className="player-stats-container">
          {Object.entries(playerStates).map(([username, state]) => {
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
              <div key={username} className="player-stat-row">
                <span className="player-name">{username}</span>
                {gameType.includes("coop") ? (
                  <></>
                ) : (
                  <span className="player-score">{state.score ?? 0}</span>
                )}
                <div className="answer-dot-row">{last5}</div>
              </div>
            );
          })}
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
          />
        )}
        <div className="game-lobby-chat-messages" ref={chatContainerRef}>
          {chatMessages &&
            chatMessages.map((msg, index) => (
              <ul key={msg.sender + index} className="chat-container">
                <p className="chat-sender">{msg.sender}:&nbsp;</p>
                <p className="chat-content">{msg.message}</p>
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
