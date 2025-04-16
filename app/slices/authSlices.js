import { createSlice } from '@reduxjs/toolkit';

// Initial state structure for the auth slice
const initialState = {
  token: null,
  userData: null,
  didTryAutoLogin: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authenticate: (state, action) => {
      const { token, userData } = action.payload;
      state.token = token;
      state.userData = userData;
      state.didTryAutoLogin = true;
    },
    setDidTryAutoLogin: (state) => {
      state.didTryAutoLogin = true;
    },
    logout: (state) => {
      state.token = null;
      state.userData = null;
      state.didTryAutoLogin = false;
    },
    updateProfile: (state, action) => {
      if (state.userData) {
        state.userData = {
          ...state.userData,
          ...action.payload, // Update the user data with the provided payload
        };
      }
    },
  },
});

export const { authenticate, setDidTryAutoLogin, logout, updateProfile } = authSlice.actions;

export default authSlice.reducer;
