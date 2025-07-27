import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import Settings from "../../src/components/settingspage/Settings.tsx";
import { MemoryRouter } from "react-router-dom";
import store from "../../src/redux/store";
import { useCooldown } from "../../src/hooks/useCooldown";

const mockDispatch = vi.fn();
const mockTriggerCooldown = vi.fn();

vi.mock("react-redux", async () => {
  const actual = await vi.importActual("react-redux");
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: vi.fn((selector) =>
      selector({
        user: {
          username: "testuser",
          isVerified: false,
          isLoggedIn: true
        },
        error: { errorMessage: null, success: false }
      })
    )
  };
});

vi.mock("../../src/hooks/useCooldown", () => ({
  useCooldown: vi.fn()
}));

const renderComponent = () => {
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    </Provider>
  );
};

describe("Settings Component", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    useCooldown.mockReturnValue({
      remaining: 0,
      triggerCooldown: mockTriggerCooldown
    });

    vi.stubGlobal(
      "fetch",
      vi.fn((url) => {
        if (url.includes("/api/profile/")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                username: "testuser",
                email: "test@example.com",
                verified: true,
                chatBan: false,
                gameBan: false,
                profilePicture: ""
              })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      })
    );
  });

  // Profile Fetching
  describe("Profile Fetch", () => {
    it("renders warning for unverified users", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn((url) => {
          if (url.includes("/api/profile/")) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  username: "testuser",
                  email: "test@example.com",
                  verified: false,
                  chatBan: false,
                  gameBan: false,
                  profilePicture: ""
                })
            });
          }
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: "error/setError",
          payload: {
            errorMessage:
              "Your account is not verified. Please check your email to verify your account.",
            success: false
          }
        });
        expect(screen.getByText("Verify")).toBeInTheDocument();
      });
    });

    it("handles profile fetch failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network error"));
      renderComponent();
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: "error/setError",
          payload: {
            errorMessage: "Error fetching profile dataError: Network error",
            success: false
          }
        });
      });
    });
  });

  // Profile Picture
  describe("Profile Picture", () => {
    it("submits profile picture update successfully", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              username: "testuser",
              email: "test@example.com",
              verified: true,
              chatBan: false,
              gameBan: false,
              profilePicture: ""
            })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({})
        });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter new profile picture URL/i)
        ).toBeInTheDocument();
      });

      fireEvent.change(
        screen.getByPlaceholderText(/Enter new profile picture URL/i),
        { target: { value: "memepicture.jpg" } }
      );
      fireEvent.click(screen.getByText(/Update Profile Picture/i));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: "error/setError",
          payload: {
            errorMessage: "Profile picture updated successfully!",
            success: true
          }
        });
      });
    });

    it("invalid profile picture", async () => {
      renderComponent();
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter new profile picture URL/i)
        ).toBeInTheDocument();
      });

      fireEvent.change(
        screen.getByPlaceholderText(/Enter new profile picture URL/i),
        { target: { value: "fail" } }
      );
      fireEvent.click(screen.getByText(/Update Profile Picture/i));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: "error/setError",
          payload: expect.objectContaining({
            errorMessage: "Please enter a valid image URL",
            success: false
          })
        });
      });
    });

    it("handles failed profile picture update from server", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              username: "testuser",
              email: "test@example.com",
              verified: true,
              chatBan: false,
              gameBan: false,
              profilePicture: ""
            })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: "Update failed on server" })
        });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter new profile picture URL/i)
        ).toBeInTheDocument();
      });

      fireEvent.change(
        screen.getByPlaceholderText(/Enter new profile picture URL/i),
        { target: { value: "test.jpg" } }
      );
      fireEvent.click(screen.getByText(/Update Profile Picture/i));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: "error/setError",
          payload: {
            errorMessage: "Error updating profile picture",
            success: false
          }
        });
      });
    });
  });

  // Password Reset
  describe("Password Reset", () => {
    it("submits reset request successfully", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              username: "testuser",
              email: "test@example.com",
              verified: true,
              chatBan: false,
              gameBan: false,
              profilePicture: ""
            })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({})
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Request Password Reset/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Request Password Reset/i));

      await waitFor(() => {
        expect(mockTriggerCooldown).toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith({
          type: "error/setError",
          payload: {
            errorMessage:
              "Password reset request sent! Please check your email for further instructions.",
            success: true
          }
        });
        expect(mockTriggerCooldown).toHaveBeenCalled();
      });
    });

    it("handles failed password reset", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              username: "testuser",
              email: "test@example.com",
              verified: true,
              chatBan: false,
              gameBan: false,
              profilePicture: ""
            })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({})
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Request Password Reset/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Request Password Reset/i));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: "error/setError",
          payload: expect.objectContaining({
            errorMessage: "Error sending password reset request",
            success: false
          })
        });
      });
    });

    it("prevents password reset during cooldown", async () => {
      useCooldown.mockReturnValue({
        remaining: 30, // This value does not matter, the timer in this Unit Test does not actually work, to test timer check UseCooldown
        triggerCooldown: mockTriggerCooldown
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            username: "testuser",
            email: "test@example.com",
            verified: true,
            chatBan: false,
            gameBan: false,
            profilePicture: ""
          })
      });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText(/New Profile Picture URL/i)
        ).toBeInTheDocument();
      });

      const button = screen.getByText(/Password/i);
      expect(button).toBeDisabled();
    });
  });

  // Change Email
  describe("Email Change", () => {
    it("handles successful email change", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              username: "testuser",
              email: "test@example.com",
              verified: true,
              chatBan: false,
              gameBan: false,
              profilePicture: ""
            })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({})
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Email Change/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText(/Enter new email/i), {
        target: { value: "new@example.com" }
      });
      fireEvent.click(screen.getByText(/Email Change/i));

      await waitFor(() => {
        expect(mockTriggerCooldown).toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith({
          type: "error/setError",
          payload: {
            errorMessage:
              "Email change request sent! Please check your new email to verify the change.",
            success: true
          }
        });
        expect(mockTriggerCooldown).toHaveBeenCalled();
      });
    });

    it("handles failed email change", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              username: "testuser",
              email: "test@example.com",
              verified: true,
              chatBan: false,
              gameBan: false,
              profilePicture: ""
            })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({})
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Email Change/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText(/Enter new email/i), {
        target: { value: "bad@fail.com" }
      });
      fireEvent.click(screen.getByText(/Email Change/i));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: "error/setError",
          payload: {
            errorMessage: "Error changing email",
            success: false
          }
        });
      });
    });

    it("prevents email change during cooldown", async () => {
      useCooldown.mockReturnValue({
        remaining: 30, // This value does not matter, the timer in this Unit Test does not actually work, to test timer check UseCooldown
        triggerCooldown: mockTriggerCooldown
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            username: "testuser",
            email: "test@example.com",
            verified: true,
            chatBan: false,
            gameBan: false,
            profilePicture: ""
          })
      });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText(/New Profile Picture URL/i)
        ).toBeInTheDocument();
      });

      const button = screen.getByText(/Change Email/i);
      expect(button).toBeDisabled();
    });
  });

  // Delete Account
  describe("Delete Account", () => {
    it("handles failed delete account request", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              username: "testuser",
              email: "test@example.com",
              verified: true,
              chatBan: false,
              gameBan: false,
              profilePicture: ""
            })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({})
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Delete Account/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Delete Account/i));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: "error/setError",
          payload: {
            errorMessage: "Error deleting account",
            success: false
          }
        });
      });
    });

    it("handles successful delete account request", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              username: "testuser",
              email: "test@example.com",
              verified: true,
              chatBan: false,
              gameBan: false,
              profilePicture: ""
            })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({})
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Delete Account/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Delete Account/i));

      await waitFor(() => {
        expect(mockTriggerCooldown).toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith({
          type: "error/setError",
          payload: {
            errorMessage:
              "Please check your email to confirm account deletion.",
            success: true
          }
        });
      });
    });

    it("prevents delete account during cooldown", async () => {
      useCooldown.mockReturnValue({
        remaining: 30, // This value does not matter, the timer in this Unit Test does not actually work, to test timer check UseCooldown
        triggerCooldown: mockTriggerCooldown
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            username: "testuser",
            email: "test@example.com",
            verified: true,
            chatBan: false,
            gameBan: false,
            profilePicture: ""
          })
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Delet/i)).toBeInTheDocument();
      });

      const button = screen.getByText(/Delet/i);
      expect(button).toBeDisabled();
    });
  });

  // Verify Account
  describe("Verification Email", () => {
    it("sends verification email and triggers cooldown", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              username: "testuser",
              email: "test@example.com",
              verified: false,
              chatBan: false,
              gameBan: false,
              profilePicture: ""
            })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({})
        });

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText("Verify")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Verify"));

      await waitFor(() => {
        expect(mockTriggerCooldown).toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith({
          type: "error/setError",
          payload: {
            errorMessage:
              "Your account is not verified. Please check your email to verify your account.",
            success: false
          }
        });
        expect(mockDispatch).toHaveBeenCalledWith({
          type: "error/setError",
          payload: {
            errorMessage:
              "Verification email sent! Please check your email to verify your account.",
            success: true
          }
        });
      });
    });

    it("handles verification email failure", async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              username: "testuser",
              email: "test@example.com",
              verified: false,
              chatBan: false,
              gameBan: false,
              profilePicture: ""
            })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({})
        });

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText("Verify")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Verify"));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: "error/setError",
          payload: {
            errorMessage:
              "Your account is not verified. Please check your email to verify your account.",
            success: false
          }
        });
        expect(mockDispatch).toHaveBeenCalledWith({
          type: "error/setError",
          payload: {
            errorMessage: "Error sending verification email",
            success: false
          }
        });
      });
    });

    it("prevents verification email during cooldown", async () => {
      useCooldown.mockReturnValue({
        remaining: 30, // This value does not matter, the timer in this Unit Test does not actually work, to test timer check UseCooldown
        triggerCooldown: mockTriggerCooldown
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            username: "testuser",
            email: "test@example.com",
            verified: false,
            chatBan: false,
            gameBan: false,
            profilePicture: ""
          })
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/verify|resend/i)).toBeInTheDocument();
      });

      const button = screen.getByText(/verify|resend/i);
      expect(button).toBeDisabled();
    });
  });
});
