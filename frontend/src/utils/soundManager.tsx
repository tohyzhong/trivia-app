import bgmAudio from "../assets/bgm.mp3";
import quizBgm from "../assets/quiz.mp3";
import clickAudio from "../assets/click.mp3";

let bgm: HTMLAudioElement | null = null;
let mode: "lobby" | "quiz" | null = null;
let click: HTMLAudioElement | null = null;

let bgmVolume = 1.0;
let sfxVolume = 1.0;

export const setVolumeLevels = ({
  overallSound,
  bgmVol,
  sfxVol
}: {
  overallSound: number;
  bgmVol: number;
  sfxVol: number;
}) => {
  bgmVolume = (overallSound / 100) * (bgmVol / 100);
  sfxVolume = (overallSound / 100) * (sfxVol / 100);

  if (bgm) {
    bgm.volume = bgmVolume;
  }
};

let userHasInteracted = false;
let isBGMPlaybackBlocked = false;
let onPlaybackBlockedCallback: (() => void) | null = null;

export const setOnPlaybackBlocked = (callback: () => void) => {
  onPlaybackBlockedCallback = callback;
};

export const clearOnPlaybackBlocked = () => {
  onPlaybackBlockedCallback = null;
};

export const notifyUserInteraction = () => {
  userHasInteracted = true;
  playBGM(mode);
};

export const playBGM = (modeSelected) => {
  if (!bgm || mode !== modeSelected) {
    mode = modeSelected;
    bgm = new Audio(modeSelected === "Lobby" ? bgmAudio : quizBgm);
    bgm.loop = true;
    bgm.volume = bgmVolume;
  }

  if (bgm.paused) {
    bgm
      .play()
      .then(() => {
        isBGMPlaybackBlocked = false;
      })
      .catch((err) => {
        isBGMPlaybackBlocked = true;
        console.warn("BGM playback blocked:", err);
        if (onPlaybackBlockedCallback) {
          onPlaybackBlockedCallback();
        }
      });
  }
};

export const wasBGMBlocked = () => isBGMPlaybackBlocked;

export const stopBGM = () => {
  if (bgm) {
    bgm.pause();
  }
};

export const playClickSound = () => {
  if (!click) {
    click = new Audio(clickAudio);
  } else {
    click.pause();
    click.currentTime = 0;
  }
  click.volume = sfxVolume;
  click.play().catch((err) => console.warn("Click sound error:", err));
};
