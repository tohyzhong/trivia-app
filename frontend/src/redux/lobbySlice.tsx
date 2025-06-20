import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LobbyState {
  lobbyId: string | null;
  categories: string[] | null;
}

const initialState: LobbyState = {
  lobbyId: null,
  categories: null
};

const lobbySlice = createSlice({
  name: "lobby",
  initialState,
  reducers: {
    setLobby: (state, action: PayloadAction<LobbyState>) => {
      state.lobbyId = action.payload.lobbyId;
      state.categories = action.payload.categories;
    },
    clearLobby: (state) => {
      state.lobbyId = null;
      state.categories = null;
    }
  }
});

export const { setLobby, clearLobby } = lobbySlice.actions;

export default lobbySlice.reducer;
