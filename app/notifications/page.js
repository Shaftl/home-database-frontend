"use client";
import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import styles from "../../components/Notifications.module.css";
import ProtectedClient from "@/components/ProtectedClient";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/api/notifications");
        if (mounted && res && res.data) {
          setItems(res.data.items || []);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const toggle = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
  };

  const markRead = async () => {
    if (selected.size === 0) return;
    setMarking(true);
    try {
      const ids = Array.from(selected);
      await api.post("/api/notifications/mark-read", { ids });
      setItems((prev) =>
        prev.map((it) => (ids.includes(it._id) ? { ...it, read: true } : it))
      );
      setSelected(new Set());
    } catch (err) {
      console.error("mark-read failed", err);
      alert("Failed to mark read");
    } finally {
      setMarking(false);
    }
  };

  return (
    <ProtectedClient>
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.title}>Notifications</h2>
          <button
            className={styles.actionBtn}
            onClick={markRead}
            disabled={marking || selected.size === 0}
          >
            {marking ? "Marking..." : `Mark ${selected.size} as read`}
          </button>
        </div>

        {loading && <div className={styles.state}>Loading...</div>}
        {!loading && items.length === 0 && (
          <div className={styles.state}>No notifications</div>
        )}

        <div className={styles.list}>
          {items.map((it) => (
            <div
              key={it._id}
              className={`${styles.item} ${it.read ? styles.read : ""}`}
            >
              <input
                className={styles.checkbox}
                type="checkbox"
                checked={selected.has(it._id)}
                onChange={() => toggle(it._id)}
              />

              <div className={styles.content}>
                <div className={styles.topRow}>
                  <div>
                    <div className={styles.itemTitle}>{it.title}</div>
                    <div className={styles.date}>
                      {new Date(it.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {it.link && (
                    <a href={it.link} className={styles.link}>
                      Open
                    </a>
                  )}
                </div>

                {it.body && <div className={styles.body}>{it.body}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProtectedClient>
  );
}
