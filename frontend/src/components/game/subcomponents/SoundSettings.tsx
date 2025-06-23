import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateSoundSettings } from "../../../redux/soundSettingsSlice";
import { RootState } from "../../../redux/store";
import { GoUnmute, GoMute } from "react-icons/go";

const SoundSettings: React.FC = () => {
  const soundSettings = useSelector((state: RootState) => state.soundSettings);
  const dispatch = useDispatch();

  const [overallSound, setOverallSound] = useState<number>(
    soundSettings.overallSound || 100
  );
  const [bgmVolume, setBgmVolume] = useState<number>(
    soundSettings.bgmVolume || 100
  );
  const [sfxVolume, setSfxVolume] = useState<number>(
    soundSettings.sfxVolume || 100
  );

  const [isOverallMuted, setIsOverallMuted] = useState<boolean>(
    overallSound === 0
  );
  const [isBgmMuted, setIsBgmMuted] = useState<boolean>(bgmVolume === 0);
  const [isSfxMuted, setIsSfxMuted] = useState<boolean>(sfxVolume === 0);

  const [lastOverallSound, setLastOverallSound] =
    useState<number>(overallSound);
  const [lastBgmVolume, setLastBgmVolume] = useState<number>(bgmVolume);
  const [lastSfxVolume, setLastSfxVolume] = useState<number>(sfxVolume);

  useEffect(() => {
    setOverallSound(soundSettings.overallSound);
    setBgmVolume(soundSettings.bgmVolume);
    setSfxVolume(soundSettings.sfxVolume);
    setIsOverallMuted(soundSettings.overallSound === 0);
    setIsBgmMuted(soundSettings.bgmVolume === 0);
    setIsSfxMuted(soundSettings.sfxVolume === 0);
  }, [soundSettings]);

  const handleMute = (type: "overall" | "bgm" | "sfx") => {
    if (type === "overall") {
      if (isOverallMuted) {
        setOverallSound(lastOverallSound);
        dispatch(
          updateSoundSettings({
            overallSound: lastOverallSound,
            bgmVolume,
            sfxVolume
          })
        );
      } else {
        setLastOverallSound(overallSound);
        setOverallSound(0);
        dispatch(
          updateSoundSettings({
            overallSound: 0,
            bgmVolume,
            sfxVolume
          })
        );
      }
    } else if (type === "bgm") {
      if (isBgmMuted) {
        setBgmVolume(lastBgmVolume);
        dispatch(
          updateSoundSettings({
            overallSound,
            bgmVolume: lastBgmVolume,
            sfxVolume
          })
        );
      } else {
        setLastBgmVolume(bgmVolume);
        setBgmVolume(0);
        dispatch(
          updateSoundSettings({
            overallSound,
            bgmVolume: 0,
            sfxVolume
          })
        );
      }
    } else if (type === "sfx") {
      if (isSfxMuted) {
        setSfxVolume(lastSfxVolume);
        dispatch(
          updateSoundSettings({
            overallSound,
            bgmVolume,
            sfxVolume: lastSfxVolume
          })
        );
      } else {
        setLastSfxVolume(sfxVolume);
        setSfxVolume(0);
        dispatch(
          updateSoundSettings({
            overallSound,
            bgmVolume,
            sfxVolume: 0
          })
        );
      }
    }
  };

  return (
    <div className="sound-settings">
      <h3>Sound Settings</h3>

      <div className="volume-control">
        <label>Overall Sound</label>
        <div className="volumebar-muteicon">
          <button
            className={isOverallMuted ? "muted" : "unmuted"}
            onClick={() => handleMute("overall")}
          >
            {isOverallMuted ? <GoMute /> : <GoUnmute />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={overallSound}
            onChange={(e) => {
              setOverallSound(Number(e.target.value));
              dispatch(
                updateSoundSettings({
                  overallSound: Number(e.target.value),
                  bgmVolume,
                  sfxVolume
                })
              );
            }}
          />
        </div>
        <span>{overallSound}%</span>
      </div>

      <div className="volume-control">
        <label>BGM Volume</label>
        <div className="volumebar-muteicon">
          <button
            className={isBgmMuted ? "muted" : "unmuted"}
            onClick={() => handleMute("bgm")}
          >
            {isBgmMuted ? <GoMute /> : <GoUnmute />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={bgmVolume}
            onChange={(e) => {
              setBgmVolume(Number(e.target.value));
              dispatch(
                updateSoundSettings({
                  overallSound,
                  bgmVolume: Number(e.target.value),
                  sfxVolume
                })
              );
            }}
          />
        </div>
        <span>{bgmVolume}%</span>
      </div>

      <div className="volume-control">
        <label>SFX Volume</label>
        <div className="volumebar-muteicon">
          <button
            className={isSfxMuted ? "muted" : "unmuted"}
            onClick={() => handleMute("sfx")}
          >
            {isSfxMuted ? <GoMute /> : <GoUnmute />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={sfxVolume}
            onChange={(e) => {
              setSfxVolume(Number(e.target.value));
              dispatch(
                updateSoundSettings({
                  overallSound,
                  bgmVolume,
                  sfxVolume: Number(e.target.value)
                })
              );
            }}
          />
        </div>
        <span>{sfxVolume}%</span>
      </div>
    </div>
  );
};

export default SoundSettings;
