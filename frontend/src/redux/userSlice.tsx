import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  email: string;
  username: string;
  verified: boolean;
}

const initialState: UserState = {
  email: '',
  username: '',
  verified: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ username: string; email: string; verified: boolean }>) => {
      state.username = action.payload.username;
      state.email = action.payload.email;
      state.verified = action.payload.verified;
    },
    logout: (state) => {
      state.username = '';
      state.email = '';
      state.verified = false;
    },
  },
});

export const { setUser, logout } = userSlice.actions;

export default userSlice.reducer;
