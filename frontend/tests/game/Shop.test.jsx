import "@testing-library/jest-dom";
import React from "react";
import { describe, it, vi, beforeEach, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import CurrencyBar from "../../src/components/game/subcomponents/CurrencyBar.tsx";
import store from "../../src/redux/store";
import { setLobby } from "../../src/redux/lobbySlice";

// Mock fetch
beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = vi.fn();
  store.dispatch(
    setLobby({
      lobbyId: "abc123",
      status: "in-progress",
      currency: 100,
      powerups: { hintBoosts: 1, addTimes: 2, doublePoints: 3 }
    })
  );
});

const renderWithProviders = () =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/play/abc123"]}>
        <CurrencyBar />
      </MemoryRouter>
    </Provider>
  );

describe("Currency Bar + Shop", () => {
  it("opens when plus button is clicked", async () => {
    renderWithProviders();

    fireEvent.click(screen.getByRole("button", { name: "" }));

    await waitFor(() => {
      expect(screen.getByText("Currency Shop")).toBeInTheDocument();
    });
  });

  it("initiates top-up and opens checkout URL", async () => {
    global.open = vi.fn();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: "https://checkout.com" })
    });

    renderWithProviders();

    fireEvent.click(screen.getByRole("button", { name: "" }));
    await screen.findByText("Currency Shop");

    fireEvent.click(screen.getByText(/\$1.49/));

    await waitFor(() => {
      expect(global.open).toHaveBeenCalledWith(
        "https://checkout.com",
        "_blank"
      );
    });
  });

  it("shows error when checkout fails", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    renderWithProviders();

    fireEvent.click(screen.getByRole("button", { name: "" }));
    await screen.findByText("Currency Shop");

    fireEvent.click(screen.getByText(/\$1.49/));

    await waitFor(() => {
      const state = store.getState();
      expect(state.error.errorMessage).toBe("Failed to start checkout.");
    });
  });

  it("purchases power-up and updates state", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        currency: 60,
        powerups: { hintBoosts: 2, addTimes: 2, doublePoints: 3 },
        message: "Hint Boost purchased successfully!"
      })
    });

    renderWithProviders();

    fireEvent.click(screen.getByRole("button", { name: "" }));
    await screen.findByText("Currency Shop");

    const hintButton = screen.getAllByRole("button", {
      name: /40/i
    })[0];

    fireEvent.click(hintButton);

    await waitFor(() => {
      const state = store.getState();
      expect(state.lobby.currency).toBe(60);
      expect(state.lobby.powerups.hintBoosts).toBe(2);
    });
  });

  it("handles failed purchase", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Not enough currency." })
    });

    renderWithProviders();

    fireEvent.click(screen.getByRole("button", { name: "" }));
    await screen.findByText("Currency Shop");

    const hintButton = screen.getAllByRole("button", {
      name: /40/i
    })[0];

    fireEvent.click(hintButton);

    await waitFor(() => {
      const state = store.getState();
      expect(state.error.errorMessage).toBe("Not enough currency.");
    });
  });

  it("displays currency and powerup counts from Redux store", () => {
    renderWithProviders();

    expect(screen.getByText("100")).toBeInTheDocument();

    expect(document.querySelector(".powerup-hint")).toHaveTextContent("1");
    expect(document.querySelector(".powerup-freeze")).toHaveTextContent("2");
    expect(document.querySelector(".powerup-double")).toHaveTextContent("3");
  });
});
