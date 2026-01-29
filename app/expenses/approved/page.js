"use client";
import React, { useEffect, useState } from "react";
import api from "../../../lib/api";
import styles from "../../../components/Expenses.module.css";
import { useSelector } from "react-redux";

function fmtDate(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

export default function ApprovedPage() {
  const authUser = useSelector((s) => s.auth.user);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    category: "",
    user: "",
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/expense-categories");
        setCategories(res.data.items || []);
      } catch (err) {
        // fallback categories
        setCategories([
          { name: "خانه" },
          { name: "حبوبات" },
          { name: "آشپزخانه" },
          { name: "شخصی" },
        ]);
      }
    })();
    fetchList();
  }, []);

  const fetchList = async (opts = filters) => {
    setLoading(true);
    try {
      // use personal-expenses endpoint (status=approved) - existing backend supports this
      const params = { status: "approved" };
      if (opts.from) params.from = opts.from;
      if (opts.to) params.to = opts.to;
      if (opts.category) params.category = opts.category;
      if (opts.user) params.user = opts.user;
      const res = await api.get(`/api/personal-expenses`, { params });
      setItems(res.data.items || []);
    } catch (err) {
      console.error("Failed to load approved items", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const onFilterApply = () => {
    fetchList(filters);
  };

  const downloadCSV = async () => {
    try {
      const params = { status: "approved" };
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.category) params.category = filters.category;
      if (filters.user) params.user = filters.user;
      // call reports endpoint with format=csv
      const res = await api.get("/api/reports/approved-expenses", {
        params: { ...params, format: "csv" },
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
    }
  };

  return (
    <div className={styles.container}>
      <h2>مصارف تأییدشده (Approved)</h2>

      <div className={styles.controls} style={{ marginBottom: 12 }}>
        <input
          className={styles.input}
          type="date"
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
        />
        <input
          className={styles.input}
          type="date"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
        />
        <select
          className={styles.select}
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="">All categories</option>
          {categories.map((c, idx) => (
            <option key={idx} value={c._id || c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className={styles.input}
          placeholder="user id (optional)"
          value={filters.user}
          onChange={(e) => setFilters({ ...filters, user: e.target.value })}
        />
        <button className={styles.button} onClick={onFilterApply}>
          Apply
        </button>

        <button
          style={{ marginLeft: 8 }}
          className={styles.button}
          onClick={downloadCSV}
        >
          Export CSV
        </button>
      </div>

      {loading && <div>Loading...</div>}
      {!loading && items.length === 0 && <div>No approved items</div>}

      {items.map((it) => (
        <div key={it._id} className={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>{it.title}</strong>
              <div className={styles.small}>
                by: {it.user ? it.user.display_name || it.user.username : "—"}
              </div>
              <div className={styles.small}>{it.description}</div>
            </div>
            <div>
              <div>min:{it.amount_min ?? "-"}</div>
              <div>avg:{it.amount_avg ?? "-"}</div>
              <div>max:{it.amount_max ?? "-"}</div>
              {it.approved_amount != null && (
                <div style={{ marginTop: 6, fontWeight: 700 }}>
                  Approved: {it.approved_amount}
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                {fmtDate(it.start_date)} — {fmtDate(it.end_date)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
