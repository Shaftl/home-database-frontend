// page.js (Admin Users) - "use client"
"use client";

import React, { useEffect, useState } from "react";
import api from "../../../lib/api";
import { useSelector } from "react-redux";
import styles from "./page.module.css";
import ProtectedClient from "@/components/ProtectedClient";

export default function AdminUsersPage() {
  const authUser = useSelector((s) => s.auth.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshFlag, setRefreshFlag] = useState(0);

  // create form
  const [createForm, setCreateForm] = useState({
    username: "",
    display_name: "",
    email: "",
    password: "",
    role: "user",
  });

  const allowedRoles = ["user", "adminA", "adminB", "superadmin", "guest"];

  useEffect(() => {
    if (!authUser) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/admin/users");
        setUsers(res.data.items || []);
      } catch (err) {
        console.error("Failed to load users", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [authUser, refreshFlag]);

  if (!authUser || authUser.role !== "superadmin") {
    return <div className={styles.container}>Forbidden — superadmin only</div>;
  }

  const refresh = () => setRefreshFlag((s) => s + 1);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.username || !createForm.email || !createForm.password) {
      alert("username, email and password required");
      return;
    }
    try {
      await api.post("/api/admin/users", createForm);
      alert("User created");
      setCreateForm({
        username: "",
        display_name: "",
        email: "",
        password: "",
        role: "user",
      });
      refresh();
    } catch (err) {
      console.error("create failed", err);
      const msg = err?.response?.data?.message || err.message || "Failed";
      alert(msg);
    }
  };

  const handleUpdate = async (id, patch) => {
    try {
      await api.put(`/api/admin/users/${id}`, patch);
      refresh();
    } catch (err) {
      console.error("update failed", err);
      const msg = err?.response?.data?.message || err.message || "Failed";
      alert(msg);
    }
  };

  const handleDelete = async (id, username) => {
    if (!confirm(`Delete user ${username}? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      alert("Deleted");
      refresh();
    } catch (err) {
      console.error("delete failed", err);
      const msg = err?.response?.data?.message || err.message || "Failed";
      alert(msg);
    }
  };

  return (
    <ProtectedClient allowedRoles={["superadmin"]}>
      <ProtectedClient>
        <div className={styles.dashboard}>
          <div className={styles.contentWrap}>
            <h2 className={styles.pageTitle}>Superadmin — User Management</h2>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Create user</h3>
              <form className={styles.createForm} onSubmit={handleCreate}>
                <input
                  className={styles.input}
                  placeholder="username"
                  value={createForm.username}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, username: e.target.value })
                  }
                />

                <input
                  className={styles.input}
                  placeholder="display name"
                  value={createForm.display_name}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      display_name: e.target.value,
                    })
                  }
                />

                <input
                  className={styles.input}
                  placeholder="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                />

                <input
                  className={styles.input}
                  placeholder="password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                />

                <select
                  className={styles.select}
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, role: e.target.value })
                  }
                >
                  {allowedRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                <button className={styles.button} type="submit">
                  Create
                </button>
              </form>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Existing users</h3>

              {loading && <div className={styles.emptyMsg}>Loading...</div>}
              {!loading && users.length === 0 && (
                <div className={styles.emptyMsg}>No users</div>
              )}

              <div className={styles.usersList}>
                {!loading &&
                  users.map((u) => (
                    <UserRow
                      key={u._id || u.id}
                      u={u}
                      allowedRoles={allowedRoles}
                      onUpdate={(patch) => handleUpdate(u._id || u.id, patch)}
                      onDelete={() => handleDelete(u._id || u.id, u.username)}
                      currentUserId={authUser.id || authUser._id}
                    />
                  ))}
              </div>
            </section>
          </div>
        </div>
      </ProtectedClient>
    </ProtectedClient>
  );
}

function UserRow({ u, allowedRoles, onUpdate, onDelete, currentUserId }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    display_name: u.display_name || "",
    email: u.email || "",
    role: u.role || "user",
    password: "",
  });

  useEffect(() => {
    setForm({
      display_name: u.display_name || "",
      email: u.email || "",
      role: u.role || "user",
      password: "",
    });
  }, [u]);

  const save = async () => {
    const patch = {};
    if (form.display_name !== u.display_name)
      patch.display_name = form.display_name;
    if (form.email !== u.email) patch.email = form.email;
    if (form.role !== u.role) patch.role = form.role;
    if (form.password) patch.password = form.password;
    if (Object.keys(patch).length === 0) {
      setEditing(false);
      return;
    }
    await onUpdate(patch);
    setEditing(false);
  };

  const canDelete = !(String(u._id || u.id) === String(currentUserId));

  return (
    <ProtectedClient allowedRoles={["superadmin"]}>
      <div className={styles.userCard}>
        <div className={styles.userInner}>
          <div className={styles.userLeft}>
            <div className={styles.userTitle}>
              <strong>{u.username}</strong>
              {u.display_name ? (
                <span className={styles.userDash}> — {u.display_name}</span>
              ) : null}
            </div>
            <div className={styles.userEmail}>{u.email}</div>
            <div className={styles.userRole}>role: {u.role}</div>
          </div>

          <div className={styles.userRight}>
            {!editing ? (
              <div className={styles.actionsGroup}>
                <button
                  className={styles.buttonAlt}
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
                <button
                  className={styles.buttonDanger}
                  onClick={onDelete}
                  disabled={!canDelete}
                  title={!canDelete ? "Cannot delete yourself" : "Delete user"}
                >
                  Delete
                </button>
              </div>
            ) : (
              <div className={styles.editForm}>
                <input
                  className={styles.input}
                  placeholder="display name"
                  value={form.display_name}
                  onChange={(e) =>
                    setForm({ ...form, display_name: e.target.value })
                  }
                />
                <input
                  className={styles.input}
                  placeholder="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <select
                  className={styles.select}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {allowedRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <input
                  className={styles.input}
                  placeholder="new password (optional)"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />

                <div className={styles.editActions}>
                  <button className={styles.button} onClick={save}>
                    Save
                  </button>
                  <button
                    className={styles.buttonAlt}
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedClient>
  );
}
