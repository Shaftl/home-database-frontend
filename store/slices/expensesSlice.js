"use client";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api";

// fetch public expense entries with optional filters
export const fetchExpenses = createAsyncThunk(
  "expenses/fetch",
  async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await api.get(`/api/expenses${qs ? `?${qs}` : ""}`);
    return res.data.items;
  }
);

// create expense (public or allowed)
export const createExpense = createAsyncThunk(
  "expenses/create",
  async (payload) => {
    const res = await api.post("/api/expenses", payload);
    return res.data.item;
  }
);

// fetch approved personal expenses (status=approved)
export const fetchApproved = createAsyncThunk(
  "expenses/fetchApproved",
  async (params = {}) => {
    const qs = new URLSearchParams({
      status: "approved",
      ...params,
    }).toString();
    const res = await api.get(`/api/personal-expenses${qs ? `?${qs}` : ""}`);
    return res.data.items;
  }
);

const slice = createSlice({
  name: "expenses",
  initialState: { list: [], approved: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload;
      })
      .addCase(fetchExpenses.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      })

      .addCase(createExpense.fulfilled, (s, a) => {
        s.list.unshift(a.payload);
      })

      .addCase(fetchApproved.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchApproved.fulfilled, (s, a) => {
        s.loading = false;
        s.approved = a.payload;
      })
      .addCase(fetchApproved.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      });
  },
});

export default slice.reducer;
