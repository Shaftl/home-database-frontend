"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchIncomes, createIncome } from "../../store/slices/incomesSlice";
import styles from "./Incomes.module.css";
import ProtectedClient from "@/components/ProtectedClient";

export default function IncomesPage() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(
    (s) => s.incomes || { list: [], loading: false }
  );
  const user = useSelector((s) => s.auth.user);

  const [form, setForm] = useState({
    source_name: "",
    amount: "",
    currency: "AFN",
    note: "",
    date: "",
  });

  useEffect(() => {
    dispatch(fetchIncomes());
  }, [dispatch]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.source_name || !form.amount) {
      alert("source and amount required");
      return;
    }
    try {
      await dispatch(
        createIncome({
          source_name: form.source_name,
          amount: Number(form.amount),
          currency: form.currency,
          note: form.note,
          date: form.date || undefined,
        })
      ).unwrap();
      setForm({
        source_name: "",
        amount: "",
        currency: "AFN",
        note: "",
        date: "",
      });
      alert("Income created");
      dispatch(fetchIncomes());
    } catch (err) {
      alert(
        err?.message || "Error creating income (maybe you are not allowed)"
      );
    }
  };

  const total = list.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <ProtectedClient>
      <div className={styles.dashboard}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <h2 className={styles.requestTitle}>Incomes</h2>
            <div className={styles.headerSub}>
              Manage income sources and records — modern, clean and minimal.
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.requestTotal}>
              {total}{" "}
              <span className={styles.requestTotalCurrency}>
                {list.length > 0 ? list[0].currency || "AFN" : "AFN"}
              </span>
            </div>
            <div className={styles.smallMeta}>{list.length} entries</div>
          </div>
        </div>

        <div className={styles.contentBox}>
          <div className={styles.boxInner}>
            {/* form area */}
            {user && user.role === "superadmin" ? (
              <form className={styles.form} onSubmit={submit}>
                <div className={styles.formRow}>
                  <input
                    className={styles.input}
                    placeholder="Source"
                    value={form.source_name}
                    onChange={(e) =>
                      setForm({ ...form, source_name: e.target.value })
                    }
                  />
                  <input
                    className={styles.input}
                    placeholder="Amount"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                  />
                  <select
                    className={styles.input}
                    value={form.currency}
                    onChange={(e) =>
                      setForm({ ...form, currency: e.target.value })
                    }
                  >
                    <option>AFN</option>
                    <option>USD</option>
                    <option>EUR</option>
                  </select>
                  <input
                    className={styles.inputDate}
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                  <button className={styles.button} type="submit">
                    Add
                  </button>
                </div>

                <div className={styles.formRow}>
                  <input
                    className={styles.inputWide}
                    placeholder="Note"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                  />
                </div>
              </form>
            ) : (
              <div className={styles.info}>
                <small>
                  Only <strong>superadmin</strong> may add incomes. You can
                  still view the list below.
                </small>
              </div>
            )}

            <div className={styles.totalsRowSmall}>
              <div className={styles.totalsLabel}>Total</div>
              <div className={styles.totalsValue}>
                {total} {list.length > 0 ? list[0].currency || "AFN" : "AFN"}
              </div>
            </div>

            {loading && <div className={styles.emptyMsg}>Loading...</div>}

            {list.length === 0 && !loading && (
              <div className={styles.emptyMsg}>No incomes yet.</div>
            )}

            <div className={styles.itemList}>
              {list.map((item) => (
                <div key={item._id} className={styles.incomeRow}>
                  <div className={styles.incomeLeft}>
                    <div className={styles.incomeAmount}>
                      {item.amount} {item.currency}
                    </div>
                  </div>

                  <div className={styles.incomeRight}>
                    <div className={styles.incomeTitleRow}>
                      <div className={styles.incomeTitle}>
                        {item.source_name}
                      </div>
                      <div className={styles.incomeDate}>
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>

                    <div className={styles.small}>
                      {item.created_by
                        ? item.created_by.display_name ||
                          item.created_by.username
                        : ""}
                      {item.note ? " — " + item.note : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProtectedClient>
  );
}
