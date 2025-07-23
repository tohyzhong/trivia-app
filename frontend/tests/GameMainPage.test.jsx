import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, render, fireEvent, waitFor } from "@testing-library/react";
import GameMainpage from "../src/components/game/GameMainpage.tsx";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import store from "../src/redux/store.tsx";
import { setUser } from "../src/redux/userSlice.tsx";
import { updateSoundSettings } from "../src/redux/soundSettingsSlice";
import { playClickSound } from "../src/utils/soundManager.tsx";
import "@testing-library/jest-dom";
import React from "react";

vi.mock("../src/hooks/useInitSound", () => ({
  useInitSound: vi.fn()
}));

vi.mock("../src/hooks/useBGMResumeOverlay", () => ({
  useBGMResumeOverlay: () => ({
    bgmBlocked: false,
    handleResume: vi.fn()
  })
}));

vi.mock("../src/utils/soundManager", async () => {
  const actual = await vi.importActual("../src/utils/soundManager");
  return {
    ...actual,
    playClickSound: vi.fn()
  };
});

const renderWithRoute = (initialRoute = "/game") => {
  window.localStorage.clear();
  window.localStorage.setItem("token", "valid");
  store.dispatch(
    setUser({ username: "tester", verified: true, banned: false })
  );

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/game" element={<GameMainpage />} />
          <Route path="/leaderboard" element={<div>Leaderboard Page</div>} />
          <Route
            path="/question-request"
            element={<div>Question Request Page</div>}
          />
          <Route path="/contact" element={<div>Contact Page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe("GameMainpage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(
      setUser({
        username: "tester",
        email: "tester@example.com",
        verified: true,
        banned: false,
        role: "user"
      })
    );

    store.dispatch(
      updateSoundSettings({
        overallSound: 100,
        bgmVolume: 100,
        sfxVolume: 100,
        profanityEnabled: false
      })
    );

    localStorage.clear();
  });

  it("renders welcome message and all mode buttons", () => {
    renderWithRoute();
    expect(screen.getByText(/Welcome to The Rizz Quiz/i)).toBeInTheDocument();
    expect(screen.getByText("Solo Mode")).toBeInTheDocument();
    expect(screen.getByText("Multiplayer Mode")).toBeInTheDocument();
    expect(screen.getByText("Leaderboard")).toBeInTheDocument();
  });

  it("opens Solo Mode submode popup and renders Classic/Knowledge", async () => {
    renderWithRoute();
    fireEvent.click(screen.getByText("Play Solo!"));
    await waitFor(() => {
      expect(screen.getByText("Classic")).toBeInTheDocument();
      expect(screen.getByText("Knowledge")).toBeInTheDocument();
    });
    expect(playClickSound).toHaveBeenCalled();
  });

  it("opens Multiplayer Mode submode popup and renders Coop/Versus/Browse", async () => {
    renderWithRoute();
    fireEvent.click(screen.getByText("Play Multiplayer!"));
    await waitFor(() => {
      expect(screen.getByText("Co-op - Classic")).toBeInTheDocument();
      expect(screen.getByText("Co-op - Knowledge")).toBeInTheDocument();
      expect(screen.getByText("Versus - Classic")).toBeInTheDocument();
      expect(screen.getByText("Versus - Knowledge")).toBeInTheDocument();
      expect(screen.getByText("Browse Lobbies")).toBeInTheDocument();
    });
    expect(playClickSound).toHaveBeenCalled();
  });

  it("navigates to Leaderboard when button is clicked", async () => {
    renderWithRoute();
    fireEvent.click(screen.getByText("View"));
    await waitFor(() => {
      expect(screen.getByText("Leaderboard Page")).toBeInTheDocument();
    });
    expect(playClickSound).toHaveBeenCalled();
  });

  it("navigates to Question Request page when icon is clicked", async () => {
    renderWithRoute();
    fireEvent.click(screen.getByTestId("submit-question"));
    await waitFor(() => {
      expect(screen.getByText("Question Request Page")).toBeInTheDocument();
    });
    expect(playClickSound).toHaveBeenCalled();
  });

  it("navigates to Contact page when help icon is clicked", async () => {
    renderWithRoute();
    fireEvent.click(screen.getByTestId("contact-us"));
    await waitFor(() => {
      expect(screen.getByText("Contact Page")).toBeInTheDocument();
    });
    expect(playClickSound).toHaveBeenCalled();
  });

  it("opens settings popup and displays all controls", async () => {
    renderWithRoute();

    fireEvent.click(screen.getByTestId("game-settings"));

    expect(await screen.findByText("Overall Sound")).toBeInTheDocument();
    expect(screen.getByText("Show Profanities")).toBeInTheDocument();
    expect(screen.getByText("BGM Volume")).toBeInTheDocument();
    expect(screen.getByText("SFX Volume")).toBeInTheDocument();
  });

  it("updates overall, bgm, and sfx sliders and syncs with localStorage + Redux", async () => {
    renderWithRoute();

    fireEvent.click(screen.getByTestId("game-settings"));

    expect(await screen.findByText("Overall Sound")).toBeInTheDocument();

    const sliders = await screen.findAllByRole("slider");
    const [overallSlider, bgmSlider, sfxSlider] = sliders;

    fireEvent.change(overallSlider, { target: { value: "70" } });
    fireEvent.change(bgmSlider, { target: { value: "60" } });
    fireEvent.change(sfxSlider, { target: { value: "50" } });

    const state = store.getState().soundSettings;
    expect(state.overallSound).toBe(70);
    expect(state.bgmVolume).toBe(60);
    expect(state.sfxVolume).toBe(50);

    const saved = JSON.parse(localStorage.getItem("soundSettings"));
    expect(saved.overallSound).toBe(70);
    expect(saved.bgmVolume).toBe(60);
    expect(saved.sfxVolume).toBe(50);
  });

  it("toggles mute/unmute and restores previous volume", async () => {
    renderWithRoute();

    fireEvent.click(screen.getByTestId("game-settings"));

    expect(await screen.findByText("Overall Sound")).toBeInTheDocument();

    const overallMute = await screen.getByTestId("overallmute");
    const bgmMute = screen.getByTestId("bgmmute");
    const sfxMute = screen.getByTestId("sfxmute");

    fireEvent.click(overallMute);
    expect(store.getState().soundSettings.overallSound).toBe(0); // muted

    fireEvent.click(overallMute);
    expect(store.getState().soundSettings.overallSound).toBe(100); // restored

    fireEvent.click(bgmMute);
    expect(store.getState().soundSettings.bgmVolume).toBe(0); // muted

    fireEvent.click(bgmMute);
    expect(store.getState().soundSettings.bgmVolume).toBe(100); // restored

    fireEvent.click(sfxMute);
    expect(store.getState().soundSettings.sfxVolume).toBe(0); // muted

    fireEvent.click(sfxMute);
    expect(store.getState().soundSettings.sfxVolume).toBe(100); // restored
  });

  it("toggles profanity setting and persists it in redux and localStorage", async () => {
    renderWithRoute();

    fireEvent.click(screen.getByTestId("game-settings"));

    expect(await screen.findByText("Overall Sound")).toBeInTheDocument();

    const toggle = await screen.findByTestId("profanity-toggle");
    expect(toggle).toBeInTheDocument();

    fireEvent.click(toggle);

    let updated = store.getState().soundSettings;
    expect(updated.profanityEnabled).toBe(true);

    let saved = JSON.parse(localStorage.getItem("soundSettings"));
    expect(saved.profanityEnabled).toBe(true);

    fireEvent.click(toggle);

    updated = store.getState().soundSettings;
    expect(updated.profanityEnabled).toBe(false);

    saved = JSON.parse(localStorage.getItem("soundSettings"));
    expect(saved.profanityEnabled).toBe(false);
  });
});
