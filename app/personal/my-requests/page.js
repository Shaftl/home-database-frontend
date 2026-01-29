// MyRequestsPage.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyExpenses,
  submitExpense,
  updateExpense,
  cancelExpense,
  fetchApprovals,
} from "../../../store/slices/personalExpensesSlice";
import styles from "./MyRequestsPage.module.css";
import api from "../../../lib/api";
import { useRouter } from "next/navigation";
import ProtectedClient from "@/components/ProtectedClient";

export default function MyRequestsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { myList, approvals } = useSelector(
    (s) => s.personal || { myList: [], approvals: [] }
  );
  const authUser = useSelector((s) => s.auth.user);

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // the item being edited (draft)
  const [editForm, setEditForm] = useState({});
  const [loadingActionId, setLoadingActionId] = useState(null);
  const [showApprovalsFor, setShowApprovalsFor] = useState(null);
  const [itemApprovals, setItemApprovals] = useState([]);

  useEffect(() => {
    dispatch(fetchMyExpenses());
  }, [dispatch]);

  const handleEditOpen = (item) => {
    setEditing(item._id);
    setEditForm({
      title: item.title || "",
      description: item.description || "",
      amount_min: item.amount_min || "",
      amount_avg: item.amount_avg || "",
      amount_max: item.amount_max || "",
      requested_amount: item.requested_amount || "",
      start_date: item.start_date ? item.start_date.split("T")[0] : "",
      end_date: item.end_date ? item.end_date.split("T")[0] : "",
      attachments: item.attachments || [],
    });
  };

  const handleEditChange = (k) => (e) =>
    setEditForm({ ...editForm, [k]: e.target.value });

  const handleEditSave = async () => {
    setLoading(true);
    try {
      const payload = {
        title: editForm.title,
        description: editForm.description,
        amount_min: Number(editForm.amount_min),
        amount_avg: Number(editForm.amount_avg),
        amount_max: Number(editForm.amount_max),
        requested_amount: editForm.requested_amount
          ? Number(editForm.requested_amount)
          : undefined,
        start_date: editForm.start_date || undefined,
        end_date: editForm.end_date || undefined,
        attachments: editForm.attachments || [],
      };
      await dispatch(updateExpense({ id: editing, payload })).unwrap();
      await dispatch(fetchMyExpenses());
      setEditing(null);
      alert("Saved");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (id) => {
    if (!confirm("Submit this request for approval?")) return;
    setLoadingActionId(id);
    try {
      await dispatch(submitExpense(id)).unwrap();
      await dispatch(fetchMyExpenses());
      alert("Submitted — admins notified");
    } catch (err) {
      console.error(err);
      alert(err.message || "Submit failed");
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this request?")) return;
    setLoadingActionId(id);
    try {
      await dispatch(cancelExpense(id)).unwrap();
      await dispatch(fetchMyExpenses());
      alert("Cancelled");
    } catch (err) {
      console.error(err);
      alert(err.message || "Cancel failed");
    } finally {
      setLoadingActionId(null);
    }
  };

  const openApprovals = async (id) => {
    setShowApprovalsFor(id);
    setItemApprovals([]);
    try {
      const res = await dispatch(fetchApprovals(id)).unwrap();
      setItemApprovals(res || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load approvals");
    }
  };

  return (
    <ProtectedClient>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.pageTitle}>My Personal Requests</h2>
          <div>
            <button
              className={styles.button}
              onClick={() => router.push("/personal/new")}
            >
              New Request
            </button>
          </div>
        </header>

        {myList.length === 0 && (
          <div className={styles.emptyMsg}>No requests yet</div>
        )}

        <div className={styles.list}>
          {myList.map((it) => (
            <div key={it._id} className={`${styles.card} ${styles.withMargin}`}>
              <div className={styles.cardInner}>
                <div className={styles.cardLeft}>
                  <span className={styles.cardTitle}>{it.title}</span>
                  <div className={styles.small}>
                    status: {it.status}{" "}
                    {it.approvals_count
                      ? ` — ${it.approvals_count} approvals`
                      : ""}
                  </div>

                  <div className={styles.note}>{it.description}</div>

                  {it.attachments && it.attachments.length > 0 && (
                    <div className={styles.attachments}>
                      <strong>Attachments:</strong>
                      <ul>
                        {it.attachments.map((a, idx) => (
                          <li key={idx}>
                            <a
                              href={a.path}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.viewLink}
                            >
                              {a.originalname || a.filename}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className={styles.cardRight}>
                  <div className={styles.amountBlock}>
                    <strong>min</strong>{" "}
                    <span className={styles.amountValue}>{it.amount_min}</span>{" "}
                    | <strong>avg</strong>{" "}
                    <span className={styles.amountValue}>{it.amount_avg}</span>{" "}
                    | <strong>max</strong>{" "}
                    <span className={styles.amountValue}>{it.amount_max}</span>
                  </div>

                  <div className={styles.actionsBlock}>
                    {it.status === "draft" && (
                      <>
                        <button
                          className={styles.buttonSecondary}
                          onClick={() => handleEditOpen(it)}
                        >
                          Edit
                        </button>
                        <button
                          className={styles.button}
                          disabled={loadingActionId === it._id}
                          onClick={() => handleSubmit(it._id)}
                        >
                          Submit
                        </button>
                        <button
                          className={styles.buttonTertiary}
                          disabled={loadingActionId === it._id}
                          onClick={() => handleCancel(it._id)}
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {it.status === "pending" && (
                      <>
                        <button
                          className={styles.buttonSecondary}
                          onClick={() => openApprovals(it._id)}
                        >
                          View Approvals
                        </button>
                        <div className={styles.small} style={{ marginTop: 8 }}>
                          {it.approvals_count || 0}/{it.required_admins_count}{" "}
                          approved
                        </div>
                      </>
                    )}

                    {it.status === "approved" && (
                      <div className={styles.approvedBlock}>
                        Approved
                        {it.approved_amount != null && (
                          <div className={styles.small}>
                            Approved amount: {it.approved_amount}
                          </div>
                        )}
                      </div>
                    )}

                    {it.status === "rejected" && (
                      <div className={styles.rejectedBlock}>Rejected</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit form inline for draft */}
              {editing === it._id && (
                <div className={styles.reviewSection}>
                  <h4 className={styles.sectionTitle}>Edit draft</h4>
                  <input
                    className={styles.input}
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                  />
                  <textarea
                    className={`${styles.textarea} ${styles.inputWide}`}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                  />

                  <div className={styles.row}>
                    <input
                      className={`${styles.input} ${styles.smallField}`}
                      value={editForm.amount_min}
                      onChange={(e) =>
                        setEditForm({ ...editForm, amount_min: e.target.value })
                      }
                    />
                    <input
                      className={`${styles.input} ${styles.smallField}`}
                      value={editForm.amount_avg}
                      onChange={(e) =>
                        setEditForm({ ...editForm, amount_avg: e.target.value })
                      }
                    />
                    <input
                      className={`${styles.input} ${styles.smallField}`}
                      value={editForm.amount_max}
                      onChange={(e) =>
                        setEditForm({ ...editForm, amount_max: e.target.value })
                      }
                    />
                  </div>

                  <div className={styles.formRow}>
                    <label className={styles.small}>
                      Attachments (existing shown below) — to add new, use New
                      Request flow or re-upload:
                    </label>
                    <ul>
                      {(editForm.attachments || []).map((a, idx) => (
                        <li key={idx}>
                          <a
                            href={a.path}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.viewLink}
                          >
                            {a.originalname || a.filename}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.buttonsRow}>
                    <button
                      className={styles.button}
                      onClick={handleEditSave}
                      disabled={loading}
                    >
                      Save
                    </button>
                    <button
                      className={styles.buttonTertiary}
                      onClick={() => setEditing(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Approvals modal/list */}
              {showApprovalsFor === it._id && (
                <div className={styles.reviewSection}>
                  <h4 className={styles.sectionTitle}>Approvals</h4>
                  {itemApprovals.length === 0 && (
                    <div className={styles.emptyMsg}>
                      No approvals recorded yet
                    </div>
                  )}
                  {itemApprovals.map((a) => (
                    <div key={a._id} className={styles.approvalItem}>
                      <div>
                        <strong>
                          {a.admin_user?.display_name || a.admin_user?.username}
                        </strong>{" "}
                        — {a.decision}
                      </div>
                      <div className={styles.small}>{a.comment}</div>
                      <div className={styles.timestamp}>
                        {new Date(
                          a.decided_at || a.updatedAt || a.createdAt
                        ).toLocaleString()}
                      </div>
                      {a.approved_amount != null && (
                        <div className={styles.approvedAmount}>
                          Approved amount: {a.approved_amount}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className={styles.buttonsRow}>
                    <button
                      className={styles.buttonTertiary}
                      onClick={() => setShowApprovalsFor(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </ProtectedClient>
  );
}
