import React from "react";
import { createContext, useContext } from "react";
import socket from "../socket";
import PropTypes from "prop-types";

const SocketContext = createContext<typeof socket | null>(null);

export const SocketProvider = ({ children }) => (
  <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
);
SocketProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useSocket = () => useContext(SocketContext);
