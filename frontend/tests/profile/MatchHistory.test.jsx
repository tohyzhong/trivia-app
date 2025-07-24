import React from "react";
import { screen, render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { expect, vi } from "vitest";
import MatchHistory from "../../src/components/profilepage/MatchHistory.tsx";
import store from "../../src/redux/store.tsx";
import { setUser } from "../../src/redux/userSlice.tsx";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";

global.fetch = vi.fn();

vi.mock("@/store/slices/errorSlice", () => ({
  setError: vi.fn()
}));

const mockMatchData = [
  {
    type: "solo-classic",
    state: "solo",
    totalPlayed: 10,
    correctNumber: 8,
    date: "2025-07-19T16:36:35.000Z",
    difficulty: 3,
    categoryStats: {
      Community: {
        correct: 8,
        total: 10
      }
    },
    answerHistory: {
      1: "missing",
      2: "correct",
      3: "missing",
      4: "correct",
      5: "correct",
      6: "correct",
      7: "wrong",
      8: "correct",
      9: "correct",
      10: "correct"
    },
    playerScoreSummary: {
      blerargh: {
        correct: 8,
        score: 1000
      }
    },
    color: "solo",
    teamScore: 0,
    teamAnswerHistory: {}
  },
  {
    type: "solo-knowledge",
    state: "solo",
    totalPlayed: 10,
    correctNumber: 10,
    date: "2025-07-19T14:02:04.568Z",
    difficulty: 3,
    categoryStats: {
      Community: {
        correct: 10,
        total: 10
      }
    },
    answerHistory: {
      1: "correct",
      2: "correct",
      3: "correct",
      4: "correct",
      5: "correct",
      6: "correct",
      7: "correct",
      8: "correct",
      9: "correct",
      10: "correct"
    },
    playerScoreSummary: {
      blerargh: {
        correct: 10,
        score: 1294
      }
    },
    color: "solo",
    teamScore: 0,
    teamAnswerHistory: {}
  },
  {
    type: "coop-knowledge",
    state: "coop",
    totalPlayed: 3,
    correctNumber: 1,
    date: "2025-07-20T18:42:28.373Z",
    difficulty: 3,
    categoryStats: {
      Overall: {
        correct: 1,
        total: 3
      }
    },
    answerHistory: {
      1: "wrong",
      2: "wrong",
      3: "correct"
    },
    playerScoreSummary: {
      blerargh: {
        correct: 1,
        score: 0
      }
    },
    color: "solo",
    teamScore: 0,
    teamAnswerHistory: {
      1: ["missing"],
      2: ["missing"],
      3: ["missing"]
    }
  },
  {
    type: "versus-classic",
    state: "1st",
    totalPlayed: 10,
    correctNumber: 3,
    date: "2025-07-20T18:34:49.557Z",
    difficulty: 3,
    categoryStats: {
      General: {
        correct: 3,
        total: 10
      }
    },
    answerHistory: {
      1: "correct",
      2: "wrong",
      3: "wrong",
      4: "wrong",
      5: "correct",
      6: "correct",
      7: "wrong",
      8: "wrong",
      9: "wrong",
      10: "wrong"
    },
    playerScoreSummary: {
      blerargh2: {
        correct: 2,
        score: 210
      },
      blerargh: {
        correct: 3,
        score: 310
      }
    },
    color: "win",
    teamScore: 0,
    teamAnswerHistory: {}
  }
];

const renderWithRoute = (ui, { route = "/testuser/matchhistory" } = {}) => {
  window.history.pushState({}, "Test page", route);

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/:username/matchhistory" element={<MatchHistory />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe("MatchHistory Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(setUser({ username: "testuser", role: "user" }));

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ matchHistory: mockMatchData })
    });
  });

  it("renders answer history dots with correct colors", async () => {
    renderWithRoute("/testuser/matchhistory");
    await screen.findByText(/Sun, Jul 20 2025, 12:36 AM/i);
    const details = screen.getByText(/Sun, Jul 20 2025, 12:36 AM/i);
    fireEvent.click(details);

    const dots = screen.getAllByTitle(/Q\d/);
    expect(
      dots.find((d) => d.title.includes("missing")).style.backgroundColor ===
        "gray"
    ).toBeTruthy();
    expect(
      dots.find((d) => d.title.includes("correct")).style.backgroundColor ===
        "green"
    ).toBeTruthy();
    expect(
      dots.find((d) => d.title.includes("wrong")).style.backgroundColor ===
        "red"
    ).toBeTruthy();
  });

  it("renders team answer history if coop mode", async () => {
    renderWithRoute("/testuser/matchhistory");
    await screen.findByText(/Mon, Jul 21 2025, 2:42 AM/i);
    const details = screen.getByText(/Mon, Jul 21 2025, 2:42 AM/i);
    fireEvent.click(details);

    await screen.findByText("Team Answer History:");
    expect(screen.getAllByTitle(/Q\d/)).toHaveLength(6);
    const dots = screen.getAllByTitle(/Q\d/);
    expect(
      dots.find((d) => d.title.includes("missing")).style.backgroundColor ===
        "gray"
    ).toBeTruthy();
    expect(
      dots.find((d) => d.title.includes("correct")).style.backgroundColor ===
        "green"
    ).toBeTruthy();
    expect(
      dots.find((d) => d.title.includes("wrong")).style.backgroundColor ===
        "red"
    ).toBeTruthy();
  });

  it("renders player scores with user highlighted", async () => {
    renderWithRoute("/blerargh/matchhistory");
    await screen.findByText(/Sat, Jul 19 2025, 10:02 PM/i);
    const details = screen.getByText(/Sat, Jul 19 2025, 10:02 PM/i);
    fireEvent.click(details);

    await screen.findByText("Answer History:");

    expect(screen.getByText("blerargh")).toHaveClass("player-name");
    expect(screen.getByText("1294 Score")).toBeInTheDocument();
    expect(screen.getByText("10 Correct")).toBeInTheDocument();
  });
});
