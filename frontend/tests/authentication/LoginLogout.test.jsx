import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { it, expect, describe, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import store from "../../src/redux/store";
import LoginPage from "../../src/components/authentication/subcomponents/LoginPage";
import LogoutButton from "../../src/components/navigationbar/LogoutButton.tsx";

const mockNavigate = vi.fn();
const mockDispatch = vi.fn((action) => store.dispatch(action));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

vi.mock("react-redux", async () => {
  const actual = await vi.importActual("react-redux");
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: actual.useSelector
  };
});

describe("LoginPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it("renders all required input fields and links", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Login/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Forgot Password/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Sign up here/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back/i })).toBeInTheDocument();
  });

  it("renders login_required error from query param", () => {
    const dispatchSpy = vi.spyOn(store, "dispatch");

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/auth/login?error=login_required"]}>
          <Routes>
            <Route path="/auth/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    expect(dispatchSpy).toHaveBeenCalledWith({
      type: "error/setError",
      payload: {
        errorMessage: "You must be logged in to view this page.",
        success: false
      }
    });
  });

  it("logs in successfully, sets redux and localStorage, and redirects", async () => {
    const mockUser = {
      username: "testuser",
      email: "test@gmail.com",
      verified: true,
      chatBan: false,
      gameBan: true,
      role: "admin"
    };

    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    delete window.location;
    window.location = { href: "" };

    render(
      <Provider store={store}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Username/i), {
      target: { value: "testuser" }
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: "Password123" }
    });

    fireEvent.click(screen.getByRole("button", { name: /Login/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/login"),
        expect.objectContaining({
          method: "POST",
          credentials: "include"
        })
      );

      // Check Redux
      const state = store.getState().user;
      expect(state).toEqual(expect.objectContaining(mockUser));

      // Check localStorage
      const savedUser = localStorage.getItem("user");
      expect(savedUser).not.toBeNull();
      expect(JSON.parse(savedUser)).toMatchObject(mockUser);

      // Check redirect
      expect(window.location.href).toBe("/");
    });

    vi.restoreAllMocks();
  });

  it("shows error when login fails", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "No User Found" })
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    render(
      <Provider store={store}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Username/i), {
      target: { value: "fakeUser" }
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: "Password123" }
    });

    fireEvent.click(screen.getByRole("button", { name: /Login/i }));

    const errorElement = await screen.findByText("No User Found");
    expect(errorElement).toBeInTheDocument();

    vi.restoreAllMocks();
  });
});

describe("LogoutButton", () => {
  beforeEach(() => {
    store.dispatch({
      type: "user/setUser",
      payload: {
        username: "testuser",
        email: "test@gmail.com",
        verified: true,
        chatBan: false,
        gameBan: false,
        isAuthenticated: true,
        role: "user"
      }
    });
    localStorage.setItem(
      "user",
      JSON.stringify({
        username: "testuser",
        email: "test@gmail.com",
        verified: true,
        chatBan: false,
        gameBan: false,
        isAuthenticated: true,
        role: "user"
      })
    );

    mockDispatch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("dispatches logout and clearLobby, and redirects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: "Logged out successfully" })
        })
      )
    );

    render(
      <Provider store={store}>
        <MemoryRouter>
          <LogoutButton />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.click(screen.getByText("Logout"));

    await waitFor(() => {
      const state = store.getState();
      expect(state.user.username).toBeUndefined();
      expect(state.lobby.lobbyId).toBeNull();
      expect(localStorage.getItem("user")).toBe("{}");
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("dispatches error if logout fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve()
        })
      )
    );

    render(
      <Provider store={store}>
        <MemoryRouter>
          <LogoutButton />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.click(screen.getByText("Logout"));

    await waitFor(() => {
      const errorState = store.getState().error;
      expect(errorState.errorMessage).toContain(
        "Logout failed: An error occurred"
      );
      expect(errorState.success).toBe(false);
    });
  });
});
