"use client";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api";

// fetch incomes with optional from/to
export const fetchIncomes = createAsyncThunk(
  "incomes/fetch",
  async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await api.get(`/api/incomes${qs ? `?${qs}` : ""}`);
    return res.data.items;
  }
);

export const createIncome = createAsyncThunk(
  "incomes/create",
  async (payload) => {
    const res = await api.post("/api/incomes", payload);
    return res.data.item;
  }
);

const slice = createSlice({
  name: "incomes",
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncomes.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchIncomes.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload;
      })
      .addCase(fetchIncomes.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      })
      .addCase(createIncome.fulfilled, (s, a) => {
        s.list.unshift(a.payload);
      });
  },
});

export default slice.reducer;
