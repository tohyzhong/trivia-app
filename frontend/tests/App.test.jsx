import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import App from "../src/App.tsx";
import store from "../src/redux/store";
import { setUser } from "../src/redux/userSlice";
import React from "react";

vi.mock("../src/hooks/useAuth", () => ({
  default: () => true
}));
vi.mock("../src/hooks/useLobbySocketRedirect", () => ({
  useLobbySocketRedirect: () => {}
}));
vi.mock("../src/components/navigationbar/NavigationBar", () => ({
  default: () => <div>MockNav</div>
}));
vi.mock("../src/components/game/GameRoutes", () => ({
  default: () => <div>Game Page</div>
}));
vi.mock("../src/components/profilepage/ProfileRoutes", () => ({
  default: () => <div>Profile Page</div>
}));
vi.mock("../src/components/settingspage/SettingsRoutes", () => ({
  default: () => <div>Profile Settings</div>
}));
vi.mock("../src/components/authentication/Authentication", () => ({
  default: () => <div>Auth Page</div>
}));
vi.mock("../src/components/noaccess/NoAccess", () => ({
  default: () => <div>No Access</div>
}));

function renderWithRoute(path) {
  window.history.pushState({}, "", path);
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe("App.tsx Route Protections", () => {
  describe("Verified Users", () => {
    beforeEach(() => {
      store.dispatch(
        setUser({
          username: "verifiedUser",
          email: "verified@email.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "user"
        })
      );
    });

    it("can access /play/*", async () => {
      renderWithRoute("/play/game123");
      await waitFor(() => {
        expect(screen.getByText("Game Page")).toBeInTheDocument();
      });
    });

    it("can access /profile/*", async () => {
      renderWithRoute("/profile/test");
      await waitFor(() => {
        expect(screen.getByText("Profile Page")).toBeInTheDocument();
      });
    });

    it("can access /settings/*", async () => {
      renderWithRoute("/settings");
      await waitFor(() => {
        expect(screen.getByText("Profile Settings")).toBeInTheDocument();
      });
    });
  });

  describe("Unverified Users", () => {
    beforeEach(() => {
      store.dispatch(
        setUser({
          username: "unverifiedUser",
          email: "unverified@email.com",
          verified: false,
          chatBan: false,
          gameBan: false,
          role: "user"
        })
      );
    });

    it("are redirected from /play/* to /settings", async () => {
      renderWithRoute("/play/game456");
      await waitFor(() => {
        expect(screen.getByText("Profile Settings")).toBeInTheDocument();
      });
    });

    it("are redirected from /profile/* to /settings", async () => {
      renderWithRoute("/profile/test");
      await waitFor(() => {
        expect(screen.getByText("Profile Settings")).toBeInTheDocument();
      });
    });

    it("can access /settings/*", async () => {
      renderWithRoute("/settings");
      await waitFor(() => {
        expect(screen.getByText("Profile Settings")).toBeInTheDocument();
      });
    });
  });

  describe("Banned Users", () => {
    beforeEach(() => {
      store.dispatch(
        setUser({
          username: "bannedUser",
          email: "banned@email.com",
          verified: true,
          chatBan: false,
          gameBan: true,
          role: "user"
        })
      );
    });

    it("are redirected from /play/* to /settings", async () => {
      renderWithRoute("/play");
      await waitFor(() => {
        expect(screen.getByText("Profile Settings")).toBeInTheDocument();
      });
    });

    it("are redirected from /profile/* to /settings", async () => {
      renderWithRoute("/profile/banneduser");
      await waitFor(() => {
        expect(screen.getByText("Profile Settings")).toBeInTheDocument();
      });
    });

    it("can access /settings/*", async () => {
      renderWithRoute("/settings");
      await waitFor(() => {
        expect(screen.getByText("Profile Settings")).toBeInTheDocument();
      });
    });
  });

  describe("Not Logged In Users", () => {
    beforeEach(() => {
      store.dispatch(
        setUser({
          username: undefined,
          email: undefined,
          verified: undefined,
          chatBan: undefined,
          gameBan: undefined,
          role: undefined
        })
      );
    });

    it("are redirected from /play/* to login", async () => {
      renderWithRoute("/play/somegame");
      await waitFor(() => {
        expect(screen.getByText("Auth Page")).toBeInTheDocument();
      });
    });

    it("are redirected from /profile/* to login", async () => {
      renderWithRoute("/profile/test");
      await waitFor(() => {
        expect(screen.getByText("Auth Page")).toBeInTheDocument();
      });
    });

    it("are redirected from /settings/* to login", async () => {
      renderWithRoute("/settings");
      await waitFor(() => {
        expect(screen.getByText("Auth Page")).toBeInTheDocument();
      });
    });
  });
});
