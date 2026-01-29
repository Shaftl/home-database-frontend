// NewPersonal.jsx
"use client";

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { createPersonalExpense } from "../../../store/slices/personalExpensesSlice";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import ProtectedClient from "@/components/ProtectedClient";

export default function NewPersonal() {
  const dispatch = useDispatch();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    amount_min: "",
    amount_avg: "",
    amount_max: "",
    requested_amount: "",
    start_date: "",
    end_date: "",
  });
  const [files, setFiles] = useState([]); // FileList -> array
  const [loading, setLoading] = useState(false);

  const handleChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleFiles = (e) => {
    const f = Array.from(e.target.files || []);
    setFiles(f);
  };

  const uploadFiles = async () => {
    // returns array of file metadata objects from backend (or [])
    if (!files || files.length === 0) return [];
    const uploaded = [];
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f);
      // important: do NOT set Content-Type header here, let axios set boundary
      const res = await api.post("/api/upload", fd);
      // res.data.file => { filename, originalname, mime, size, path }
      if (res && res.data && res.data.file) uploaded.push(res.data.file);
    }
    return uploaded;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // basic validation
    if (
      !form.title ||
      !form.amount_min ||
      !form.amount_avg ||
      !form.amount_max
    ) {
      alert("Title and min/avg/max are required");
      return;
    }
    setLoading(true);
    try {
      // upload attachments first
      let attachments = [];
      try {
        attachments = await uploadFiles();
      } catch (uerr) {
        console.error("Upload failed", uerr);
        alert("File upload failed. Try again.");
        setLoading(false);
        return;
      }

      const payload = {
        title: form.title,
        description: form.description,
        amount_min: Number(form.amount_min),
        amount_avg: Number(form.amount_avg),
        amount_max: Number(form.amount_max),
        requested_amount: form.requested_amount
          ? Number(form.requested_amount)
          : undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        attachments,
        // IMPORTANT: set personal expense category automatically
        category: "مصارف شخصی",
      };

      await dispatch(createPersonalExpense(payload)).unwrap();
      alert("Created (draft). You can submit from My Requests.");
      router.push("/personal/my-requests");
    } catch (err) {
      console.error(err);
      alert((err && err.message) || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedClient>
      <div className={styles.container}>
        <h2 className={styles.pageTitle}>New Personal Request</h2>

        <div className={styles.card}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              className={styles.input}
              placeholder="Title"
              value={form.title}
              onChange={handleChange("title")}
            />

            <textarea
              className={`${styles.textarea} ${styles.inputWide}`}
              placeholder="Description"
              value={form.description}
              onChange={handleChange("description")}
            />

            <div className={styles.row}>
              <input
                className={`${styles.input} ${styles.smallField}`}
                placeholder="min"
                value={form.amount_min}
                onChange={handleChange("amount_min")}
              />
              <input
                className={`${styles.input} ${styles.smallField}`}
                placeholder="avg"
                value={form.amount_avg}
                onChange={handleChange("amount_avg")}
              />
              <input
                className={`${styles.input} ${styles.smallField}`}
                placeholder="max"
                value={form.amount_max}
                onChange={handleChange("amount_max")}
              />
            </div>

            <input
              className={styles.input}
              placeholder="requested amount (optional)"
              value={form.requested_amount}
              onChange={handleChange("requested_amount")}
            />

            <div className={styles.row}>
              <input
                className={`${styles.input} ${styles.smallField}`}
                type="date"
                value={form.start_date}
                onChange={handleChange("start_date")}
              />
              <input
                className={`${styles.input} ${styles.smallField}`}
                type="date"
                value={form.end_date}
                onChange={handleChange("end_date")}
              />
            </div>

            <div className={styles.formRow} style={{ display: "none" }}>
              <label className={styles.label}>
                Attach invoices / receipts (jpg, png, pdf) — max 5MB each
              </label>
              <input
                className={styles.fileInput}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleFiles}
              />

              {files.length > 0 && (
                <div className={styles.filesList}>
                  <strong>Selected files:</strong>
                  <ul>
                    {files.map((f, i) => (
                      <li key={i} className={styles.fileItem}>
                        {f.name} — {(f.size / 1024).toFixed(1)} KB
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className={styles.actionsRow}>
              <button
                className={styles.button}
                type="submit"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Draft"}
              </button>

              <button
                className={`${styles.button} ${styles.buttonSecondary}`}
                type="button"
                onClick={() => (window.location.href = "/personal/my-requests")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedClient>
  );
}
