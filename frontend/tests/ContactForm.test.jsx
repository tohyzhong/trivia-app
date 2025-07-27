import { describe, it, vi, expect, beforeEach } from "vitest";
import { screen, render, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import ContactForm from "../src/components/contact/ContactForm.tsx";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import store from "../src/redux/store";
import { setUser } from "../src/redux/userSlice";
import { setError } from "../src/redux/errorSlice";

const mockDispatch = vi.fn((action) => store.dispatch(action));
vi.mock("react-redux", async () => {
  const actual = await vi.importActual("react-redux");
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: actual.useSelector
  };
});

const renderWithStore = () => {
  render(
    <MemoryRouter>
      <Provider store={store}>
        <ContactForm />
      </Provider>
    </MemoryRouter>
  );
};

vi.mock("motion/react", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    motion: {
      div: ({ children }) => <div>{children}</div>
    }
  };
});

describe("ContactForm", () => {
  let fetchMock;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.spyOn(global, "fetch");
  });

  it("shows error if email is invalid", async () => {
    renderWithStore();

    fireEvent.change(screen.getByLabelText("Name:"), {
      target: { value: "John Doe" }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "invalidemail@a" }
    });
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: "Subject" }
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Test message" }
    });

    const spy = vi.spyOn(store, "dispatch");

    fireEvent.submit(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        setError({
          errorMessage: "Please enter a valid email address.",
          success: false
        })
      );
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits the form and handles success", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    store.dispatch(
      setUser({
        isAuthenticated: true,
        username: "testuser",
        email: "test@example.com"
      })
    );

    renderWithStore();

    fireEvent.change(screen.getByLabelText("Name:"), {
      target: { value: "John Doe" }
    });
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: "Test Subject" }
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Test message body" }
    });

    fireEvent.submit(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/settings/contact"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            username: "testuser",
            email: "test@example.com",
            subject: "Test Subject",
            message: "Test message body"
          })
        })
      );
    });

    expect(screen.getByLabelText("Name:")).toHaveValue("");
    expect(screen.getByLabelText(/subject/i)).toHaveValue("");
    expect(screen.getByLabelText(/message/i)).toHaveValue("");
  });

  it("handles failed submission", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        message: "Server error"
      })
    });

    store.dispatch(
      setUser({
        isAuthenticated: false,
        username: "",
        email: ""
      })
    );

    renderWithStore();

    fireEvent.change(screen.getByLabelText("Name:"), {
      target: { value: "Jane" }
    });
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "jane123" }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "jane@example.com" }
    });
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: "Error Subject" }
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Something went wrong" }
    });

    const spy = vi.spyOn(store, "dispatch");

    fireEvent.submit(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        setError({
          errorMessage: "Server error",
          success: false
        })
      );
    });
  });

  it("disables username and email fields when authenticated", () => {
    store.dispatch(
      setUser({
        isAuthenticated: true,
        username: "authuser",
        email: "auth@example.com"
      })
    );

    renderWithStore();

    expect(screen.getByLabelText(/username/i)).toHaveValue("authuser");
    expect(screen.getByLabelText(/username/i)).toBeDisabled();

    expect(screen.getByLabelText(/email/i)).toHaveValue("auth@example.com");
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
  });
});
