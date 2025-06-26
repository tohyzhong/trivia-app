import React from "react";
import { createContext, useContext } from "react";
import socket from "../socket";

const SocketContext = createContext<typeof socket | null>(null);

export const SocketProvider = ({ children }) => (
  <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
);

export const useSocket = () => useContext(SocketContext);
