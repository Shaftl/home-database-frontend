"use client";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { registerUser } from "../../store/slices/authSlice";
import styles from "../../components/AuthForm.module.css";
import Link from "next/link";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    display_name: "",
    email: "",
    password: "",
  });
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(registerUser(form))
      .unwrap()
      .catch((err) => alert(err.message || "Error"));
    alert("Registered - now login");
  };

  return (
    <div className={styles.container}>
      <h2>Register</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          placeholder="username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          className={styles.input}
          placeholder="display name"
          value={form.display_name}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
        />
        <input
          className={styles.input}
          placeholder="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className={styles.input}
          type="password"
          placeholder="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <Link href={"/login"} className={styles.link}>
          Already have an account? Login
        </Link>

        <button className={styles.button} type="submit">
          Register
        </button>
      </form>
    </div>
  );
}
