import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SoundSettingsState {
  overallSound: number;
  bgmVolume: number;
  sfxVolume: number;
}

const initialState: SoundSettingsState = {
  overallSound: 100,
  bgmVolume: 100,
  sfxVolume: 100
};

const soundSettingsSlice = createSlice({
  name: "soundSettings",
  initialState,
  reducers: {
    updateSoundSettings(state, action: PayloadAction<SoundSettingsState>) {
      console.log("UPDATING SOUND SETTINGS", action.payload);
      state.overallSound = action.payload.overallSound;
      state.bgmVolume = action.payload.bgmVolume;
      state.sfxVolume = action.payload.sfxVolume;
    }
  }
});

export const { updateSoundSettings } = soundSettingsSlice.actions;

export default soundSettingsSlice.reducer;
