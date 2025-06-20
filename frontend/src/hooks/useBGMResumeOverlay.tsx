import { useState, useEffect, useCallback } from "react";
import {
  setOnPlaybackBlocked,
  clearOnPlaybackBlocked,
  playBGM
} from "../utils/soundManager";

export const useBGMResumeOverlay = () => {
  const [bgmBlocked, setBgmBlocked] = useState(false);

  const handleResume = useCallback(() => {
    playBGM();
    setBgmBlocked(false);
  }, []);

  useEffect(() => {
    setOnPlaybackBlocked(() => setBgmBlocked(true));
    return () => clearOnPlaybackBlocked();
  }, []);

  return { bgmBlocked, handleResume };
};

export default useBGMResumeOverlay;
