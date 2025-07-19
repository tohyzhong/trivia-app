import React, { useEffect, useState } from "react";
import { createContext, useContext } from "react";
import socket from "../socket";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

const SocketContext = createContext<typeof socket | null>(null);

export const SocketProvider = ({ children }) => {
  const loggedInUser = useSelector((state: RootState) => state.user.username);
  const [ping, setPing] = useState(null);

  useEffect(() => {
    const start = Date.now();
    socket.emit("pingCheck", () => {
      const end = Date.now();
      setPing(end - start);
    });

    const interval = setInterval(() => {
      const start = Date.now();
      socket.emit("pingCheck", () => {
        const end = Date.now();
        setPing(end - start);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleForceDisconnect = (reason) => {
      socket.disconnect();
      setPing(9999);
      alert(`${reason}`);
      setTimeout(() => {
        window.close();
      }, 3000);
    };

    socket.on("forceDisconnect", handleForceDisconnect);
    return () => socket.off("forceDisconnect", handleForceDisconnect);
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
      {loggedInUser && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            padding: 8,
            zIndex: 999999,
            background: "#222",
            color: ping > 100 ? "#f00" : ping > 40 ? "#ffa500" : "#0f0"
          }}
        >
          Ping: {ping} ms
        </div>
      )}
    </SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useSocket = () => useContext(SocketContext);
