import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import PasswordReset from "../../src/components/authentication/subcomponents/PasswordReset";
import { Provider } from "react-redux";
import store from "../../src/redux/store";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();
const mockDispatch = vi.fn((action) => store.dispatch(action));
const mockUseSearchParams = vi.fn(() => [{ get: () => null }, vi.fn()]);

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => mockUseSearchParams()
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

describe("PasswordReset", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    mockNavigate.mockClear();
    mockDispatch.mockClear();
  });

  it("renders forgot password form when no token", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <PasswordReset />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Send Email/i })
    ).toBeInTheDocument();
  });

  it("shows countdown at 60 when email sent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              message: "Password reset link sent to your email."
            })
        })
      )
    );

    render(
      <Provider store={store}>
        <MemoryRouter>
          <PasswordReset />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Email/i), {
      target: { value: "test@example.com" }
    });

    fireEvent.click(screen.getByRole("button", { name: /Send Email/i }));

    await waitFor(() => {
      expect(screen.getByText(/Resend Email \(60\)/i)).toBeInTheDocument();
    });
  });

  it("shows error when email not sent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({})
        })
      )
    );

    render(
      <Provider store={store}>
        <MemoryRouter>
          <PasswordReset />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Email/i), {
      target: { value: "test@example.com" }
    });

    fireEvent.click(screen.getByRole("button", { name: /Send Email/i }));

    await waitFor(() => {
      expect(store.getState().error.errorMessage).toBe("Failed to send OTP");
    });
  });

  describe("when token exists", () => {
    beforeEach(() => {
      vi.resetAllMocks();
      localStorage.clear();
      mockNavigate.mockClear();
      mockDispatch.mockClear();
      mockUseSearchParams.mockReturnValue([
        { get: () => "valid-token" },
        vi.fn()
      ]);
    });

    it("renders reset password form on valid token", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn((url) => {
          if (url.includes("/verifyreset")) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ email: "test@example.com" })
            });
          }
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({})
          });
        })
      );

      render(
        <Provider store={store}>
          <MemoryRouter>
            <PasswordReset />
          </MemoryRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Password Reset \(test@example.com\)/i)
        ).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText("New Password")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Confirm New Password/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Reset Password/i })
      ).toBeInTheDocument();
    });

    it("dispatches error on invalid token", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: "Invalid or expired token" })
          })
        )
      );

      render(
        <Provider store={store}>
          <MemoryRouter>
            <PasswordReset />
          </MemoryRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(store.getState().error.errorMessage).toBe(
          "Invalid or expired token"
        );
      });
    });

    it("shows error if passwords do not match on reset submit", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn((url) => {
          if (url.includes("/verifyreset")) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ email: "test@example.com" })
            });
          }
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({})
          });
        })
      );

      render(
        <Provider store={store}>
          <MemoryRouter>
            <PasswordReset />
          </MemoryRouter>
        </Provider>
      );

      await waitFor(() => screen.getByPlaceholderText("New Password"));

      const newPasswordInput = screen.getByPlaceholderText("New Password");
      const confirmPasswordInput =
        screen.getByPlaceholderText(/Confirm New Password/i);
      const submitButton = screen.getByRole("button", {
        name: /Reset Password/i
      });

      fireEvent.change(newPasswordInput, { target: { value: "Password1" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "Password2" }
      });

      fireEvent.click(submitButton);

      expect(
        await screen.findByText("Passwords do not match")
      ).toBeInTheDocument();
      expect(
        await screen.findByPlaceholderText("Confirm New Password")
      ).toBeInTheDocument();
    });

    it("successful password reset redirects", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn((url) => {
          if (url.includes("/verifyreset")) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ email: "test@example.com" })
            });
          }
          if (url.includes("/resetpassword")) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({ message: "Password reset successfully." })
            });
          }
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({})
          });
        })
      );

      window.alert = vi.fn();

      render(
        <Provider store={store}>
          <MemoryRouter>
            <PasswordReset />
          </MemoryRouter>
        </Provider>
      );

      await waitFor(() => screen.getByPlaceholderText("New Password"));

      fireEvent.change(screen.getByPlaceholderText("New Password"), {
        target: { value: "Password1" }
      });
      fireEvent.change(screen.getByPlaceholderText(/Confirm New Password/i), {
        target: { value: "Password1" }
      });

      fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          "Password reset successfully. Redirecting to Login Page..."
        );
        expect(mockNavigate).toHaveBeenCalledWith("/auth/login");
      });
    });

    it("shows server errors on failed reset", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn((url) => {
          if (url.includes("/verifyreset")) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ email: "test@example.com" })
            });
          }
          if (url.includes("/resetpassword")) {
            return Promise.resolve({
              ok: false,
              json: () =>
                Promise.resolve({
                  errors: [
                    { msg: "Password must be at least 8 characters long." },
                    {
                      msg: "Password must contain at least one uppercase letter."
                    }
                  ]
                })
            });
          }
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({})
          });
        })
      );

      render(
        <Provider store={store}>
          <MemoryRouter>
            <PasswordReset />
          </MemoryRouter>
        </Provider>
      );

      await waitFor(() => screen.getByPlaceholderText("New Password"));

      fireEvent.change(screen.getByPlaceholderText("New Password"), {
        target: { value: "a123" }
      });
      fireEvent.change(screen.getByPlaceholderText(/Confirm New Password/i), {
        target: { value: "a123" }
      });

      fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

      expect(
        await screen.findByText("Password must be at least 8 characters long.")
      ).toBeInTheDocument();
      expect(
        await screen.getByText(
          "Password must contain at least one uppercase letter."
        )
      ).toBeInTheDocument();
    });
  });
});
