import { describe, it, vi, expect, beforeEach } from "vitest";
import { screen, render, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import FriendsList from "../../src/components/profilepage/FriendsList.tsx";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import store from "../../src/redux/store.tsx";
import { setUser } from "../../src/redux/userSlice.tsx";
import React from "react";

import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

global.fetch = vi.fn();

Object.defineProperty(Element.prototype, "innerText", {
  set(value) {
    this.textContent = value;
  }
});

function renderWithRoute(path) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/profile/:username/friends" element={<FriendsList />} />
          <Route path="/noaccess" element={<div>No Access</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe("FriendsList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(
      setUser({
        username: "testuser",
        email: "test@test.com",
        verified: true,
        chatBan: false,
        gameBan: false,
        role: "user"
      })
    );

    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      value: 400
    });

    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 400
    });

    global.ResizeObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    };
  });

  it("calls fetch API on mount", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ mutual: [], incoming: [] })
    });

    renderWithRoute("/profile/testuser/friends");

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/friends/testuser"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ mutual: true, incoming: true }),
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        })
      );
    });
  });

  it("toggles section visibility when button is clicked", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          mutual: [{ username: "friend1", profilePicture: "" }],
          incoming: [{ username: "friend2", profilePicture: "" }]
        })
    });

    renderWithRoute("/profile/testuser/friends");

    await waitFor(() => {
      expect(screen.getByText("friend1")).toBeInTheDocument();
    });

    const toggleBtn = screen.getByText(/Incoming Friend Requests/i);
    fireEvent.click(toggleBtn);

    expect(screen.queryByText("friend1")).not.toBeInTheDocument();
    expect(screen.queryByText("friend2")).toBeInTheDocument();
  });

  it("does not show Remove Friend on other user's profile", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          mutual: [{ username: "friend1", profilePicture: "" }],
          incoming: []
        })
    });

    renderWithRoute("/profile/otheruser/friends");

    await waitFor(() => {
      expect(screen.getByText("friend1")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Remove Friend/i)).not.toBeInTheDocument();
  });

  it("accepts a friend request and moves user to mutual list", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          mutual: [],
          incoming: [{ username: "incoming1", profilePicture: "" }]
        })
    });

    fetch.mockResolvedValueOnce({ ok: true }); // accept call
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          mutual: [{ username: "incoming1", profilePicture: "" }],
          incoming: []
        })
    });

    renderWithRoute("/profile/testuser/friends");

    await waitFor(() => {
      expect(screen.getByText(/Incoming Friend Requests/i)).toBeInTheDocument();
    });

    const toggleBtn = screen.getByText(/Incoming Friend Requests/i);
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(screen.getByText("Accept")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Accept"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/friends/testuser/add"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            friendUsername: "incoming1"
          }),
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        })
      );
    });

    // go back
    await waitFor(() => {
      expect(screen.getByText(/Back to Friends List/i)).toBeInTheDocument();
    });

    expect(screen.queryByText("incoming1")).not.toBeInTheDocument();
    expect(screen.queryByText("Accept")).not.toBeInTheDocument();
    expect(screen.queryByText("Decline")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/Back to Friends List/i));

    await waitFor(() => {
      expect(screen.getByText("incoming1")).toBeInTheDocument();
    });
  });

  it("removes a friend and they disappear from mutual list", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          mutual: [{ username: "friend1", profilePicture: "" }],
          incoming: []
        })
    });

    fetch.mockResolvedValueOnce({ ok: true }); // remove call
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ mutual: [], incoming: [] })
    });

    renderWithRoute("/profile/testuser/friends");

    await waitFor(() => {
      expect(screen.getByText("friend1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Remove Friend"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/friends/testuser/remove"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            friendUsername: "friend1"
          }),
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        })
      );
    });

    await waitFor(() => {
      expect(screen.queryByText("friend1")).not.toBeInTheDocument();
    });
  });

  it("rejects a friend request and removes them from incoming list", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          mutual: [],
          incoming: [{ username: "incoming1", profilePicture: "" }]
        })
    });

    fetch.mockResolvedValueOnce({ ok: true }); // reject call
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ mutual: [], incoming: [] })
    });

    renderWithRoute("/profile/testuser/friends");

    await waitFor(() => {
      expect(screen.getByText(/Incoming Friend Requests/i)).toBeInTheDocument();
    });

    const toggleBtn = screen.getByText(/Incoming Friend Requests/i);
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(screen.getByText("Decline")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Decline"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/friends/testuser/remove"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            friendUsername: "incoming1"
          }),
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        })
      );
    });

    expect(screen.queryByText("incoming1")).not.toBeInTheDocument();
  });
});
