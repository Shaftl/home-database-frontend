"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPendingList,
  decideExpense,
} from "../../../store/slices/personalExpensesSlice";
import styles from "./page.module.css";
import api from "../../../lib/api";
import ProtectedClient from "@/components/ProtectedClient";

export default function AdminPendingPage() {
  const dispatch = useDispatch();
  const { pendingList } = useSelector((s) => s.personal || { pendingList: [] });
  const authUser = useSelector((s) => s.auth.user);

  const [loading, setLoading] = useState(false);
  const [activeItem, setActiveItem] = useState(null); // full item object
  const [decisionComment, setDecisionComment] = useState("");
  const [decisionLoadingId, setDecisionLoadingId] = useState(null);
  // new: amount admin chooses when approving
  const [approvedAmount, setApprovedAmount] = useState("");

  useEffect(() => {
    dispatch(fetchPendingList());
  }, [dispatch]);

  if (
    !authUser ||
    !["adminA", "adminB", "superadmin"].includes(authUser.role)
  ) {
    return (
      <div className={styles.container}>Forbidden — admin access only</div>
    );
  }

  const openReview = (item) => {
    setActiveItem(item);
    setDecisionComment("");
    setApprovedAmount(""); // reset when opening
  };

  const closeReview = () => {
    setActiveItem(null);
    setDecisionComment("");
    setApprovedAmount("");
  };

  const handleDecide = async (decision) => {
    if (!activeItem) return;
    if (decision === "reject" && !decisionComment.trim()) {
      if (!confirm("Reject without a comment?")) return;
    }

    // require approvedAmount for approve
    if (decision === "approve") {
      if (approvedAmount === "" || approvedAmount === null) {
        alert("You must enter an approved amount before approving.");
        return;
      }
      if (Number.isNaN(Number(approvedAmount))) {
        alert("Approved amount must be a valid number.");
        return;
      }
    }

    setDecisionLoadingId(activeItem._id);
    try {
      await dispatch(
        decideExpense({
          id: activeItem._id,
          decision,
          comment: decisionComment || "",
          // pass approved_amount to match backend contract:
          approved_amount:
            decision === "approve" ? Number(approvedAmount) : null,
        })
      ).unwrap();
      alert(`Successfully ${decision}ed`);
      await dispatch(fetchPendingList());
      closeReview();
    } catch (err) {
      console.error(err);
      alert(err.message || "Decision failed");
    } finally {
      setDecisionLoadingId(null);
    }
  };

  return (
    <ProtectedClient>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.pageTitle}>Pending Approvals</h2>
        </header>

        {pendingList.length === 0 && (
          <div className={styles.emptyMsg}>No pending items</div>
        )}

        <div className={styles.list}>
          {pendingList.map((it) => (
            <div key={it._id} className={`${styles.card} ${styles.withMargin}`}>
              <div className={styles.cardInner}>
                <div className={styles.cardLeft}>
                  <span className={styles.cardTitle}>{it.title}</span>
                  <div className={styles.small}>
                    by {it.user?.display_name || it.user?.username}
                  </div>

                  <div className={styles.note}>{it.description}</div>

                  {it.attachments && it.attachments.length > 0 && (
                    <div className={styles.attachments}>
                      <strong>Attachments</strong>
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
                    <div>
                      min:{" "}
                      <span className={styles.amountValue}>
                        {it.amount_min}
                      </span>{" "}
                      / avg:{" "}
                      <span className={styles.amountValue}>
                        {it.amount_avg}
                      </span>{" "}
                      / max:{" "}
                      <span className={styles.amountValue}>
                        {it.amount_max}
                      </span>
                    </div>
                  </div>

                  <div>
                    <button
                      className={styles.button}
                      onClick={() => openReview(it)}
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>

              {/* Review area */}
              {activeItem && activeItem._id === it._id && (
                <div className={styles.reviewSection}>
                  <h4 className={styles.sectionTitle}>Review: {it.title}</h4>

                  <div className={styles.formRow}>
                    <textarea
                      placeholder="Add comment (optional)"
                      value={decisionComment}
                      onChange={(e) => setDecisionComment(e.target.value)}
                      className={`${styles.inputWide} ${styles.textarea}`}
                    />
                  </div>

                  {/* approved amount input (now required for approve) */}
                  <div className={styles.formRow}>
                    <label className={styles.small}>
                      Approved amount (required for approval)
                    </label>
                    <input
                      type="number"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      placeholder="Enter number (e.g. 12500)"
                      className={styles.input}
                      style={{ width: 200 }}
                      required={true}
                    />
                  </div>

                  <div className={styles.buttonsRow}>
                    <button
                      className={styles.button}
                      disabled={
                        decisionLoadingId === it._id ||
                        (activeItem &&
                          activeItem._id === it._id &&
                          (approvedAmount === "" ||
                            Number.isNaN(Number(approvedAmount))))
                      }
                      onClick={() => handleDecide("approve")}
                    >
                      Approve
                    </button>

                    <button
                      className={styles.buttonSecondary}
                      disabled={decisionLoadingId === it._id}
                      onClick={() => handleDecide("reject")}
                    >
                      Reject
                    </button>

                    <button
                      className={styles.buttonTertiary}
                      onClick={closeReview}
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
