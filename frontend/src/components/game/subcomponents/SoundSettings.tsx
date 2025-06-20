import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateSoundSettings } from "../../../redux/soundSettingsSlice";
import { RootState } from "../../../redux/store";
import ErrorPopup from "../../authentication/subcomponents/ErrorPopup";

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

  const [successMessage, setSuccessMessage] = useState<string>("");

  const handleSave = () => {
    dispatch(updateSoundSettings({ overallSound, bgmVolume, sfxVolume }));
    setSuccessMessage("Settings Saved.");
  };

  useEffect(() => {
    setOverallSound(soundSettings.overallSound);
    setBgmVolume(soundSettings.bgmVolume);
    setSfxVolume(soundSettings.sfxVolume);
  }, [soundSettings]);

  return (
    <div className="sound-settings">
      <ErrorPopup
        message={successMessage}
        setMessage={setSuccessMessage}
        success={successMessage === "Settings Saved."}
      />
      <h3>Sound Settings</h3>

      <div className="volume-control">
        <label>Overall Sound</label>
        <input
          type="range"
          min="0"
          max="100"
          value={overallSound}
          onChange={(e) => setOverallSound(Number(e.target.value))}
        />
        <span>{overallSound}%</span>
      </div>

      <div className="volume-control">
        <label>BGM Volume</label>
        <input
          type="range"
          min="0"
          max="100"
          value={bgmVolume}
          onChange={(e) => setBgmVolume(Number(e.target.value))}
        />
        <span>{bgmVolume}%</span>
      </div>

      <div className="volume-control">
        <label>SFX Volume</label>
        <input
          type="range"
          min="0"
          max="100"
          value={sfxVolume}
          onChange={(e) => setSfxVolume(Number(e.target.value))}
        />
        <span>{sfxVolume}%</span>
      </div>

      <button className="save-settings" onClick={handleSave}>
        Save Settings
      </button>
    </div>
  );
};

export default SoundSettings;
