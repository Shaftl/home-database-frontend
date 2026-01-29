"use client";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api";

export const createPersonalExpense = createAsyncThunk(
  "personal/create",
  async (payload, thunkAPI) => {
    const res = await api.post("/api/personal-expenses", payload);
    return res.data.item;
  }
);

export const fetchMyExpenses = createAsyncThunk(
  "personal/fetchMy",
  async (_, thunkAPI) => {
    const res = await api.get("/api/personal-expenses");
    return res.data.items;
  }
);

export const fetchExpenseById = createAsyncThunk(
  "personal/fetchById",
  async (id, thunkAPI) => {
    const res = await api.get(`/api/personal-expenses/${id}`);
    return res.data.item || null;
  }
);

// submit (owner)
export const submitExpense = createAsyncThunk(
  "personal/submit",
  async (id, thunkAPI) => {
    const res = await api.post(`/api/personal-expenses/${id}/submit`);
    return res.data.item;
  }
);

// update (owner, only draft)
export const updateExpense = createAsyncThunk(
  "personal/update",
  async ({ id, payload }, thunkAPI) => {
    const res = await api.put(`/api/personal-expenses/${id}`, payload);
    return res.data.item;
  }
);

// cancel (owner)
export const cancelExpense = createAsyncThunk(
  "personal/cancel",
  async (id, thunkAPI) => {
    const res = await api.post(`/api/personal-expenses/${id}/cancel`);
    return res.data.item;
  }
);

// admin approve/reject
export const decideExpense = createAsyncThunk(
  "personal/decide",
  async ({ id, decision, comment, approved_amount }, thunkAPI) => {
    // ensure payload includes approved_amount when approving (frontend also validates)
    const body = {
      decision,
      comment,
      // include approved_amount explicitly (can be number or null for reject)
      approved_amount: approved_amount !== undefined ? approved_amount : null,
    };
    const res = await api.post(`/api/personal-expenses/${id}/approve`, body);
    return res.data;
  }
);

// fetch approvals for an expense
export const fetchApprovals = createAsyncThunk(
  "personal/fetchApprovals",
  async (id, thunkAPI) => {
    const res = await api.get(`/api/personal-expenses/${id}/approvals`);
    return res.data.approvals;
  }
);

// fetch pending list (admin)
export const fetchPendingList = createAsyncThunk(
  "personal/fetchPending",
  async (_, thunkAPI) => {
    const res = await api.get("/api/personal-expenses/pending/list");
    return res.data.items;
  }
);

const slice = createSlice({
  name: "personal",
  initialState: {
    myList: [],
    pendingList: [],
    current: null,
    approvals: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrent(state) {
      state.current = null;
      state.approvals = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPersonalExpense.fulfilled, (state, action) => {
        state.myList.unshift(action.payload);
        state.current = action.payload;
      })
      .addCase(fetchMyExpenses.fulfilled, (state, action) => {
        state.myList = action.payload;
      })
      .addCase(fetchPendingList.fulfilled, (state, action) => {
        state.pendingList = action.payload;
      })
      .addCase(fetchApprovals.fulfilled, (state, action) => {
        state.approvals = action.payload;
      })
      .addCase(submitExpense.fulfilled, (state, action) => {
        // update item in myList
        const idx = state.myList.findIndex(
          (i) => String(i._id) === String(action.payload._id)
        );
        if (idx !== -1) state.myList[idx] = action.payload;
        state.current = action.payload;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        const idx = state.myList.findIndex(
          (i) => String(i._id) === String(action.payload._id)
        );
        if (idx !== -1) state.myList[idx] = action.payload;
        state.current = action.payload;
      })
      .addCase(cancelExpense.fulfilled, (state, action) => {
        const idx = state.myList.findIndex(
          (i) => String(i._id) === String(action.payload._id)
        );
        if (idx !== -1) state.myList[idx] = action.payload;
        state.current = action.payload;
      })
      .addCase(decideExpense.fulfilled, (state, action) => {
        // update pending list item if present
        const item = action.payload.item;
        if (item) {
          const idx = state.pendingList.findIndex(
            (i) => String(i._id) === String(item._id)
          );
          if (idx !== -1) state.pendingList[idx] = item;
        }
      })
      .addMatcher(
        (action) =>
          action.type.endsWith("/pending") ||
          action.type.endsWith("/rejected") ||
          (action.type.endsWith("/fulfilled") &&
            action.type.startsWith("personal")),
        (state, action) => {
          // generic matcher left empty — we set loading flags individually as needed
        }
      );
  },
});

export const { clearCurrent } = slice.actions;
export default slice.reducer;
