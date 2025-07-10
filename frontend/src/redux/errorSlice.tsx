import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ErrorState {
  errorMessage: string | null;
  success: boolean | null;
}

const initialState: ErrorState = {
  errorMessage: null,
  success: null
};

const errorSlice = createSlice({
  name: "error",
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<ErrorState>) => {
      state.errorMessage = action.payload.errorMessage;
      state.success = action.payload.success;
    },
    clearError: (state) => {
      state.errorMessage = null;
      state.success = null;
    }
  }
});

export const { setError, clearError } = errorSlice.actions;

export default errorSlice.reducer;
