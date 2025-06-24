import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  email: string;
  username: string;
  verified: boolean;
  isAuthenticated?: boolean;
  role?: string;
}

const initialState: UserState = {
  email: "",
  username: "",
  verified: undefined,
  isAuthenticated: undefined,
  role: undefined
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{
        username: string;
        email: string;
        verified: boolean;
        role: string;
      }>
    ) => {
      state.username = action.payload.username;
      state.email = action.payload.email;
      state.verified = action.payload.verified;
      state.isAuthenticated = true;
      state.role = action.payload.role ?? "user";
    },
    logout: (state) => {
      state.username = undefined;
      state.email = undefined;
      state.verified = undefined;
      state.isAuthenticated = undefined;
      state.role = undefined;
    }
  }
});

export const { setUser, logout } = userSlice.actions;

export default userSlice.reducer;
