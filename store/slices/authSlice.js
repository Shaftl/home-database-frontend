// frontend/store/slices/authSlice.js
"use client";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api, { setAccessToken } from "../../lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// register (همان قبلی)
export const registerUser = createAsyncThunk(
  "auth/register",
  async (data, thunkAPI) => {
    const res = await axios.post(`${API}/api/auth/register`, data, {
      withCredentials: true,
    });
    return res.data;
  }
);

// login (همان قبلی) — بعد از لاگین، token را ست می‌کنیم
export const loginUser = createAsyncThunk(
  "auth/login",
  async (data, thunkAPI) => {
    const res = await axios.post(`${API}/api/auth/login`, data, {
      withCredentials: true,
    });
    return res.data;
  }
);

// refreshToken (برای صدا زدن مستقیم، اما initAuth از این استفاده می‌کند)
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

// initAuth: وقتی اپ لود می‌شه (در layout) اجرا کن — تلاش می‌کنه کوکی refresh رو بخونه و accessToken بگیره
export const initAuth = createAsyncThunk("auth/init", async (_, thunkAPI) => {
  try {
    const res = await axios.post(
      `${API}/api/auth/refresh`,
      {},
      { withCredentials: true }
    );
    return res.data; // { accessToken, user }
  } catch (err) {
    return thunkAPI.rejectWithValue(null);
  }
});

// logout thunk: تماس به backend برای پاک کردن کوکی و پاک کردن state
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, thunkAPI) => {
    try {
      await axios.post(`${API}/api/auth/logout`, {}, { withCredentials: true });
      return {};
    } catch (err) {
      return {};
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, accessToken: null, status: "idle", error: null },
  reducers: {
    // local setter اگر لازم داشته باشی
    setLocalAccessToken(state, action) {
      state.accessToken = action.payload;
      setAccessToken(action.payload); // update api instance
    },
    setLocalUser(state, action) {
      state.user = action.payload;
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
        setAccessToken(action.payload.accessToken);
      })
      .addCase(initAuth.pending, (state) => {
        state.status = "loading";
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.status = "ready";
        if (action.payload && action.payload.accessToken) {
          state.accessToken = action.payload.accessToken;
          state.user = action.payload.user || action.payload.user;
          setAccessToken(action.payload.accessToken);
        } else {
          state.user = null;
          state.accessToken = null;
          setAccessToken(null);
        }
      })
      .addCase(initAuth.rejected, (state) => {
        state.status = "idle";
        state.user = null;
        state.accessToken = null;
        setAccessToken(null);
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        if (action.payload && action.payload.accessToken) {
          state.accessToken = action.payload.accessToken;
          state.user = action.payload.user || state.user;
          setAccessToken(action.payload.accessToken);
        }
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = "idle";
        setAccessToken(null);
      })
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          // generic error capture
          state.error = action.error ? action.error.message : null;
        }
      );
  },
});

export const { setLocalAccessToken, setLocalUser } = authSlice.actions;
export default authSlice.reducer;
