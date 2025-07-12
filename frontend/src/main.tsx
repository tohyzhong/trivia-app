import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./redux/store";
import App from "./App";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";

ModuleRegistry.registerModules([AllCommunityModule]);
const root = document.getElementById("root") as HTMLElement;
if (root !== null) {
  createRoot(root).render(
    // <StrictMode>
    <Provider store={store}>
      <SocketProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SocketProvider>
    </Provider>
    /* </StrictMode>, */
  );
}
