import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, beforeEach, expect } from "vitest";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Profile from "../../src/components/profilepage/Profile.tsx";
import { Provider } from "react-redux";
import store from "../../src/redux/store";
import { setUser } from "../../src/redux/userSlice";
import { setError } from "../../src/redux/errorSlice";

vi.mock("../../src/redux/errorSlice", async () => {
  const actual = await vi.importActual("../../src/redux/errorSlice");
  return {
    ...actual,
    setError: vi.fn((payload) => ({ type: "error/setError", payload }))
  };
});

const mockProfileData = {
  username: "testuser",
  currency: 100,
  profilePicture: "avatar.jpg",
  role: "user",
  gameBan: false,
  chatBan: false,
  friends: [{ username: "friend1", profilePicture: "f1.jpg" }],
  addedFriend: false,
  receivedFriendRequest: false,
  classicStats: {
    score: 50,
    winRate: 0.5,
    wonMatches: 10,
    totalMatches: 20,
    correctRate: 0.8,
    correctAnswer: 16,
    totalAnswer: 20
  },
  knowledgeStats: {
    score: 60,
    winRate: 0.6,
    wonMatches: 12,
    totalMatches: 20,
    correctRate: 0.75,
    correctAnswer: 15,
    totalAnswer: 20
  }
};

const renderWithRoute = (path) => {
  window.history.pushState({}, "Profile Test", path);
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = vi.fn();
});

describe("Profile component", () => {
  describe("Viewing own profile", () => {
    it("renders profile without manage button", async () => {
      store.dispatch(
        setUser({
          username: "testuser",
          email: "testuser@example.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "user"
        })
      );

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfileData)
      });

      renderWithRoute("/profile");

      await waitFor(() => {
        expect(screen.getByText("testuser's Profile")).toBeInTheDocument();
      });

      expect(screen.queryByText("Manage User")).not.toBeInTheDocument();
    });
  });

  describe("Admin viewing a user profile", () => {
    beforeEach(() => {
      store.dispatch(
        setUser({
          username: "adminUser",
          email: "adminUser@example.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "admin"
        })
      );
    });

    it("renders manage button", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfileData)
      });

      renderWithRoute("/profile/testuser");

      await waitFor(() => {
        expect(screen.getByText("testuser's Profile")).toBeInTheDocument();
      });

      expect(screen.getByText("Manage User")).toBeInTheDocument();
      expect(screen.queryByText("Report Username")).not.toBeInTheDocument();
    });
  });

  describe("Admin viewing an admin/superadmin profile", () => {
    beforeEach(() => {
      store.dispatch(
        setUser({
          username: "adminUser",
          email: "adminUser@example.com",
          verified: true,
          chatBan: false,
          gameBan: false,
          role: "admin"
        })
      );
    });

    it("renders report button only (admin)", async () => {
      const adminProfile = {
        ...mockProfileData,
        role: "admin",
        username: "admin2"
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(adminProfile)
      });

      renderWithRoute("/profile/admin2");

      await waitFor(() => {
        expect(screen.getByText("admin2's Profile")).toBeInTheDocument();
      });

      expect(screen.getByText("Report Username")).toBeInTheDocument();
      expect(screen.queryByText("Manage User")).not.toBeInTheDocument();
    });

    it("renders report button only (superadmin)", async () => {
      const adminProfile = {
        ...mockProfileData,
        role: "superadmin",
        username: "admin2"
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(adminProfile)
      });

      renderWithRoute("/profile/admin2");

      await waitFor(() => {
        expect(screen.getByText("admin2's Profile")).toBeInTheDocument();
      });

      expect(screen.getByText("Report Username")).toBeInTheDocument();
      expect(screen.queryByText("Manage User")).not.toBeInTheDocument();
    });
  });

  describe("Superadmin viewing any profile", () => {
    beforeEach(() => {
      store.dispatch({
        type: "user/setUser",
        payload: { username: "superadminUser", role: "superadmin" }
      });
    });

    it("renders manage button (user)", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfileData)
      });

      renderWithRoute("/profile/testuser");

      await waitFor(() => {
        expect(screen.getByText("testuser's Profile")).toBeInTheDocument();
      });

      expect(screen.getByText("Manage User")).toBeInTheDocument();
    });

    it("renders manage button (admin)", async () => {
      const adminProfile = {
        ...mockProfileData,
        role: "admin",
        username: "testadmin"
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(adminProfile)
      });

      renderWithRoute("/profile/testadmin");

      await waitFor(() => {
        expect(screen.getByText("testadmin's Profile")).toBeInTheDocument();
      });

      expect(screen.getByText("Manage User")).toBeInTheDocument();
    });

    it("renders manage button (superadmin)", async () => {
      const adminProfile = {
        ...mockProfileData,
        role: "superadmin",
        username: "testsuperadmin"
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(adminProfile)
      });

      renderWithRoute("/profile/testsuperadmin");

      await waitFor(() => {
        expect(
          screen.getByText("testsuperadmin's Profile")
        ).toBeInTheDocument();
      });

      expect(screen.getByText("Manage User")).toBeInTheDocument();
    });
  });

  describe("Friend actions", () => {
    beforeEach(() => {
      store.dispatch({
        type: "user/setUser",
        payload: { username: "currentUser", role: "user" }
      });
    });

    it("calls remove API on clicking Remove Friend button when friends", async () => {
      const testProfile = {
        ...mockProfileData,
        username: "userA",
        friends: [{ username: "currentUser", profilePicture: "pic.jpg" }],
        addedFriend: false,
        receivedFriendRequest: false
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(testProfile)
      });

      renderWithRoute("/profile/userA");
      await waitFor(() =>
        expect(screen.getByText("userA's Profile")).toBeInTheDocument()
      );

      const removeBtn = screen.getByText("Remove Friend");
      fireEvent.click(removeBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/friends/currentUser/remove"),
          expect.objectContaining({
            method: "PUT",
            body: JSON.stringify({ friendUsername: "userA" })
          })
        );
      });
    });

    it("calls add API on clicking Confirm Friend Request button", async () => {
      const testProfile = {
        ...mockProfileData,
        username: "userB",
        friends: [],
        addedFriend: false,
        receivedFriendRequest: true
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(testProfile)
      });

      renderWithRoute("/profile/userB");
      await waitFor(() =>
        expect(screen.getByText("userB's Profile")).toBeInTheDocument()
      );

      const confirmBtn = screen.getByText("Confirm Friend Request");
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/friends/currentUser/add"),
          expect.objectContaining({
            method: "PUT",
            body: JSON.stringify({ friendUsername: "userB" })
          })
        );
      });
    });

    it("calls add API on clicking Add Friend button", async () => {
      const testProfile = {
        ...mockProfileData,
        username: "userC",
        friends: [],
        addedFriend: false,
        receivedFriendRequest: false
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(testProfile)
      });

      renderWithRoute("/profile/userC");
      await waitFor(() =>
        expect(screen.getByText("userC's Profile")).toBeInTheDocument()
      );

      const addBtn = screen.getByText("Add Friend");
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/friends/currentUser/add"),
          expect.objectContaining({
            method: "PUT",
            body: JSON.stringify({ friendUsername: "userC" })
          })
        );
      });
    });

    it("calls remove API on clicking Delete Friend Request button", async () => {
      const testProfile = {
        ...mockProfileData,
        username: "userD",
        friends: [],
        addedFriend: true,
        receivedFriendRequest: false
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(testProfile)
      });

      renderWithRoute("/profile/userD");
      await waitFor(() =>
        expect(screen.getByText("userD's Profile")).toBeInTheDocument()
      );

      const deleteRequestBtn = screen.getByText("Delete Friend Request");
      fireEvent.click(deleteRequestBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/friends/currentUser/remove"),
          expect.objectContaining({
            method: "PUT",
            body: JSON.stringify({ friendUsername: "userD" })
          })
        );
      });
    });
  });

  describe("Report user flow", () => {
    beforeEach(() => {
      store.dispatch({
        type: "user/setUser",
        payload: { username: "someUser", role: "user" }
      });
    });

    it("dispatches setError on success", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProfileData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: "Reported" })
        });

      renderWithRoute("/profile/testuser");

      await waitFor(() => {
        expect(screen.getByText("testuser's Profile")).toBeInTheDocument();
      });

      const reportBtn = screen.getByText("Report Username");
      fireEvent.click(reportBtn);

      await waitFor(() => {
        expect(setError).toHaveBeenCalledWith(
          expect.objectContaining({
            errorMessage: "User reported successfully.",
            success: true
          })
        );
      });
    });

    it("dispatches setError on failure", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProfileData)
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () =>
            Promise.resolve({ message: "Random backend junk message error" })
        });

      renderWithRoute("/profile/testuser");

      await waitFor(() => {
        expect(screen.getByText("testuser's Profile")).toBeInTheDocument();
      });

      const reportBtn = screen.getByText("Report Username");
      fireEvent.click(reportBtn);

      await waitFor(() => {
        expect(setError).toHaveBeenCalledWith(
          expect.objectContaining({
            errorMessage: expect.stringContaining("Failed to report user"),
            success: false
          })
        );
      });
    });
  });
});
