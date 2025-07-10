import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LobbyState {
  lobbyId: string | null;
  categories: string[] | null;
  currency: number;
  powerups: {
    hintBoosts: number;
    timeFreezes: number;
    doublePoints: number;
  };
}

const initialState: LobbyState = {
  lobbyId: null,
  categories: null,
  currency: 0,
  powerups: {
    hintBoosts: 0,
    timeFreezes: 0,
    doublePoints: 0
  }
};

const lobbySlice = createSlice({
  name: "lobby",
  initialState,
  reducers: {
    setLobby: (state, action: PayloadAction<LobbyState>) => {
      state.lobbyId = action.payload.lobbyId;
      state.categories = action.payload.categories;
      state.currency = action.payload.currency ?? 0;
      state.powerups = {
        hintBoosts: action.payload.powerups.hintBoosts ?? 0,
        timeFreezes: action.payload.powerups.timeFreezes ?? 0,
        doublePoints: action.payload.powerups.doublePoints ?? 0
      };
    },
    setCurrency: (state, action) => {
      state.currency = action.payload;
    },
    setPowerups: (state, action) => {
      state.powerups = {
        hintBoosts: action.payload.hintBoosts ?? 0,
        timeFreezes: action.payload.timeFreezes ?? 0,
        doublePoints: action.payload.doublePoints ?? 0
      };
    },
    clearLobby: (state) => {
      state.lobbyId = null;
      state.categories = null;
    }
  }
});

export const { setLobby, setCurrency, setPowerups, clearLobby } =
  lobbySlice.actions;

export default lobbySlice.reducer;
