// components/ClientProviders.jsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { Provider, useDispatch } from "react-redux";
import { store } from "@/store/store";
import { initAuth } from "@/store/slices/authSlice";

/**
 * InitAuthInner runs inside the Provider so it can dispatch and read store if needed.
 * It dispatches initAuth() once and waits for it to settle before rendering children.
 * This prevents other client code from seeing "not yet initialized" and redirecting.
 */
function InitAuthInner({ children }) {
  const dispatch = useDispatch();
  const [initialized, setInitialized] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // dispatch and wait for result; always mark initialized (success or failure)
    dispatch(initAuth())
      .unwrap()
      .catch(() => {
        /* ignore errors; we'll still render children and let pages handle unauthenticated state */
      })
      .finally(() => setInitialized(true));
  }, [dispatch]);

  // While the refresh is pending, don't render children (avoids redirect race)
  if (!initialized) {
    // lightweight placeholder: keeps page from redirecting while auth refresh runs.
    // You can replace with a spinner / skeleton if you want visual feedback.
    return null;
  }

  return <>{children}</>;
}

export default function ClientProviders({ children }) {
  return (
    <Provider store={store}>
      <InitAuthInner>{children}</InitAuthInner>
    </Provider>
  );
}
