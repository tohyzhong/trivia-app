import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import store from "../../src/redux/store.tsx";
import { setUser } from "../../src/redux/userSlice.tsx";
import QuestionTypeSelection from "../../src/components/questionrequest/QuestionTypeSelection.tsx";

const renderWithProviders = (ui, route = "/") =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>
  );

describe("QuestionTypeSelection", () => {
  beforeEach(() => {
    store.dispatch(
      setUser({
        isAuthenticated: true,
        username: "user1",
        emailVerified: true,
        banned: false,
        role: "user"
      })
    );
  });

  it("renders heading and basic type buttons", () => {
    renderWithProviders(<QuestionTypeSelection />);
    expect(
      screen.getByText("Select a Question Type to Submit")
    ).toBeInTheDocument();
    expect(screen.getByText("Classic")).toBeInTheDocument();
    expect(screen.getByText("Knowledge")).toBeInTheDocument();
  });

  it("contains correct links for Classic and Knowledge", () => {
    renderWithProviders(<QuestionTypeSelection />);
    expect(screen.getByRole("link", { name: "Classic" })).toHaveAttribute(
      "href",
      "/question-request/classic"
    );
    expect(screen.getByRole("link", { name: "Knowledge" })).toHaveAttribute(
      "href",
      "/question-request/knowledge"
    );
  });

  it("does NOT show Admin Dashboard for non-admin users", () => {
    renderWithProviders(<QuestionTypeSelection />);
    expect(screen.queryByText("Admin Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Go to Admin Dashboard")).not.toBeInTheDocument();
  });

  it("shows Admin Dashboard for admin", () => {
    store.dispatch(
      setUser({
        isAuthenticated: true,
        username: "adminUser",
        emailVerified: true,
        banned: false,
        role: "admin"
      })
    );

    renderWithProviders(<QuestionTypeSelection />);
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Go to Admin Dashboard")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to Admin Dashboard" })
    ).toHaveAttribute("href", "/question-request/admin-dashboard");
  });

  it("shows Admin Dashboard for superadmin", () => {
    store.dispatch(
      setUser({
        isAuthenticated: true,
        username: "superadmin",
        emailVerified: true,
        banned: false,
        role: "superadmin"
      })
    );

    renderWithProviders(<QuestionTypeSelection />);
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Go to Admin Dashboard")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to Admin Dashboard" })
    ).toHaveAttribute("href", "/question-request/admin-dashboard");
  });
});
