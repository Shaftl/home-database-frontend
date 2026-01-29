"use client";

import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

/**
 * ProtectedClient
 *
 * Usage:
 * 1) Simple protect a page:
 *    <ProtectedClient>
 *      <YourProtectedContent />
 *    </ProtectedClient>
 *
 * 2) Require certain roles:
 *    <ProtectedClient allowedRoles={['adminA','adminB']}>
 *      <AdminOnlyContent />
 *    </ProtectedClient>
 *
 * Behavior:
 * - Waits for the Redux auth state (ClientProviders already runs initAuth in layout).
 * - While auth.status === 'loading' returns null (avoid flicker / redirect races).
 * - If user is null after init -> redirect to `redirectTo` (default '/auth/login').
 * - If allowedRoles passed and user.role not in allowedRoles -> redirect to `redirectToRoleDenied` or default '/forbidden'.
 *
 * Note: don't render server-only data behind this client wrapper — use it inside server components/pages.
 */

export default function ProtectedClient({
  children,
  redirectTo = "/login",
  redirectToRoleDenied = "/forbidden",
  allowedRoles = null, // e.g. ['adminA','adminB']
}) {
  const router = useRouter();
  const user = useSelector((s) => (s.auth ? s.auth.user : null));
  const status = useSelector((s) => (s.auth ? s.auth.status : "idle"));
  // status values in your slice: "idle"|"loading"|"ready" etc.

  useEffect(() => {
    // while auth init is running, do nothing (ClientProviders makes sure initAuth runs on layout)
    if (status === "loading") return;

    // if init finished and user not present -> redirect to login
    if (status !== "loading" && !user) {
      // replace so user can't go back to protected page
      router.replace(redirectTo);
      return;
    }

    // if roles required and user present, but role doesn't match -> redirect
    if (user && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        router.replace(redirectToRoleDenied);
        return;
      }
    }
    // otherwise do nothing; children will render
  }, [status, user, allowedRoles, router, redirectTo, redirectToRoleDenied]);

  // don't render children while checking
  if (status === "loading") return null;
  if (!user) return null;
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) return null;
  }

  return <>{children}</>;
}
