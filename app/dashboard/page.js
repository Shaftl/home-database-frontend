"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchExpenses } from "@/store/slices/expensesSlice";
import { fetchIncomes } from "@/store/slices/incomesSlice";
import api from "@/lib/api";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import styles from "./Dashboard.module.css";
import ProtectedClient from "@/components/ProtectedClient";

export default function Dashboard() {
  const dispatch = useDispatch();
  const { list: expenseList = [], loading: expensesLoading } = useSelector(
    (s) => s.expenses || { list: [], loading: false },
  );
  const { list: incomes = [], loading: incomesLoading } = useSelector(
    (s) => s.incomes || { list: [], loading: false },
  );

  const [personalApproved, setPersonalApproved] = useState([]);
  const [personalLoading, setPersonalLoading] = useState(false);

  // client-only last-updated string to avoid SSR/client hydration mismatch
  const [lastUpdated, setLastUpdated] = useState("");
  useEffect(() => {
    setLastUpdated(new Date().toLocaleString());
  }, []);

  useEffect(() => {
    dispatch(fetchExpenses());
    dispatch(fetchIncomes());

    let mounted = true;
    (async () => {
      setPersonalLoading(true);
      try {
        const res = await api.get("/api/personal-expenses?status=approved");
        if (!mounted) return;
        setPersonalApproved(res.data.items || []);
      } catch (err) {
        console.error("Failed to load personal approved expenses", err);
        if (mounted) setPersonalApproved([]);
      } finally {
        if (mounted) setPersonalLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  // helper: numeric amount for an expense-like object
  const getExpenseAmount = (it) =>
    Number(
      it.actual_amount ??
        it.approved_amount ??
        it.amount_avg ??
        it.amount_min ??
        it.amount_max ??
        0,
    );

  /**
   * ✅ NEW DEDUPE LOGIC (stable)
   * We dedupe personalApproved items that are already represented as public ExpenseEntry.
   * Since you removed personal ids from note, we match using:
   *   [Personal] <title>  + amount
   */
  const personalKeysWithExpenseEntry = useMemo(() => {
    const set = new Set();

    for (const e of expenseList) {
      const t = String(e?.title || "");
      const amt = getExpenseAmount(e);

      // match titles like: "[Personal] car"
      const m = t.match(/^\s*\[Personal\]\s*(.+)\s*$/i);
      if (!m) continue;

      const baseTitle = String(m[1] || "")
        .trim()
        .toLowerCase();

      // key = normalized title + amount
      set.add(`${baseTitle}__${amt}`);
    }

    return set;
  }, [expenseList]);

  const personalApprovedFiltered = useMemo(() => {
    return (personalApproved || []).filter((p) => {
      const baseTitle = String(p?.title || "")
        .trim()
        .toLowerCase();
      const amt = Number(p?.approved_amount ?? getExpenseAmount(p));
      const key = `${baseTitle}__${amt}`;
      // if already exists in public expenses, remove it from personal list to avoid duplicates
      return !personalKeysWithExpenseEntry.has(key);
    });
  }, [personalApproved, personalKeysWithExpenseEntry]);

  // Totals
  const incomeTotal = useMemo(
    () => incomes.reduce((s, i) => s + Number(i.amount || 0), 0),
    [incomes],
  );

  const expenseTotalPublic = useMemo(
    () => expenseList.reduce((s, e) => s + getExpenseAmount(e), 0),
    [expenseList],
  );

  const expenseTotalPersonal = useMemo(
    () =>
      personalApprovedFiltered.reduce(
        (s, p) => s + Number(p.approved_amount ?? getExpenseAmount(p)),
        0,
      ),
    [personalApprovedFiltered],
  );

  const expenseTotal = expenseTotalPublic + expenseTotalPersonal;
  const remaining = incomeTotal - expenseTotal;

  // percentages
  const remainingPercent =
    incomeTotal > 0
      ? Math.max(0, Math.min(100, (remaining / incomeTotal) * 100))
      : 0;

  /**
   * ✅ FIX: group expenses by category
   * - First group public expenses
   * - Then ADD (merge) personalApprovedFiltered into "مصارف شخصی"
   *   instead of overwriting it (this was your bug)
   */
  const groups = useMemo(() => {
    const byCat = {};
    const seen = [];

    // public expenses
    expenseList.forEach((it) => {
      const catName = it.category?.name || "بدون دسته";
      if (!seen.includes(catName)) seen.push(catName);
      if (!byCat[catName]) byCat[catName] = [];
      byCat[catName].push({ ...it, _amountForTotal: getExpenseAmount(it) });
    });

    // personal approved (not duplicated)
    if (personalApprovedFiltered.length > 0) {
      const personalItems = personalApprovedFiltered.map((p) => ({
        _id: p._id,
        // keep your original title style here (no [Personal] prefix)
        title: p.title,
        _amountForTotal: Number(p.approved_amount ?? getExpenseAmount(p)),
        user: p.user,
      }));

      const catKey = "مصارف شخصی";
      if (!seen.includes(catKey)) seen.push(catKey);

      // ✅ MERGE instead of overwrite
      if (!byCat[catKey]) byCat[catKey] = [];
      byCat[catKey] = [...byCat[catKey], ...personalItems];
    }

    return { byCat, seen };
  }, [expenseList, personalApprovedFiltered]);

  // Build category-level items containing an items array (every item visible)
  const categoryItems = useMemo(() => {
    return groups.seen.map((cat) => {
      const items = groups.byCat[cat] || [];
      const total = items.reduce((s, it) => s + (it._amountForTotal || 0), 0);

      const mapped = items.map((it) => ({
        id: it._id || `${cat}-${Math.random().toString(36).slice(2, 8)}`,
        title:
          it.title ||
          it.note ||
          (it.category && it.category.name) ||
          "بدون عنوان",
        amount: it._amountForTotal || 0,
      }));

      return {
        key: cat,
        title: cat,
        total,
        count: items.length,
        items: mapped,
      };
    });
  }, [groups]);

  const formatNumber = (n) => (typeof n === "number" ? n.toLocaleString() : n);

  const chartDataCircle = [
    { name: "باقیمانده", value: Math.max(0, remaining), color: "#2f855a" },
    { name: "مصرف", value: Math.max(0, expenseTotal), color: "#c53030" },
  ];

  return (
    <ProtectedClient>
      <div className={styles.dashboard}>
        <div className={styles.content}>
          {/* MAIN: big مصارف panel on the left */}
          <main className={styles.main}>
            <div className={styles.request}>
              <div className={styles.requestHeader}>
                <div className={styles.requestTitle}>مصارف</div>
                <div className={styles.requestTotal}>
                  {formatNumber(expenseTotal)}
                </div>
              </div>

              <div className={styles.contentBox}>
                <div className={styles.boxInner}>
                  {categoryItems.length === 0 &&
                  !expensesLoading &&
                  !personalLoading ? (
                    <div className={styles.emptyMsg}>
                      <p>هیچ مصارفی یافت نشد</p>
                    </div>
                  ) : (
                    <div className={styles.categoryGrid}>
                      {categoryItems.map((c) => (
                        <div key={c.key} className={styles.categoryCard}>
                          <div className={styles.categoryLeft}>
                            <div className={styles.categoryTotal}>
                              {formatNumber(c.total)}
                            </div>
                          </div>

                          <div className={styles.categoryRight}>
                            <div className={styles.categoryTitleRow}>
                              <div className={styles.categoryTitle}>
                                {c.title}
                              </div>
                              <div className={styles.categoryCount}>
                                {c.count} مورد
                              </div>
                            </div>

                            <div className={styles.itemList}>
                              {c.items.map((it) => (
                                <div key={it.id} className={styles.itemRow}>
                                  <div className={styles.itemTitle}>
                                    {it.title}
                                  </div>
                                  <div className={styles.itemAmount}>
                                    {formatNumber(it.amount)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* VISUAL COLUMN (right): pie + totals beneath it */}
          <aside className={styles.visualColumn}>
            <div className={styles.visualInner}>
              <div className={styles.pieLarge}>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Tooltip formatter={(v) => `${formatNumber(v)} AFN`} />
                    <Pie
                      data={chartDataCircle}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={44}
                      outerRadius={64}
                      paddingAngle={2}
                      isAnimationActive={true}
                    >
                      {chartDataCircle.map((entry, idx) => (
                        <Cell key={`c-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className={styles.pieCenterLarge}>
                  <div className={styles.pieCenterNumber}>
                    {incomeTotal > 0
                      ? `${Math.round(remainingPercent)}%`
                      : `${expenseTotal > 0 ? "0%" : "—"}`}
                  </div>
                  <div className={styles.pieCenterLabel}>باقیمانده</div>
                </div>
              </div>

              {/* totals moved under the chart */}
              <div className={styles.totalsBox}>
                <div className={styles.totalsRow}>
                  <div className={styles.totalsLabel}>مجموع عاید</div>
                  <div className={styles.totalsValue}>
                    {formatNumber(incomeTotal)} AFN
                  </div>
                </div>
                <div className={styles.totalsRow}>
                  <div className={styles.totalsLabel}>مجموع مصارف</div>
                  <div className={styles.totalsValue}>
                    {formatNumber(expenseTotal)} AFN
                  </div>
                </div>
                <div className={styles.totalsRow}>
                  <div className={styles.totalsLabel}>باقیمانده</div>
                  <div
                    className={
                      remaining >= 0
                        ? styles.totalsValueGreen
                        : styles.totalsValueRed
                    }
                  >
                    {formatNumber(remaining)} AFN{remaining < 0 ? "-" : ""}
                  </div>
                </div>
                <div className={styles.totalsRowSmall}>
                  <div className={styles.totalsLabelSmall}>
                    آخرین به‌روزرسانی
                  </div>
                  <div className={styles.totalsValueSmall}>{lastUpdated}</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </ProtectedClient>
  );
}
