"use client";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import personalReducer from "./slices/personalExpensesSlice";
import incomesReducer from "./slices/incomesSlice";
import expensesReducer from "./slices/expensesSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    personal: personalReducer,
    incomes: incomesReducer,
    expenses: expensesReducer,
  },
});
