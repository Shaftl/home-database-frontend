"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchExpenses } from "@/store/slices/expensesSlice";
import { fetchIncomes } from "@/store/slices/incomesSlice";
import Header from "@/components/Header";
import styles from "./page.module.css";
import api from "@/lib/api";
import Link from "next/link";
import ProtectedClient from "@/components/ProtectedClient";

export default function Original() {
  const dispatch = useDispatch();
  const { list = [], loading } = useSelector(
    (s) => s.expenses || { list: [], loading: false },
  );
  const { list: incomes = [], loading: incomesLoading } = useSelector(
    (s) => s.incomes || { list: [], loading: false },
  );

  const [pendingList, setPendingList] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchExpenses());
    dispatch(fetchIncomes());
  }, [dispatch]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setPendingLoading(true);
      try {
        const res = await api.get("/api/personal-expenses?status=pending");
        if (!mounted) return;
        setPendingList(res.data.items || []);
      } catch (err) {
        console.error("Failed to load pending personal expenses", err);
        if (mounted) setPendingList([]);
      } finally {
        if (mounted) setPendingLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const seenCategories = [];
  const groups = list.reduce((acc, it) => {
    const catName = it.category?.name || it.category || "بدون دسته";
    const amount = Number(
      it.actual_amount ?? it.amount_avg ?? it.amount_min ?? it.amount_max ?? 0,
    );

    if (!seenCategories.includes(catName)) seenCategories.push(catName);
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push({ ...it, _amountForTotal: amount });
    return acc;
  }, {});

  const short = (s, n = 80) =>
    s ? (s.length > n ? s.slice(0, n).trim() + "..." : s) : "";

  return (
    <ProtectedClient>
      <div className={styles.dashboard}>
        <div className={styles.content}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarInner}>
              <button className="btn-primary">عاید</button>

              <div className={styles.sidebarContent}>
                {incomesLoading && (
                  <div className={styles.sidebarRow}>Loading...</div>
                )}

                {!incomesLoading && incomes.length === 0 && (
                  <div className={styles.sidebarRow}>
                    <p className={styles.rowPrice}>0</p>
                    <p className={styles.rowPriceName}>هیچ عایدی یافت نشد</p>
                  </div>
                )}

                {!incomesLoading &&
                  incomes.slice(0, 4).map((inc) => (
                    <div
                      key={inc._id || `${inc.source_name}-${inc.date}`}
                      className={styles.sidebarRow}
                    >
                      <p className={styles.rowPrice}>{inc.amount ?? "-"}</p>
                      <p className={styles.rowPriceName}>
                        {inc.source_name || inc.note || "بدون منبع"}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </aside>

          <main className={styles.main}>
            <div className={styles.mainInner}>
              <div className={styles.expenses}>
                <button className={`${styles.btn}`}>
                  <div className="flexBt">
                    <span></span>
                    <span>مصارف</span>
                  </div>
                </button>

                <div className={styles.contentBox}>
                  {loading && (
                    <div className={styles.contentBoxRow}>Loading...</div>
                  )}

                  {seenCategories.length === 0 && !loading ? (
                    <div className={styles.contentBoxRow}>
                      <p className={styles.contentBoxRowPrice}>0</p>
                      <p className={styles.contentBoxRowName}>
                        هیچ مصارفی یافت نشد
                      </p>
                    </div>
                  ) : null}

                  {seenCategories.map((catName) => {
                    const items = groups[catName] || [];
                    const total = items.reduce(
                      (s, it) => s + (it._amountForTotal || 0),
                      0,
                    );

                    if (items.length === 1) {
                      const it = items[0];
                      return (
                        <div key={catName} className={styles.contentBoxRow}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <Link href={`/expenses/${it._id}`}>
                              <button className="btn-SC" type="button">
                                مشاهده
                              </button>
                            </Link>

                            <p className={styles.contentBoxRowPrice}>
                              {it._amountForTotal ?? "-"}
                            </p>
                          </div>

                          <p className={styles.contentBoxRowName}>
                            {it.title || catName}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div key={catName} className={styles.contentBoxRowHover}>
                        <div className={`${styles.contentBoxRow}`}>
                          <p className={styles.contentBoxRowPrice}>
                            {total || "-"}
                          </p>
                          <div className="flex">
                            <p className={styles.contentBoxRowName}>
                              {catName}
                            </p>

                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              fill="#000000"
                              id="Arrow-Bend-Right-Down-Light--Streamline-Phosphor"
                              height="16"
                              width="16"
                            >
                              <desc>Arrow icon</desc>
                              <path
                                d="m13.86591875 12.01561875 -3.68950625 3.68950625c-0.1800625 0.1798375 -0.47175625 0.1798375 -0.6518125 0l-3.68950625 -3.68950625c-0.2420375 -0.2597375 -0.1121375 -0.684075 0.2338125 -0.76381875 0.1492875 -0.03440625 0.30591875 0.0075625 0.418 0.11200625l2.9024125 2.90164375V8.00020625C9.38508125 4.18135 6.29034375 1.08661875 2.47149375 1.082375c-0.355025 0.00001875 -0.5769125 -0.38429375 -0.3994125 -0.6917625C2.1544625 0.2479125 2.30671875 0.16 2.47149375 0.16c4.3279125 0.00508125 7.83511875 3.5122875 7.8402 7.84020625v6.26524375l2.9024125 -2.90164375c0.25973125 -0.2420375 0.684075 -0.1121375 0.7638125 0.2338125 0.0344125 0.1492875 -0.00755625 0.30591875 -0.112 0.418Z"
                                strokeWidth="0.0625"
                              ></path>
                            </svg>
                          </div>
                        </div>

                        <div className={styles.contentBoxRowAcc}>
                          {items.map((it) => (
                            <div
                              key={it._id || it.title}
                              className={styles.contentBoxRow}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                <Link href={`/expenses/${it._id}`}>
                                  <button className="btn-SC" type="button">
                                    مشاهده
                                  </button>
                                </Link>

                                <p className={styles.contentBoxRowPrice}>
                                  {it._amountForTotal ?? "-"}
                                </p>
                              </div>

                              <p className={styles.contentBoxRowName}>
                                {it.title || (it.category?.name ?? catName)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.request}>
                <button className={`${styles.btn}`}>درخواست ها</button>
                <div className={styles.contentBox}>
                  {pendingLoading && (
                    <div className={styles.contentBoxRow}>Loading...</div>
                  )}

                  {!pendingLoading && pendingList.length === 0 && (
                    <div className={styles.contentBoxRow}>
                      <div>
                        <strong>هیچ درخواستی یافت نشد</strong>
                        <div className={styles.small}>
                          هیچ درخواست معلقی وجود ندارد
                        </div>
                      </div>
                    </div>
                  )}

                  {!pendingLoading &&
                    pendingList.map((pe) => {
                      const price =
                        pe.requested_amount ??
                        pe.amount_avg ??
                        pe.amount_min ??
                        "-";
                      return (
                        <div key={pe._id} className={styles.contentBoxRow}>
                          <div
                            className="flex"
                            style={{ alignItems: "center", gap: 8 }}
                          >
                            <Link href={`/personal/${pe._id}`}>
                              <button className="btn-SC">بازدید</button>
                            </Link>
                            <p className={styles.contentBoxRowPrice}>{price}</p>
                          </div>

                          <div className="flex">
                            <p className={styles.contentBoxRowName}>
                              {pe.title}
                            </p>
                            <p className={styles.contentBoxRowNeed}>
                              {short(pe.description || "", 10)}
                            </p>
                            <p className={styles.contentBoxRowName}>
                              <strong>
                                By {pe.user?.display_name || pe.user?.username}
                              </strong>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <Link
                className={`${styles.btn} btn-primary`}
                href={"/dashboard"}
                style={{ textDecoration: "none" }}
              >
                محاسبه کلی
              </Link>
            </div>
          </main>
        </div>
      </div>
    </ProtectedClient>
  );
}
