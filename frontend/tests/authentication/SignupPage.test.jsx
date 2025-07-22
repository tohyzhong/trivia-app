import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SignupPage from "../../src/components/authentication/subcomponents/SignupPage";
import { Provider } from "react-redux";
import store from "../../src/redux/store";
import { MemoryRouter } from "react-router-dom";
import React from "react";

describe("SignupPage", () => {
  it("renders all required input fields and links", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SignupPage />
        </MemoryRouter>
      </Provider>
    );

    // Inputs
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^Password$/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Confirm Password/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/have an account/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /log in here/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /register/i })
    ).toBeInTheDocument();

    const backLink = screen.getByRole("link", { name: /back/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("shows error when passwords do not match", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SignupPage />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" }
    });
    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "niceuser" }
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "abc123" }
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), {
      target: { value: "xyz456" }
    });

    fireEvent.click(screen.getByText("Register"));
    expect(
      await screen.findByText(/Passwords do not match/i)
    ).toBeInTheDocument();
  });

  it("blocks profane usernames", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SignupPage />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "asshole" }
    });

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" }
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "abc123" }
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), {
      target: { value: "abc123" }
    });
    await fireEvent.click(screen.getByText("Register"));
    expect(
      await screen.findByText(/Username contains profanities/i)
    ).toBeInTheDocument();
  });

  it("calls register API and redirects", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "User registered" })
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    delete window.location;
    window.location = {
      href: ""
    };
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SignupPage />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" }
    });
    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "newuser" }
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "123456" }
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), {
      target: { value: "123456" }
    });
    fireEvent.click(screen.getByText("Register"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith(
        "Registered successfully. Redirecting..."
      );
      expect(window.location.href).toBe("/auth/login");
    });

    vi.restoreAllMocks();
  });

  it("displays server validation errors from data.errors", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SignupPage />
        </MemoryRouter>
      </Provider>
    );

    const mockErrors = [
      { msg: "Username must be between 5 to 16 characters long" },
      { msg: "Password must be at least 8 characters long." }
    ];

    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ errors: mockErrors })
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    fireEvent.change(screen.getByPlaceholderText(/Email/i), {
      target: { value: "testemail@gmail.com" }
    });
    fireEvent.change(screen.getByPlaceholderText(/Username/i), {
      target: { value: "asd" }
    });
    fireEvent.change(screen.getByPlaceholderText(/^Password$/i), {
      target: { value: "short" }
    });
    fireEvent.change(screen.getByPlaceholderText(/Confirm Password/i), {
      target: { value: "short" }
    });

    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    for (const err of mockErrors) {
      expect(await screen.findByText(err.msg)).toBeInTheDocument();
    }

    vi.restoreAllMocks();
  });
});
