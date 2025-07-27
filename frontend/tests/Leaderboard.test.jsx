import { describe, it, vi, expect, beforeEach } from "vitest";
import { screen, render, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Leaderboard from "../src/components/leaderboard/Leaderboard.tsx";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import store from "../src/redux/store.tsx";
import React from "react";
import { act } from "react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

global.fetch = vi.fn();

function renderWithRoute(path) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/leaderboard/:gameFormat/:mode/:category"
            element={<Leaderboard />}
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

vi.mock(
  "../src/components/leaderboard/subcomponents/LeaderboardDropdown",
  () => ({
    default: (props) => (
      <div data-testid="dropdown">
        <button onClick={() => props.setGameFormat("knowledge")}>
          Change Format
        </button>
        <button onClick={() => props.setMode("Solo")}>Change Mode</button>
        <button onClick={() => props.setCategory("Community")}>
          Change Category
        </button>
      </div>
    )
  })
);

vi.mock("../src/components/game/subcomponents/SoundSettings", () => ({
  default: () => <div data-testid="sound-settings">Sound Settings Content</div>
}));

// Mock hooks
vi.mock("../src/hooks/useInitSound", () => ({
  useInitSound: vi.fn()
}));

vi.mock("../src/utils/soundManager", () => ({
  playClickSound: vi.fn()
}));

vi.mock("../src/hooks/useBGMResumeOverlay", () => ({
  default: vi.fn(() => ({
    bgmBlocked: false,
    handleResume: vi.fn()
  }))
}));

describe("Leaderboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(["General", "Community"])
    });
  });

  it("renders correctly with default route params", async () => {
    await act(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              username: "test",
              profilePicture: "",
              correctAnswer: 5,
              totalAnswer: 5,
              correctRate: 100,
              wonMatches: 1,
              totalMatches: 1,
              winRate: 100,
              rank: 1,
              score: 500
            }
          ])
      });
      renderWithRoute("/leaderboard/classic/Overall/Overall");
    });

    expect(screen.getByText(/Classic Game/i)).toBeInTheDocument();
    expect(screen.getByText(/5 Correct Answers/i)).toBeInTheDocument();
    expect(await screen.findByTestId("dropdown")).toBeInTheDocument();
  });

  it("updates route params and fetches leaderboard when dropdown buttons are clicked", async () => {
    await act(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(["General", "Community"])
      });

      renderWithRoute("/leaderboard/classic/Overall/Overall");
    });

    fireEvent.click(screen.getByText("Change Format"));
    fireEvent.click(screen.getByText("Change Mode"));
    fireEvent.click(screen.getByText("Change Category"));

    await waitFor(() => {
      expect(screen.getByText(/Knowledge Game/i)).toBeInTheDocument();
      expect(screen.getByText(/Solo Mode/i)).toBeInTheDocument();
      expect(screen.getByText(/Community Category/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/leaderboard/stats?gameFormat=knowledge&mode=solo&category=Community"
        ),
        expect.objectContaining({
          method: "GET",
          credentials: "include"
        })
      );
    });
  });

  it("sound settings button", async () => {
    renderWithRoute("/leaderboard/classic/Overall/Overall");

    fireEvent.click(screen.getByTestId("game-settings-icon"));
    expect(
      await screen.findByText("Sound Settings Content")
    ).toBeInTheDocument();
  });
});
