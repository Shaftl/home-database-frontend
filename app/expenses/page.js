"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchExpenses, createExpense } from "@/store/slices/expensesSlice";
import styles from "@/components/Expenses.module.css";
import api from "@/lib/api";
import Link from "next/link";
import ProtectedClient from "@/components/ProtectedClient";

export default function ExpensesPage() {
  const dispatch = useDispatch();
  const { list = [], loading } = useSelector(
    (s) => s.expenses || { list: [], loading: false }
  );
  const user = useSelector((s) => s.auth.user);

  const [filters, setFilters] = useState({ category: "", from: "", to: "" });
  const [form, setForm] = useState({
    title: "",
    amount_min: "",
    amount_avg: "",
    amount_max: "",
    note: "",
    category: "",
    date: "",
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    dispatch(fetchExpenses());
    (async () => {
      try {
        const res = await api.get("/api/expense-categories");
        setCategories(res.data.items || []);
      } catch (err) {
        // fallback to hardcoded if endpoint missing
        setCategories([
          { name: "خانه" },
          { name: "حبوبات" },
          { name: "آشپزخانه" },
          { name: "شخصی" },
        ]);
      }
    })();
  }, [dispatch]);

  const applyFilters = () => {
    const params = {};
    if (filters.category) params.category = filters.category;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    dispatch(fetchExpenses(params));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title) {
      alert("title required");
      return;
    }
    if (
      form.amount_min === "" ||
      form.amount_avg === "" ||
      form.amount_max === ""
    ) {
      alert("min/avg/max required");
      return;
    }
    if (!form.category) {
      alert("category is required");
      return;
    }

    try {
      await dispatch(
        createExpense({
          title: form.title,
          category: form.category,
          amount_min: Number(form.amount_min),
          amount_avg: Number(form.amount_avg),
          amount_max: Number(form.amount_max),
          note: form.note,
          date: form.date || undefined,
        })
      ).unwrap();
      setForm({
        title: "",
        amount_avg: "",
        amount_min: "",
        amount_max: "",
        note: "",
        category: "",
        date: "",
      });
      dispatch(fetchExpenses()); // refresh
      alert("Expense created");
    } catch (err) {
      alert(err.message || "Error");
    }
  };

  // allow superadmin, adminA, adminB to create entries
  const canCreate =
    user && ["superadmin", "adminA", "adminB"].includes(user.role);

  return (
    <ProtectedClient>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.pageTitle}>Expenses (Public)</h2>
        </header>

        <section className={styles.controlsRow}>
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
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
          >
            <option value="">All categories</option>
            {categories.map((c, idx) => (
              <option key={idx} value={c._id || c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <button className={styles.button} onClick={applyFilters}>
            Filter
          </button>
        </section>

        <section className={styles.createSection}>
          <h4 className={styles.sectionTitle}>Create public expense</h4>

          {canCreate ? (
            <form onSubmit={submit} className={styles.createForm}>
              <input
                className={styles.input}
                placeholder="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <input
                className={styles.input}
                placeholder="min"
                value={form.amount_min}
                onChange={(e) =>
                  setForm({ ...form, amount_min: e.target.value })
                }
              />
              <input
                className={styles.input}
                placeholder="avg"
                value={form.amount_avg}
                onChange={(e) =>
                  setForm({ ...form, amount_avg: e.target.value })
                }
              />
              <input
                className={styles.input}
                placeholder="max"
                value={form.amount_max}
                onChange={(e) =>
                  setForm({ ...form, amount_max: e.target.value })
                }
              />
              <select
                className={styles.select}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select category</option>
                {categories.map((c, idx) => (
                  <option key={idx} value={c._id || c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                className={styles.input}
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              <input
                className={styles.inputWide}
                placeholder="note"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
              <button className={styles.button} type="submit">
                Add
              </button>
            </form>
          ) : (
            <div className={styles.info}>
              <small>
                Only admins (adminA/adminB) and superadmin can add public
                expenses.
              </small>
            </div>
          )}
        </section>

        {loading && <div className={styles.emptyMsg}>Loading...</div>}

        <section className={styles.list}>
          {list.map((it) => (
            <article key={it._id} className={styles.card}>
              <div className={styles.cardInner}>
                <div className={styles.cardLeft}>
                  <strong className={styles.cardTitle}>{it.title}</strong>
                  <div className={styles.small}>
                    {it.category ? it.category.name : ""} —{" "}
                    {it.date ? new Date(it.date).toLocaleDateString() : "-"}
                  </div>
                  {it.note && <div className={styles.note}>{it.note}</div>}
                </div>

                <div className={styles.cardRight}>
                  <div className={styles.amountBlock}>
                    <div>
                      min:{" "}
                      <span className={styles.amountValue}>
                        {it.amount_min ?? "-"}
                      </span>
                    </div>
                    <div>
                      avg:{" "}
                      <span className={styles.amountValue}>
                        {it.amount_avg ?? "-"}
                      </span>
                    </div>
                    <div>
                      max:{" "}
                      <span className={styles.amountValue}>
                        {it.amount_max ?? "-"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/expenses/${it._id}`}
                    className={styles.viewLink}
                  >
                    View
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </ProtectedClient>
  );
}
