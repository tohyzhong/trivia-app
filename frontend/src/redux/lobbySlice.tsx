import { createSlice } from "@reduxjs/toolkit";

interface LobbyState {
  lobbyId: string | null;
  categories: string[] | null;
  currency: number;
  powerups: {
    hintBoosts: number;
    addTimes: number;
    doublePoints: number;
  };
  status: string;
  hintRevealed: number[] | string;
}

const initialState: LobbyState = {
  lobbyId: null,
  categories: null,
  currency: 0,
  powerups: {
    hintBoosts: 0,
    addTimes: 0,
    doublePoints: 0
  },
  status: "",
  hintRevealed: []
};

const lobbySlice = createSlice({
  name: "lobby",
  initialState,
  reducers: {
    setLobby: (state, action) => {
      state.lobbyId = action.payload.lobbyId;
      state.categories = action.payload.categories;
      state.currency = action.payload.currency ?? 0;
      state.powerups = {
        hintBoosts: action.payload.powerups.hintBoosts ?? 0,
        addTimes: action.payload.powerups.addTimes ?? 0,
        doublePoints: action.payload.powerups.doublePoints ?? 0
      };
      state.status = action.payload.status ?? "";
    },
    setCurrency: (state, action) => {
      state.currency = action.payload;
    },
    setPowerups: (state, action) => {
      state.powerups = {
        hintBoosts: action.payload.hintBoosts ?? 0,
        addTimes: action.payload.addTimes ?? 0,
        doublePoints: action.payload.doublePoints ?? 0
      };
    },
    setStatusRedux: (state, action) => {
      state.status = action.payload;
    },
    setHintRevealed: (state, action) => {
      state.hintRevealed = action.payload;
    },
    resetHintRevealed: (state) => {
      state.hintRevealed = [];
    },
    clearLobby: (state) => {
      state.lobbyId = null;
      state.categories = null;
    }
  }
});

export const {
  setLobby,
  setCurrency,
  setPowerups,
  setStatusRedux,
  setHintRevealed,
  resetHintRevealed,
  clearLobby
} = lobbySlice.actions;

export default lobbySlice.reducer;
