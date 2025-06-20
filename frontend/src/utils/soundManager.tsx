import bgmAudio from "../assets/bgm.mp3";
import clickAudio from "../assets/click.mp3";

let bgm: HTMLAudioElement | null = null;
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

export const playBGM = () => {
  if (!bgm) {
    bgm = new Audio(bgmAudio);
    bgm.loop = true;
    bgm.volume = bgmVolume;
    bgm.play().catch((err) => console.warn("BGM playback blocked:", err));
  } else if (bgm.paused) {
    bgm.volume = bgmVolume;
    bgm.play().catch((err) => console.warn("BGM resume error:", err));
  } else {
    bgm.volume = bgmVolume;
  }
};

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
