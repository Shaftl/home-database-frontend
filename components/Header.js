// Header.js
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import styles from "./Header.module.css";
import NotificationsBadge from "./NotificationsBadge";
import { logoutUser, setLocalUser } from "@/store/slices/authSlice";
import Link from "next/link";

export default function Header() {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((s) => s.auth.user);
  const [open, setOpen] = useState(false);
  const cardRef = useRef(null);
  const profileRef = useRef(null);

  // Build avatar URL using UI Avatars (no upload required)
  const avatarName = user?.display_name || user?.username || "User";
  const avatarBg = "FCA311"; // matches your .profile bg
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    avatarName,
  )}&background=${avatarBg}&color=000000&size=128&rounded=true`;

  // close card when clicking outside — but ignore clicks on the profile itself
  useEffect(() => {
    function onDocClick(e) {
      if (cardRef.current && cardRef.current.contains(e.target)) return;
      if (profileRef.current && profileRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleSignOut = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (err) {
      // ignore errors for now
    } finally {
      dispatch(setLocalUser(null));
      router.push("/"); // redirect to home/login
    }
  };

  const canSeeAdminLinks =
    user &&
    ["superadmin", "adminA", "adminB"].includes(String(user.role || "").trim());
  const isSuperadmin = user && String(user.role || "") === "superadmin";

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href={"/"}>
          <img src="/logo.png" alt="logo" className={styles.logo} />
        </Link>
        <div className={styles.rightNav}>
          <Link href={"/personal/new"} className={styles.requestBtn}>
            درخواست{" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="#000000"
              id="Plus-Light--Streamline-Phosphor"
              height="16"
              width="16"
            >
              <desc>Plus Light Streamline Icon: https://streamlinehq.com</desc>
              <path
                d="M15.84 8c0 0.276375 -0.22405 0.500425 -0.500425 0.500425H8.500425v6.83915c0 0.385225 -0.41701875 0.62599375 -0.7506375 0.43338125 -0.15483125 -0.08939375 -0.2502125 -0.2546 -0.2502125 -0.43338125V8.500425H0.660425c-0.385225 0 -0.62599375 -0.41701875 -0.43338125 -0.7506375 0.08939375 -0.15483125 0.25459375 -0.2502125 0.43338125 -0.2502125h6.83915V0.660425c0 -0.385225 0.41701875 -0.62599375 0.7506375 -0.43338125 0.15483125 0.08939375 0.2502125 0.25459375 0.2502125 0.43338125v6.83915h6.83915c0.27636875 0.0000125 0.500425 0.22405625 0.500425 0.500425Z"
                strokeWidth="0.0625"
              ></path>
            </svg>
          </Link>

          <NotificationsBadge />

          <div
            className={styles.profile}
            ref={profileRef}
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            role="button"
            aria-haspopup="true"
            aria-expanded={open}
            title={avatarName}
          >
            <img
              src={avatarUrl}
              alt={avatarName}
              className={styles.avatarImg}
            />
          </div>

          {open && (
            <div className={styles.profileCard} ref={cardRef}>
              <div className={styles.cardHeader}>
                <img
                  src={avatarUrl}
                  alt={avatarName}
                  className={styles.cardAvatar}
                />
                <div className={styles.cardTitle}>
                  <div className={styles.name}>
                    {user?.display_name || user?.username || "User"}
                  </div>
                  <div className={styles.username}>
                    @{user?.username || "unknown"}
                  </div>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <strong>Email</strong>
                  <span className={styles.infoValue}>{user?.email || "—"}</span>
                </div>

                <div className={styles.infoRow}>
                  <strong>Role</strong>
                  <span className={styles.infoValue}>
                    {user?.role || "user"}
                  </span>
                </div>

                {/* show admin links for superadmin/adminA/adminB under email */}
                {canSeeAdminLinks && (
                  <div className={styles.adminLinks} role="menu">
                    <div className={styles.adminLinksTitle}>Admin</div>

                    {/* user management only for superadmin */}
                    {isSuperadmin && (
                      <Link
                        href="/admin/users"
                        className={styles.adminLink}
                        onClick={() => setOpen(false)}
                      >
                        User management
                      </Link>
                    )}

                    <Link
                      href="/incomes"
                      className={styles.adminLink}
                      onClick={() => setOpen(false)}
                    >
                      Add Incomes
                    </Link>

                    <Link
                      href="/admin/pending"
                      className={styles.adminLink}
                      onClick={() => setOpen(false)}
                    >
                      Pending approvals
                    </Link>

                    <Link
                      href="/expenses"
                      className={styles.adminLink}
                      onClick={() => setOpen(false)}
                    >
                      Expenses
                    </Link>

                    <Link
                      href="/personal/my-requests"
                      className={styles.adminLink}
                      onClick={() => setOpen(false)}
                    >
                      Personal Requests
                    </Link>
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <button
                  className={styles.signOutBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSignOut();
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
