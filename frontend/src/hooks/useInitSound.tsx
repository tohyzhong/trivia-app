import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { setVolumeLevels, playBGM, stopBGM } from "../utils/soundManager";

export const useInitSound = (mode) => {
  const soundSettings = useSelector((state: RootState) => state.soundSettings);

  useEffect(() => {
    setVolumeLevels({
      overallSound: soundSettings.overallSound,
      bgmVol: soundSettings.bgmVolume,
      sfxVol: soundSettings.sfxVolume
    });
    playBGM(mode);

    return () => stopBGM();
  }, [soundSettings]);
};
