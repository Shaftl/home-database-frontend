"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyExpenses,
  updateExpense,
  submitExpense,
  fetchApprovals,
  fetchPendingList,
} from "../../../store/slices/personalExpensesSlice";
import styles from "./PersonalDetail.module.css";
import formStyles from "../../../components/PersonalExpenseForm.module.css";
import ProtectedClient from "@/components/ProtectedClient";

export default function PersonalDetail() {
  const pathname = usePathname();
  const id = pathname.split("/").pop();
  const dispatch = useDispatch();
  const router = useRouter();
  const myList = useSelector((s) => s.personal.myList);
  const pendingList = useSelector((s) => s.personal.pendingList);
  const approvals = useSelector((s) => s.personal.approvals);
  const user = useSelector((s) => s.auth.user);
  const [item, setItem] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    (async () => {
      await dispatch(fetchMyExpenses());
      await dispatch(fetchPendingList());
      await dispatch(fetchApprovals(id));
      const found =
        (myList || []).find((i) => String(i._id) === String(id)) ||
        (pendingList || []).find((i) => String(i._id) === String(id));
      if (found) {
        setItem(found);
        setForm({
          title: found.title || "",
          description: found.description || "",
          amount_min: found.amount_min || "",
          amount_avg: found.amount_avg || "",
          amount_max: found.amount_max || "",
          requested_amount: found.requested_amount || "",
          start_date: found.start_date
            ? new Date(found.start_date).toISOString().substr(0, 10)
            : "",
          end_date: found.end_date
            ? new Date(found.end_date).toISOString().substr(0, 10)
            : "",
        });
      } else {
        // try fetch again after list loaded
        const all = await dispatch(fetchMyExpenses())
          .unwrap()
          .catch(() => []);
        const f = (all || []).find((i) => String(i._id) === String(id));
        if (f) {
          setItem(f);
          setForm({
            title: f.title || "",
            description: f.description || "",
            amount_min: f.amount_min || "",
            amount_avg: f.amount_avg || "",
            amount_max: f.amount_max || "",
            requested_amount: f.requested_amount || "",
            start_date: f.start_date
              ? new Date(f.start_date).toISOString().substr(0, 10)
              : "",
            end_date: f.end_date
              ? new Date(f.end_date).toISOString().substr(0, 10)
              : "",
          });
        }
      }
    })();
  }, [dispatch, id]);

  useEffect(() => {
    dispatch(fetchApprovals(id));
  }, [dispatch, id]);

  if (!item) return <div className={styles.loading}>Loading...</div>;

  const handleChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSave = async () => {
    try {
      await dispatch(
        updateExpense({
          id,
          payload: {
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
          },
        })
      ).unwrap();
      alert("Saved");
      setEditing(false);
      await dispatch(fetchMyExpenses());
    } catch (err) {
      alert(err.message || "Error");
    }
  };

  const handleSubmit = async () => {
    if (!confirm("Submit for approval?")) return;
    try {
      await dispatch(submitExpense(id)).unwrap();
      alert("Submitted");
      await dispatch(fetchMyExpenses());
      setItem({ ...item, status: "pending" });
    } catch (err) {
      alert(err.message || "Error");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "draft":
        return `${styles.statusBadge} ${styles.statusDraft}`;
      case "pending":
        return `${styles.statusBadge} ${styles.statusPending}`;
      case "approved":
        return `${styles.statusBadge} ${styles.statusApproved}`;
      default:
        return styles.statusBadge;
    }
  };

  return (
    <ProtectedClient>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.titlePrefix}>Expense Details:</span>
            {item.title}
          </h1>
        </div>

        <div className={styles.detailCard}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Owner</span>
                <span className={styles.infoValue}>
                  {item.user && item.user.display_name
                    ? item.user.display_name
                    : item.user && item.user.username}
                </span>
              </div>
            </div>
            <div className={getStatusBadgeClass(item.status)}>
              {item.status}
            </div>
          </div>

          {!editing ? (
            <>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Description</span>
                  <span className={styles.infoValue}>{item.description}</span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Requested Amount</span>
                  <span className={styles.infoValueStrong}>
                    {item.requested_amount || "-"}
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Period</span>
                  <span className={styles.infoValue}>
                    {item.start_date
                      ? new Date(item.start_date).toLocaleDateString()
                      : "-"}
                    {" → "}
                    {item.end_date
                      ? new Date(item.end_date).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
              </div>

              <div className={styles.amountGrid}>
                <div className={`${styles.amountItem} ${styles.amountMin}`}>
                  <div className={styles.amountLabel}>Minimum</div>
                  <div className={styles.amountValue}>{item.amount_min}</div>
                </div>
                <div className={`${styles.amountItem} ${styles.amountAvg}`}>
                  <div className={styles.amountLabel}>Average</div>
                  <div className={styles.amountValue}>{item.amount_avg}</div>
                </div>
                <div className={`${styles.amountItem} ${styles.amountMax}`}>
                  <div className={styles.amountLabel}>Maximum</div>
                  <div className={styles.amountValue}>{item.amount_max}</div>
                </div>
              </div>

              {item.status === "approved" && item.approved_amount != null && (
                <div className={styles.approvedAmount}>
                  <div className={styles.approvedAmountLabel}>
                    Final Approved Amount
                  </div>
                  <div className={styles.approvedAmountValue}>
                    {item.approved_amount}
                  </div>
                </div>
              )}

              {String(item.user && (item.user._id || item.user)) ===
                String((user && user.id) || (user && user._id)) &&
                item.status === "draft" && (
                  <div className={styles.actionBar}>
                    <button
                      className={`${styles.button} ${styles.buttonPrimary}`}
                      onClick={() => setEditing(true)}
                    >
                      Edit Expense
                    </button>
                    <button
                      className={`${styles.button} ${styles.buttonSuccess}`}
                      onClick={handleSubmit}
                    >
                      Submit for Approval
                    </button>
                  </div>
                )}
            </>
          ) : (
            <div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Title</label>
                <input
                  className={styles.formInput}
                  value={form.title}
                  onChange={handleChange("title")}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={`${styles.formInput} ${styles.textarea}`}
                  value={form.description}
                  onChange={handleChange("description")}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Amount Range</label>
                <div className={styles.amountRow}>
                  <div>
                    <div className={styles.formLabel}>Min</div>
                    <input
                      className={styles.formInput}
                      value={form.amount_min}
                      onChange={handleChange("amount_min")}
                    />
                  </div>
                  <div>
                    <div className={styles.formLabel}>Avg</div>
                    <input
                      className={styles.formInput}
                      value={form.amount_avg}
                      onChange={handleChange("amount_avg")}
                    />
                  </div>
                  <div>
                    <div className={styles.formLabel}>Max</div>
                    <input
                      className={styles.formInput}
                      value={form.amount_max}
                      onChange={handleChange("amount_max")}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Requested Amount</label>
                <input
                  className={styles.formInput}
                  value={form.requested_amount}
                  onChange={handleChange("requested_amount")}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Start Date</label>
                <input
                  className={styles.formInput}
                  type="date"
                  value={form.start_date}
                  onChange={handleChange("start_date")}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>End Date</label>
                <input
                  className={styles.formInput}
                  type="date"
                  value={form.end_date}
                  onChange={handleChange("end_date")}
                />
              </div>

              <div className={styles.actionBar}>
                <button
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  onClick={handleSave}
                >
                  Save Changes
                </button>
                <button
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.approvalsSection}>
          <h2 className={styles.approvalsTitle}>Approval History</h2>

          {approvals && approvals.length === 0 ? (
            <div className={styles.noApprovals}>No approvals recorded yet</div>
          ) : (
            <div className={styles.approvalsList}>
              {approvals &&
                approvals.map((a) => (
                  <div key={a._id} className={styles.approvalCard}>
                    <div className={styles.approvalHeader}>
                      <div>
                        <div className={styles.approvalAdmin}>
                          {a.admin_user
                            ? a.admin_user.display_name || a.admin_user.username
                            : "System Administrator"}
                        </div>
                        <div className={styles.approvalTime}>
                          {new Date(a.decided_at).toLocaleString()}
                        </div>
                      </div>
                      <div
                        className={`${styles.approvalDecision} ${
                          styles[a.decision.toLowerCase()]
                        }`}
                      >
                        {a.decision}
                      </div>
                    </div>

                    {a.comment && (
                      <div className={styles.approvalComment}>
                        "{a.comment}"
                      </div>
                    )}

                    {a.approved_amount != null && (
                      <div className={styles.approvalAmount}>
                        Approved Amount: {a.approved_amount}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedClient>
  );
}
