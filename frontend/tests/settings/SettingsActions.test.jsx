import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SettingsActions from "../../src/components/settingspage/SettingsActions";
import { Provider } from "react-redux";
import store from "../../src/redux/store";
import { logout } from "../../src/redux/userSlice";

vi.mock("../../src/redux/userSlice", async () => {
  const actual = await vi.importActual("../../src/redux/userSlice");
  return {
    ...actual,
    logout: vi.fn(() => ({ type: "LOGOUT" }))
  };
});

const renderWithRoute = (search) => {
  window.history.pushState({}, "Test page", `/settings/actions${search}`);
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/settings/actions${search}`]}>
        <Routes>
          <Route path="/settings/actions" element={<SettingsActions />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = vi.fn();
});

// Verify Token
describe("Verify Token Flow", () => {
  it("shows success on valid verify token", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: "User verified successfully!" })
    });

    renderWithRoute("?token=123&action=verify");

    await waitFor(() => {
      expect(
        screen.getByText("User verified successfully!")
      ).toBeInTheDocument();
    });
  });

  it("shows error on invalid verify token", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Error verifying token" })
    });

    renderWithRoute("?token=123&action=verify");

    await waitFor(() => {
      expect(screen.getByText("Error verifying token")).toBeInTheDocument();
    });
  });
});

// Change Email Verification
describe("Email Change Token", () => {
  it("shows success on valid email change token", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: "Email changed successfully" })
    });

    renderWithRoute("?token=abc123&action=email-change");

    await waitFor(() => {
      expect(
        screen.getByText("Email changed successfully")
      ).toBeInTheDocument();
    });
  });

  it("shows failure on invalid email change token", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Invalid or expired token" })
    });

    renderWithRoute("?token=badtoken&action=email-change");

    await waitFor(() => {
      expect(screen.getByText("Invalid or expired token")).toBeInTheDocument();
    });
  });
});

// Delete Account Verification
describe("Delete Account Token", () => {
  it("logs out and redirects on successful delete token", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Account deleted successfully" })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

    renderWithRoute("?token=delete123&action=delete-account");

    await waitFor(() => {
      expect(
        screen.getByText("Account deleted successfully")
      ).toBeInTheDocument();
      expect(logout).toHaveBeenCalled();
    });
  });

  it("shows error on invalid delete account token", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Invalid or expired token" })
    });

    renderWithRoute("?token=bad&action=delete-account");

    await waitFor(() => {
      expect(screen.getByText("Invalid or expired token")).toBeInTheDocument();
    });
  });
});

// Change Password
describe("Change Password Flow", () => {
  it("shows error on password mismatch", async () => {
    renderWithRoute("?token=pwdtoken&action=change-password");

    fireEvent.change(screen.getByPlaceholderText("Enter new password"), {
      target: { value: "abc123" }
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
      target: { value: "xyz123" }
    });
    fireEvent.click(screen.getByText("Submit New Password"));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });

  it("shows validation error from server", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          errors: [{ msg: "Password must be at least 8 characters long." }]
        })
    });

    renderWithRoute("?token=abc&action=change-password");

    fireEvent.change(screen.getByPlaceholderText("Enter new password"), {
      target: { value: "Asd123" }
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
      target: { value: "Asd123" }
    });
    fireEvent.click(screen.getByText("Submit New Password"));

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 8 characters long.")
      ).toBeInTheDocument();
    });
  });

  it("shows failure on backend error", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Invalid or expired token" })
    });

    renderWithRoute("?token=expiredtoken&action=change-password");

    fireEvent.change(screen.getByPlaceholderText("Enter new password"), {
      target: { value: "validPassword123" }
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
      target: { value: "validPassword123" }
    });
    fireEvent.click(screen.getByText("Submit New Password"));

    await waitFor(() => {
      expect(screen.getByText("Invalid or expired token")).toBeInTheDocument();
    });
  });

  it("logs out and redirects on successful password change", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ message: "Password changed successfully" })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

    renderWithRoute("?token=passtoken&action=change-password");

    fireEvent.change(screen.getByPlaceholderText("Enter new password"), {
      target: { value: "strongPassword1" }
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
      target: { value: "strongPassword1" }
    });
    fireEvent.click(screen.getByText("Submit New Password"));

    await waitFor(() => {
      expect(
        screen.getByText("Password changed successfully")
      ).toBeInTheDocument();
      expect(logout).toHaveBeenCalled();
    });
  });
});
