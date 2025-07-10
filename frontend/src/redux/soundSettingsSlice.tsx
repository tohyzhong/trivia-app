import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SoundSettingsState {
  overallSound: number;
  bgmVolume: number;
  sfxVolume: number;
  profanityEnabled: boolean;
}

const initialState: SoundSettingsState = {
  overallSound: 100,
  bgmVolume: 100,
  sfxVolume: 100,
  profanityEnabled: false
};

const soundSettingsSlice = createSlice({
  name: "soundSettings",
  initialState,
  reducers: {
    updateSoundSettings(state, action: PayloadAction<SoundSettingsState>) {
      state.overallSound = action.payload.overallSound;
      state.bgmVolume = action.payload.bgmVolume;
      state.sfxVolume = action.payload.sfxVolume;
      state.profanityEnabled = action.payload.profanityEnabled;
    }
  }
});

export const { updateSoundSettings } = soundSettingsSlice.actions;

export default soundSettingsSlice.reducer;
