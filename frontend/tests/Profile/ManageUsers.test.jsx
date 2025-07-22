import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ManageUsers from "../../src/components/profilepage/ManageUser.tsx";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import store from "../../src/redux/store";
import { setUser } from "../../src/redux/userSlice";
import { setError } from "../../src/redux/errorSlice";
import React from "react";
import { expect, vi } from "vitest";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../src/redux/errorSlice", async () => {
  const actual = await vi.importActual("../../src/redux/errorSlice");
  return {
    ...actual,
    setError: vi.fn((payload) => ({ type: "error/setError", payload }))
  };
});

// User being managed
const mockProfileData = {
  username: "testuser",
  email: "test@example.com",
  role: "user",
  verified: true,
  chatBan: false,
  gameBan: false
};

function renderWithRoute(path) {
  window.history.pushState({}, "", path);
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/manage/:username" element={<ManageUsers />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe("ManageUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProfileData)
      })
    );
  });

  describe("role-based rendering", () => {
    it("superadmin sees promote for User + chat/game ban", async () => {
      store.dispatch(
        setUser({
          username: "adminboss",
          email: "admin@site.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "superadmin"
        })
      );

      renderWithRoute("/manage/testuser");

      await waitFor(() => {
        expect(screen.getByText("Promote to Admin")).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText(/Enter a reason for chat/i)
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText(/Enter a reason for game/i)
        ).toBeInTheDocument();
      });
    });

    it("superadmin sees promote/demote for Admin + chat/game ban", async () => {
      store.dispatch(
        setUser({
          username: "adminboss",
          email: "admin@site.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "superadmin"
        })
      );

      const adminProfile = {
        ...mockProfileData,
        role: "admin"
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(adminProfile)
        })
      );

      renderWithRoute("/manage/testuser");

      await waitFor(() => {
        expect(screen.getByText("Promote to Superadmin")).toBeInTheDocument();
        expect(screen.getByText("Demote to User")).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText(/Enter a reason for chat/i)
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText(/Enter a reason for game/i)
        ).toBeInTheDocument();
      });
    });

    it("admin only sees promote option for user + chat/game ban", async () => {
      store.dispatch(
        setUser({
          username: "admin1",
          email: "admin@site.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "admin"
        })
      );

      renderWithRoute("/manage/testuser");

      await waitFor(() => {
        expect(screen.getByText("Promote to Admin")).toBeInTheDocument();
        expect(
          screen.queryByText("Promote to Superadmin")
        ).not.toBeInTheDocument();
        expect(screen.queryByText("Demote to User")).not.toBeInTheDocument();
        expect(
          screen.getByPlaceholderText(/Enter a reason for chat/i)
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText(/Enter a reason for game/i)
        ).toBeInTheDocument();
      });
    });

    it("admin sees no promote/demote for admin + no chat/game ban", async () => {
      store.dispatch(
        setUser({
          username: "adminboss",
          email: "admin@site.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "admin"
        })
      );

      const adminProfile = {
        ...mockProfileData,
        role: "admin"
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(adminProfile)
        })
      );

      renderWithRoute("/manage/testuser");

      await waitFor(() => {
        expect(
          screen.queryByText("Promote to Superadmin")
        ).not.toBeInTheDocument();
        expect(screen.queryByText("Demote to User")).not.toBeInTheDocument();
        expect(
          screen.queryByPlaceholderText(/Enter a reason for chat/i)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByPlaceholderText(/Enter a reason for game/i)
        ).not.toBeInTheDocument();
      });
    });

    it("admin sees no promote/demote for superadmin + no chat/game ban", async () => {
      store.dispatch(
        setUser({
          username: "adminboss",
          email: "admin@site.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "admin"
        })
      );

      const adminProfile = {
        ...mockProfileData,
        role: "superadmin"
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(adminProfile)
        })
      );

      renderWithRoute("/manage/testuser");

      await waitFor(() => {
        expect(screen.queryByText("Demote to Admin")).not.toBeInTheDocument();
        expect(screen.queryByText("Demote to User")).not.toBeInTheDocument();
        expect(
          screen.queryByPlaceholderText(/Enter a reason for chat/i)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByPlaceholderText(/Enter a reason for game/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("API actions", () => {
    it("calls correct API to promote user", async () => {
      store.dispatch(
        setUser({
          username: "admin1",
          email: "admin@site.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "admin"
        })
      );

      renderWithRoute("/manage/testuser");

      const btn = await screen.findByText("Promote to Admin");
      fireEvent.click(btn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/profile/updaterole/testuser"),
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ role: "admin" }),
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            },
            method: "PUT"
          })
        );
      });
    });

    it("calls correct API to promote admin", async () => {
      store.dispatch(
        setUser({
          username: "admin1",
          email: "admin@site.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "superadmin"
        })
      );

      const adminProfile = {
        ...mockProfileData,
        role: "admin"
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(adminProfile)
        })
      );

      renderWithRoute("/manage/testuser");

      const btn = await screen.findByText("Promote to Superadmin");
      fireEvent.click(btn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/profile/updaterole/testuser"),
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ role: "superadmin" }),
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            },
            method: "PUT"
          })
        );
      });
    });

    it("calls correct API to demote superadmin", async () => {
      store.dispatch(
        setUser({
          username: "admin1",
          email: "admin@site.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "superadmin"
        })
      );

      const adminProfile = {
        ...mockProfileData,
        role: "superadmin"
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(adminProfile)
        })
      );

      renderWithRoute("/manage/testuser");

      const btn = await screen.findByText("Demote to Admin");
      fireEvent.click(btn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/profile/updaterole/testuser"),
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ role: "admin" }),
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            },
            method: "PUT"
          })
        );
      });
    });

    it("calls correct API to demote admin", async () => {
      store.dispatch(
        setUser({
          username: "admin1",
          email: "admin@site.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "superadmin"
        })
      );

      const adminProfile = {
        ...mockProfileData,
        role: "admin"
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(adminProfile)
        })
      );

      renderWithRoute("/manage/testuser");

      const btn = await screen.findByText("Demote to User");
      fireEvent.click(btn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/profile/updaterole/testuser"),
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ role: "user" }),
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            },
            method: "PUT"
          })
        );
      });
    });

    it("admin chat bans user", async () => {
      store.dispatch(
        setUser({
          username: "admin1",
          email: "admin@site.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "admin"
        })
      );

      const adminProfile = {
        ...mockProfileData,
        role: "user"
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(adminProfile)
        })
      );

      renderWithRoute("/manage/testuser");

      const input = await screen.findByPlaceholderText(
        /Enter a reason for chat/i
      );
      fireEvent.change(input, { target: { value: "Spamming" } });

      const banBtn = screen.getByText(/Chat Ban/);
      fireEvent.click(banBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/profile/chatban"),
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              bannedUser: "testuser",
              reason: "Spamming",
              unban: false
            }),
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            }
          })
        );
      });
    });

    it("superadmin chat ban admin", async () => {
      store.dispatch(
        setUser({
          username: "admin1",
          email: "admin@site.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "superadmin"
        })
      );

      const adminProfile = {
        ...mockProfileData,
        role: "admin"
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(adminProfile)
        })
      );

      renderWithRoute("/manage/testuser");

      const input = await screen.findByPlaceholderText(
        /Enter a reason for chat/i
      );
      fireEvent.change(input, { target: { value: "Spamming" } });

      const banBtn = screen.getByText(/Chat Ban/);
      fireEvent.click(banBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/profile/chatban"),
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              bannedUser: "testuser",
              reason: "Spamming",
              unban: false
            }),
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            }
          })
        );
      });
    });

    it("superadmin chat ban superadmin", async () => {
      store.dispatch(
        setUser({
          username: "admin1",
          email: "admin@site.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "superadmin"
        })
      );

      const adminProfile = {
        ...mockProfileData,
        role: "superadmin"
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(adminProfile)
        })
      );

      renderWithRoute("/manage/testuser");

      const input = await screen.findByPlaceholderText(
        /Enter a reason for chat/i
      );
      fireEvent.change(input, { target: { value: "Spamming" } });

      const banBtn = screen.getByText(/Chat Ban/);
      fireEvent.click(banBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/profile/chatban"),
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              bannedUser: "testuser",
              reason: "Spamming",
              unban: false
            }),
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            }
          })
        );
      });
    });

    // GAME BAN

    it("admin game bans user", async () => {
      store.dispatch(
        setUser({
          username: "admin1",
          email: "admin@site.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "admin"
        })
      );

      const adminProfile = {
        ...mockProfileData,
        role: "user"
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(adminProfile)
        })
      );

      renderWithRoute("/manage/testuser");

      const input = await screen.findByPlaceholderText(
        /Enter a reason for game/i
      );
      fireEvent.change(input, { target: { value: "Cheating" } });

      const banBtn = screen.getByText(/Game Ban/);
      fireEvent.click(banBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/profile/ban"),
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              bannedUser: "testuser",
              reason: "Cheating",
              unban: false
            }),
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            }
          })
        );
      });
    });

    it("superadmin game ban admin", async () => {
      store.dispatch(
        setUser({
          username: "admin1",
          email: "admin@site.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "superadmin"
        })
      );

      const adminProfile = {
        ...mockProfileData,
        role: "admin"
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(adminProfile)
        })
      );

      renderWithRoute("/manage/testuser");

      const input = await screen.findByPlaceholderText(
        /Enter a reason for game/i
      );
      fireEvent.change(input, { target: { value: "Cheating" } });

      const banBtn = screen.getByText(/Game Ban/);
      fireEvent.click(banBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/profile/ban"),
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              bannedUser: "testuser",
              reason: "Cheating",
              unban: false
            }),
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            }
          })
        );
      });
    });

    it("superadmin game ban superadmin", async () => {
      store.dispatch(
        setUser({
          username: "admin1",
          email: "admin@site.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "superadmin"
        })
      );

      const adminProfile = {
        ...mockProfileData,
        role: "superadmin"
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(adminProfile)
        })
      );

      renderWithRoute("/manage/testuser");

      const input = await screen.findByPlaceholderText(
        /Enter a reason for game/i
      );
      fireEvent.change(input, { target: { value: "Cheating" } });

      const banBtn = screen.getByText(/Game Ban/);
      fireEvent.click(banBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/profile/ban"),
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              bannedUser: "testuser",
              reason: "Cheating",
              unban: false
            }),
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            }
          })
        );
      });
    });
  });

  // UNAUTHORISED ACCESS REROUTING

  describe("unauthorized logic", () => {
    it("redirects if user has no permission", async () => {
      store.dispatch(
        setUser({
          username: "lowuser",
          email: "user@site.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "user"
        })
      );

      renderWithRoute("/manage/testuser");

      await waitFor(() => {
        expect(setError).toHaveBeenCalledWith({
          errorMessage: "Unauthorised attempt.",
          success: false
        });
        expect(mockNavigate).toHaveBeenCalledWith("/profile/testuser");
      });
    });

    it("redirects if managing own account", async () => {
      store.dispatch(
        setUser({
          username: "testuser",
          email: "test@example.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "admin"
        })
      );

      renderWithRoute("/manage/testuser");

      await waitFor(() => {
        expect(setError).toHaveBeenCalledWith({
          errorMessage: "You cannot manage your own account's status",
          success: false
        });
        expect(mockNavigate).toHaveBeenCalledWith("/profile/testuser");
      });
    });
  });
});
