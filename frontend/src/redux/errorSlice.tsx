import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ErrorState {
  errorMessage: string | null;
  success: boolean | null;
  timestamp: number | null;
}

interface ErrorStatePayload {
  errorMessage: string | null;
  success: boolean | null;
}

const initialState: ErrorState = {
  errorMessage: null,
  success: null,
  timestamp: 0
};

const errorSlice = createSlice({
  name: "error",
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<ErrorStatePayload>) => {
      state.errorMessage = action.payload.errorMessage;
      state.success = action.payload.success;
      state.timestamp = Date.now();
    },
    clearError: (state) => {
      state.errorMessage = null;
      state.success = null;
      state.timestamp = 0;
    }
  }
});

export const { setError, clearError } = errorSlice.actions;

export default errorSlice.reducer;
