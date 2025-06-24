import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import lobbyReducer from "./lobbySlice";
import soundSettingsReducer from "./soundSettingsSlice";
import { Middleware } from "redux";

const loadUserState = () => {
  const user = localStorage.getItem("user");
  const soundSettings = localStorage.getItem("soundSettings");

  return {
    user: user
      ? JSON.parse(user)
      : {
          username: undefined,
          email: undefined,
          verified: false,
          isAuthenticated: false,
          role: undefined
        },
    soundSettings: soundSettings
      ? JSON.parse(soundSettings)
      : { overallSound: 100, bgmVolume: 100, sfxVolume: 100 }
  };
};

const saveUserState: Middleware = (storeAPI) => (next) => (action) => {
  const result = next(action);
  const state = storeAPI.getState();

  localStorage.setItem("user", JSON.stringify(state.user));
  localStorage.setItem("soundSettings", JSON.stringify(state.soundSettings));

  return result;
};

const store = configureStore({
  reducer: {
    user: userReducer,
    lobby: lobbyReducer,
    soundSettings: soundSettingsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(saveUserState),
  preloadedState: loadUserState()
});

export type RootState = ReturnType<typeof store.getState>;

export default store;
