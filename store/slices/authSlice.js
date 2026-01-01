"use client";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const registerUser = createAsyncThunk(
  "auth/register",
  async (data, thunkAPI) => {
    const res = await axios.post(`${API}/api/auth/register`, data, {
      withCredentials: true,
    });
    return res.data;
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (data, thunkAPI) => {
    const res = await axios.post(`${API}/api/auth/login`, data, {
      withCredentials: true,
    });
    return res.data;
  }
);

export const refreshToken = createAsyncThunk(
  "auth/refresh",
  async (_, thunkAPI) => {
    const res = await axios.post(
      `${API}/api/auth/refresh`,
      {},
      { withCredentials: true }
    );
    return res.data;
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, accessToken: null, status: "idle", error: null },
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "registered";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "loggedin";
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
      })
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.error = action.error.message;
        }
      );
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
