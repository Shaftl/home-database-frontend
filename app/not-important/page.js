// frontend/app/page.js
"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { fetchIncomes } from "../../store/slices/incomesSlice";
import { fetchExpenses } from "../../store/slices/expensesSlice";
import {
  fetchMyExpenses,
  fetchPendingList,
} from "../../store/slices/personalExpensesSlice";
import styles from "../../components/Expenses.module.css";
import api from "../../lib/api";

function fmt(num) {
  if (num == null) return "-";
  return Number(num).toLocaleString();
}

export default function MainPage() {
  const dispatch = useDispatch();

  const incomesState = useSelector(
    (s) => s.incomes || { list: [], loading: false }
  );
  const expensesState = useSelector(
    (s) => s.expenses || { list: [], loading: false }
  );
  const personalState = useSelector(
    (s) => s.personal || { myList: [], pendingList: [] }
  );
  const auth = useSelector((s) => s.auth || { user: null, status: "idle" });

  // default range: current month
  const [range, setRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .substr(0, 10);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .substr(0, 10);
    return { from: start, to: end };
  });

  const [tab, setTab] = useState("overview");
  const [filters, setFilters] = useState({ category: "", user: "" });
  const [approvedCsvLoading, setApprovedCsvLoading] = useState(false);

  // server-side totals (authoritative)
  const [remainingData, setRemainingData] = useState({
    totalIncome: 0,
    totalGlobalExpenses: 0,
    totalPersonalApproved: 0,
    totalExpenses: 0,
    remaining: 0,
  });
  const [remainingLoading, setRemainingLoading] = useState(false);

  // approved personal list for display/counts
  const [approvedPersonalList, setApprovedPersonalList] = useState([]);
  const [approvedPersonalLoading, setApprovedPersonalLoading] = useState(false);

  useEffect(() => {
    const params = { from: range.from, to: range.to };
    dispatch(fetchIncomes(params));
    dispatch(fetchExpenses(params));

    // only fetch personal (authenticated) lists if logged in
    if (auth && auth.user) {
      dispatch(fetchMyExpenses());
      dispatch(fetchPendingList());
    }

    // fetch authoritative totals
    (async () => {
      setRemainingLoading(true);
      try {
        const res = await api.get("/api/reports/remaining", {
          params: { from: range.from, to: range.to },
        });
        if (res && res.data) {
          setRemainingData({
            totalIncome: Number(res.data.totalIncome || 0),
            totalGlobalExpenses: Number(res.data.totalGlobalExpenses || 0),
            totalPersonalApproved: Number(res.data.totalPersonalApproved || 0),
            totalExpenses: Number(res.data.totalExpenses || 0),
            remaining: Number(res.data.remaining || 0),
          });
        } else {
          setRemainingData({
            totalIncome: 0,
            totalGlobalExpenses: 0,
            totalPersonalApproved: 0,
            totalExpenses: 0,
            remaining: 0,
          });
        }
      } catch (err) {
        console.warn("Failed to fetch remaining:", err);
        // fallback: compute from client lists (best-effort)
        const incomesList = incomesState.list || [];
        const expensesList = expensesState.list || [];
        const totalIncome = incomesList.reduce(
          (s, it) => s + (it.amount || 0),
          0
        );
        // filter out personal-marked expense entries
        const filteredGlobalExpenses = (expensesList || []).filter(
          (e) =>
            !(
              (e.note &&
                typeof e.note === "string" &&
                /Approved personal expense/i.test(e.note)) ||
              (e.title &&
                typeof e.title === "string" &&
                e.title.startsWith("[Personal]"))
            )
        );
        const totalGlobalExpenses = filteredGlobalExpenses.reduce((s, it) => {
          const v =
            it.actual_amount != null ? it.actual_amount : it.amount_avg ?? 0;
          return s + Number(v || 0);
        }, 0);
        setRemainingData({
          totalIncome,
          totalGlobalExpenses,
          totalPersonalApproved: 0,
          totalExpenses: totalGlobalExpenses,
          remaining: totalIncome - totalGlobalExpenses,
        });
      } finally {
        setRemainingLoading(false);
      }
    })();

    // fetch approved personal items (for counts and display)
    (async () => {
      setApprovedPersonalLoading(true);
      try {
        const qs = new URLSearchParams({
          status: "approved",
          from: range.from,
          to: range.to,
        }).toString();
        const res = await api.get(
          `/api/reports/approved-expenses${qs ? `?${qs}` : ""}`
        );
        if (res && res.data && Array.isArray(res.data.items)) {
          setApprovedPersonalList(res.data.items);
        } else {
          setApprovedPersonalList([]);
        }
      } catch (err) {
        console.warn("Failed to fetch approved personal list:", err);
        setApprovedPersonalList([]);
      } finally {
        setApprovedPersonalLoading(false);
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, range, auth && auth.user]);

  // lists
  const incomesList = incomesState.list || [];
  const expensesList = expensesState.list || [];
  const myList = personalState.myList || [];

  // filter client-side expenses to match backend logic (exclude personal-marked expense entries)
  const globalExpenseEntries = (expensesList || []).filter(
    (e) =>
      !(
        (e.note &&
          typeof e.note === "string" &&
          /Approved personal expense/i.test(e.note)) ||
        (e.title &&
          typeof e.title === "string" &&
          e.title.startsWith("[Personal]"))
      )
  );

  const globalCount = globalExpenseEntries.length;
  const personalApprovedCount = approvedPersonalList.length;
  const totalExpensesCount = globalCount + personalApprovedCount;

  // display values (server-first)
  const displayedTotalIncome =
    remainingData.totalIncome ??
    incomesList.reduce((s, it) => s + (it.amount || 0), 0);
  const displayedGlobalExpenses =
    remainingData.totalGlobalExpenses ??
    globalExpenseEntries.reduce((s, it) => {
      const v =
        it.actual_amount != null ? it.actual_amount : it.amount_avg ?? 0;
      return s + Number(v || 0);
    }, 0);
  const displayedPersonalApproved =
    remainingData.totalPersonalApproved ??
    approvedPersonalList.reduce((s, it) => {
      const v =
        it.approved_amount != null
          ? it.approved_amount
          : it.requested_amount != null
          ? it.requested_amount
          : it.amount_avg ?? 0;
      return s + Number(v || 0);
    }, 0);
  const displayedTotalExpenses =
    remainingData.totalExpenses ??
    displayedGlobalExpenses + displayedPersonalApproved;
  const displayedRemaining =
    remainingData.remaining ?? displayedTotalIncome - displayedTotalExpenses;

  const myPending = (myList.filter((i) => i.status === "pending") || []).length;
  const myDrafts = (myList.filter((i) => i.status === "draft") || []).length;
  const myApproved = (myList.filter((i) => i.status === "approved") || [])
    .length;

  const downloadApprovedCSV = async () => {
    setApprovedCsvLoading(true);
    try {
      const params = { status: "approved" };
      if (filters.user) params.user = filters.user;
      if (filters.category) params.category = filters.category;
      const res = await api.get("/api/reports/approved-expenses", {
        params: { ...params, format: "csv", from: range.from, to: range.to },
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = `approved-expenses-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV download failed", err);
      alert("Failed to download CSV");
    } finally {
      setApprovedCsvLoading(false);
    }
  };

  return (
    <main style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <h1>Dashboard — One page (Tabs)</h1>
        <div>
          <Link href="/login">Login</Link> |{" "}
          <Link href="/register">Register</Link>
        </div>
      </div>

      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>Range:</label>
        <input
          type="date"
          value={range.from}
          onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
        />
        <input
          type="date"
          value={range.to}
          onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
          style={{ marginLeft: 8 }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setTab("overview")}
          className={tab === "overview" ? styles.button : undefined}
        >
          Overview
        </button>
        <button
          onClick={() => setTab("incomes")}
          className={tab === "incomes" ? styles.button : undefined}
        >
          Incomes
        </button>
        <button
          onClick={() => setTab("expenses")}
          className={tab === "expenses" ? styles.button : undefined}
        >
          Expenses
        </button>
        <button
          onClick={() => setTab("personal")}
          className={tab === "personal" ? styles.button : undefined}
        >
          My Requests
        </button>
        <button
          onClick={() => setTab("approved")}
          className={tab === "approved" ? styles.button : undefined}
        >
          Approved
        </button>
        {auth.user &&
          ["adminA", "adminB", "superadmin"].includes(auth.user.role) && (
            <button
              onClick={() => setTab("pending")}
              className={tab === "pending" ? styles.button : undefined}
            >
              Admin Pending
            </button>
          )}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <div
            style={{
              padding: 16,
              borderRadius: 8,
              background: "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ color: "#666", fontSize: 13 }}>Total Income</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
              {fmt(displayedTotalIncome)} AFN
            </div>
            <div style={{ marginTop: 8 }}>
              <small>{incomesList.length} items in range</small>
            </div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 8,
              background: "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ color: "#666", fontSize: 13 }}>Total Expenses</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
              {fmt(displayedTotalExpenses)} AFN
            </div>
            <div style={{ marginTop: 8 }}>
              <small>
                {totalExpensesCount} items in range ({globalCount} global +{" "}
                {personalApprovedCount} personal)
              </small>
            </div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 8,
              background: "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ color: "#666", fontSize: 13 }}>
              My Personal Requests
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
              {myList.length}
            </div>
            <div style={{ marginTop: 8 }}>
              <small>
                {myPending} pending • {myDrafts} drafts • {myApproved} approved
              </small>
            </div>
            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => (window.location.href = "/personal/my-requests")}
              >
                Open My Requests
              </button>
            </div>
          </div>

          {/* Remaining */}
          <div
            style={{
              padding: 16,
              borderRadius: 8,
              background: "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ color: "#666", fontSize: 13 }}>
              باقیمانده (Remaining)
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
              {remainingLoading
                ? "Loading..."
                : `${fmt(displayedRemaining)} AFN`}
            </div>
            <div style={{ marginTop: 8 }}>
              <small>
                For range: {range.from} — {range.to}
              </small>
            </div>
            <div style={{ marginTop: 12, fontSize: 14 }}>
              <div>
                درآمد (Income): <strong>{fmt(displayedTotalIncome)}</strong>
              </div>
              <div>
                مصارف - کلی (Expenses total):{" "}
                <strong>{fmt(displayedTotalExpenses)}</strong>
              </div>
              <div style={{ marginTop: 8, color: "#666" }}>
                <small>
                  Global: {fmt(displayedGlobalExpenses)} • Personal approved:{" "}
                  {fmt(displayedPersonalApproved)}
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incomes tab */}
      {tab === "incomes" && (
        <section>
          <h3>Incomes</h3>
          {incomesState.loading && <div>Loading...</div>}
          {incomesList.map((it) => (
            <div key={it._id} className={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>{it.source_name}</strong>
                  <div className={styles.small}>
                    {it.created_by
                      ? it.created_by.display_name || it.created_by.username
                      : ""}
                  </div>
                </div>
                <div>
                  <strong>
                    {it.amount} {it.currency || "AFN"}
                  </strong>
                  <div className={styles.small}>
                    {new Date(it.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Expenses tab */}
      {tab === "expenses" && (
        <section>
          <h3>Expenses</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ marginRight: 8 }}>Category:</label>
            <input
              placeholder="category id or name"
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
            />
            <button
              style={{ marginLeft: 8 }}
              onClick={() =>
                dispatch(
                  fetchExpenses({
                    category: filters.category,
                    from: range.from,
                    to: range.to,
                  })
                )
              }
            >
              Apply
            </button>
          </div>

          {expensesState.loading && <div>Loading...</div>}
          {expensesList.map((it) => (
            <div key={it._id} className={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>{it.title}</strong>
                  <div className={styles.small}>
                    {it.category ? it.category.name : ""} —{" "}
                    {new Date(it.date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div>min:{it.amount_min ?? "-"}</div>
                  <div>avg:{it.amount_avg ?? "-"}</div>
                  <div>max:{it.amount_max ?? "-"}</div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Personal requests tab */}
      {tab === "personal" && (
        <section>
          <h3>My Personal Requests</h3>
          <div style={{ marginBottom: 12 }}>
            <button onClick={() => (window.location.href = "/personal/new")}>
              New Request
            </button>
          </div>
          {myList.length === 0 && <div>No requests yet</div>}
          {myList.map((it) => (
            <div
              key={it._id}
              className={styles.card}
              style={{ marginBottom: 12 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>{it.title}</strong>
                  <div style={{ fontSize: 13, color: "#666" }}>
                    status: {it.status}{" "}
                    {it.approvals_count
                      ? ` — ${it.approvals_count} approvals`
                      : ""}
                  </div>
                  <div style={{ marginTop: 6 }}>{it.description}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div>
                    <strong>min</strong> {it.amount_min} | <strong>avg</strong>{" "}
                    {it.amount_avg} | <strong>max</strong> {it.amount_max}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {it.status === "draft" && (
                      <>
                        <button
                          onClick={() =>
                            (window.location.href = `/personal/${it._id}`)
                          }
                        >
                          Edit
                        </button>{" "}
                        <button
                          onClick={async () => {
                            if (!confirm("Submit for approval?")) return;
                            await api.post(
                              `/api/personal-expenses/${it._id}/submit`
                            );
                            alert("Submitted");
                            dispatch(fetchMyExpenses());
                          }}
                        >
                          Submit
                        </button>
                      </>
                    )}
                    {it.status === "pending" && (
                      <div style={{ marginTop: 6 }}>
                        {it.approvals_count || 0}/
                        {it.required_admins_count || 2} approved
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Approved tab */}
      {tab === "approved" && (
        <section>
          <h3>Approved Personal Expenses</h3>

          <div style={{ marginBottom: 12 }}>
            <input
              placeholder="filter by user id"
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
            />
            <input
              placeholder="category id"
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              style={{ marginLeft: 8 }}
            />
            <button
              style={{ marginLeft: 8 }}
              onClick={() =>
                dispatch(
                  fetchExpenses({
                    status: "approved",
                    from: range.from,
                    to: range.to,
                    category: filters.category,
                    user: filters.user,
                  })
                )
              }
            >
              Apply
            </button>
            <button
              style={{ marginLeft: 8 }}
              onClick={downloadApprovedCSV}
              disabled={approvedCsvLoading}
            >
              {approvedCsvLoading ? "Exporting..." : "Export CSV"}
            </button>
          </div>

          <div>
            {approvedPersonalLoading && <div>Loading...</div>}
            {approvedPersonalList.map((it) => (
              <div key={it._id} className={styles.card}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <strong>{it.title}</strong>
                    <div className={styles.small}>
                      by:{" "}
                      {it.user ? it.user.display_name || it.user.username : "—"}
                    </div>
                    <div className={styles.small}>{it.description}</div>
                  </div>
                  <div>
                    <div>min:{it.amount_min ?? "-"}</div>
                    <div>avg:{it.amount_avg ?? "-"}</div>
                    <div>max:{it.amount_max ?? "-"}</div>
                  </div>
                </div>
              </div>
            ))}

            {(!approvedPersonalList || approvedPersonalList.length === 0) && (
              <div>No approved items in this range</div>
            )}
          </div>
        </section>
      )}

      {/* Admin pending quick view */}
      {tab === "pending" && (
        <section>
          <h3>Pending Approvals (Admin)</h3>
          <div style={{ marginBottom: 12 }}>
            <Link href="/admin/pending">Open full Admin Pending page</Link>
          </div>
          <div>Pending items: {(personalState.pendingList || []).length}</div>
          {(personalState.pendingList || []).map((it) => (
            <div key={it._id} className={styles.card} style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>{it.title}</strong>
                  <div className={styles.small}>
                    by {it.user?.display_name || it.user?.username}
                  </div>
                </div>
                <div>
                  <div>
                    min:{it.amount_min} avg:{it.amount_avg} max:{it.amount_max}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Link href={`/admin/pending`}>Review</Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      <div style={{ marginTop: 20 }}>
        <nav style={{ paddingTop: 12, borderTop: "1px solid #eee" }}>
          <Link href="/incomes">Incomes</Link> |{" "}
          <Link href="/expenses">Expenses</Link> |{" "}
          <Link href="/expenses/approved">Approved</Link> |{" "}
          <Link href="/personal/my-requests">My Requests</Link> |{" "}
          <Link href="/admin/pending">Admin Pending</Link>
        </nav>
      </div>
    </main>
  );
}
