import { describe, it, beforeEach, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import NavigationBar from "../src/components/navigationbar/NavigationBar.tsx";
import store from "../src/redux/store";
import { setUser, logout } from "../src/redux/userSlice";
import React from "react";

function renderWithRoute(path = "/") {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={<NavigationBar />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe("NavigationBar + LoginBar rendering", () => {
  beforeEach(() => {
    store.dispatch(logout());
  });

  it("renders basic nav items when logged out", () => {
    renderWithRoute("/");

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Help")).toBeInTheDocument();

    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();

    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
    expect(screen.queryByText("Welcome,")).not.toBeInTheDocument();
  });

  it("renders full nav and user greeting when logged in", () => {
    store.dispatch(
      setUser({
        username: "testuser",
        isAuthenticated: true,
        isVerified: true,
        isBanned: false,
        role: "user"
      })
    );

    renderWithRoute("/");

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Help")).toBeInTheDocument();

    expect(screen.queryByText("Login")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign Up")).not.toBeInTheDocument();

    expect(screen.getByText("Welcome,")).toBeInTheDocument();
    expect(screen.getByText("testuser")).toBeInTheDocument();
  });

  it("does not render navbar on /auth routes", () => {
    renderWithRoute("/auth/login");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it("does not render navbar on /noaccess", () => {
    renderWithRoute("/noaccess");
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
    expect(screen.queryByText("Login")).not.toBeInTheDocument();
  });
});
