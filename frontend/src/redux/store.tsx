import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import { Middleware } from 'redux';

const loadUserState = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : { username: '', email: '', verified: false };
};

const saveUserState: Middleware = (storeAPI) => (next) => (action) => {
  const result = next(action);
  const state = storeAPI.getState();
  localStorage.setItem('user', JSON.stringify(state.user));
  return result;
};

const store = configureStore({
  reducer: {
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(saveUserState),
});

export type RootState = ReturnType<typeof store.getState>;

export default store;