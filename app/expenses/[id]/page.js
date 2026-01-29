"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import styles from "./ExpenseDetail.module.css";
import ProtectedClient from "@/components/ProtectedClient";

export default function ExpenseDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!id) {
      setError("No id provided");
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/expenses/${id}`);
        if (!mounted) return;
        setItem(res.data.item || null);
      } catch (err) {
        console.error("Failed to load expense", err);
        if (mounted) {
          setError(err.response?.data?.message || "Failed to load");
          setItem(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.content}>
          <div className={styles.emptyState}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ProtectedClient>
        <div className={styles.dashboard}>
          <div className={styles.content}>
            <div className={styles.errorBox}>
              <div className={styles.errorText}>Error: {error}</div>
              <button className={styles.btn} onClick={() => router.back()}>
                Back
              </button>
            </div>
          </div>
        </div>
      </ProtectedClient>
    );
  }

  if (!item) {
    return (
      <div className={styles.dashboard}>
        <Header />
        <div className={styles.content}>
          <div className={styles.contentBox}>
            <div className={styles.boxInner}>
              <div className={styles.emptyMsg}>Not found</div>
              <button className={styles.btn} onClick={() => router.back()}>
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.content}>
        <main className={styles.main}>
          <section className={styles.request}>
            <header className={styles.requestHeader}>
              <div>
                <h1 className={styles.requestTitle}>{item.title}</h1>
                <div className={styles.requestMeta}>
                  {item.category?.name || "بدون دسته"} •{" "}
                  {item.date ? new Date(item.date).toLocaleDateString() : "-"}
                </div>
              </div>
              <div className={styles.requestTotalWrap}>
                <div className={styles.requestTotal}>
                  {item.actual_amount ?? item.amount_avg ?? "-"}
                </div>
                <div className={styles.requestMinMax}>
                  (min: {item.amount_min ?? "-"} • max: {item.amount_max ?? "-"}
                  )
                </div>
              </div>
            </header>

            <div className={styles.contentBox}>
              <div className={styles.boxInner}>
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Note</h3>
                  <div className={styles.noteText}>{item.note || "—"}</div>
                </div>

                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Metadata</h3>
                  <div className={styles.metadataGrid}>
                    <div>
                      <strong>Created by:</strong>{" "}
                      {item.created_by
                        ? `${
                            item.created_by.display_name ||
                            item.created_by.username
                          } (${item.created_by.username})`
                        : "-"}
                    </div>
                    <div>
                      <strong>Created at:</strong>{" "}
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "-"}
                    </div>
                    <div>
                      <strong>Updated at:</strong>{" "}
                      {item.updatedAt
                        ? new Date(item.updatedAt).toLocaleString()
                        : "-"}
                    </div>
                  </div>
                </div>

                {item.attachments && item.attachments.length > 0 && (
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Attachments</h3>
                    <ul className={styles.attachList}>
                      {item.attachments.map((a, i) => (
                        <li key={i} className={styles.attachItem}>
                          <a
                            className={styles.attachLink}
                            href={a.path || `/uploads/${a.filename}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {a.originalname || a.filename || "attachment"}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={styles.actions}>
                  <button className={styles.btn} onClick={() => router.back()}>
                    Back
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
