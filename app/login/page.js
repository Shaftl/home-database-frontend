"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../store/slices/authSlice";
import styles from "../../components/AuthForm.module.css";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [form, setForm] = useState({ usernameOrEmail: "", password: "" });
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const user = useSelector((state) => state.auth.user);
  const status = useSelector((s) => s.auth.status);

  // Only redirect AFTER auth init finished AND only if we're not already on /login.
  // Use replace to avoid polluting history.
  useEffect(() => {
    if (status === "ready" && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [status, user, pathname, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(loginUser(form)).unwrap();
      router.push("/");
    } catch (err) {
      alert(err.message || "Login failed");
    }
  };

  return (
    <div className={styles.container}>
      <h2>Login</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          placeholder="username or email"
          value={form.usernameOrEmail}
          onChange={(e) =>
            setForm({ ...form, usernameOrEmail: e.target.value })
          }
        />
        <input
          className={styles.input}
          type="password"
          placeholder="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <Link href={"/register"} className={styles.link}>
          Don't have an account? Create account
        </Link>

        <button className={styles.button} type="submit">
          Login
        </button>
      </form>
    </div>
  );
}
