import { useState } from "react";
import { Trash2, UserPlus, ShieldCheck, Shield } from "lucide-react";
import type { AdminUser } from "../../types/iris";
import usersData from "../../data/users.json";
import "./AdminAccounts.css";

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState<AdminUser[]>(usersData as AdminUser[]);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [newAccount, setNewAccount] = useState({
    name: "",
    username: "",
    password: "",
    role: "admin" as "admin" | "superadmin",
  });

  const handleAdd = () => {
    if (!newAccount.name.trim() || !newAccount.username.trim() || !newAccount.password.trim()) {
      setFormError("All fields are required.");
      return;
    }
    const duplicate = accounts.find((a) => a.username === newAccount.username.trim());
    if (duplicate) {
      setFormError("Username already exists.");
      return;
    }
    const created: AdminUser = {
      id: Date.now().toString(),
      name: newAccount.name.trim(),
      username: newAccount.username.trim(),
      password: newAccount.password.trim(),
      role: newAccount.role,
    };
    setAccounts([...accounts, created]);
    setNewAccount({ name: "", username: "", password: "", role: "admin" });
    setFormError("");
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setAccounts(accounts.filter((a) => a.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <div className="admin-accounts">
      <div className="admin-accounts-header">
        <h1 className="admin-accounts-title">Admin Accounts</h1>
        <button className="admin-add-btn" onClick={() => setShowModal(true)}>
          <UserPlus size={15} />
          Add Account
        </button>
      </div>

      <p className="admin-accounts-desc">
        Manage who has access to the IRIS admin dashboard. Superadmins have full control including account management.
      </p>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td className="admin-name">{account.name}</td>
                <td className="admin-username">@{account.username}</td>
                <td>
                  <span className={`role-badge ${account.role === "superadmin" ? "role-badge--super" : "role-badge--admin"}`}>
                    {account.role === "superadmin" ? <ShieldCheck size={12} /> : <Shield size={12} />}
                    {account.role}
                  </span>
                </td>
                <td>
                  {deleteConfirm === account.id ? (
                    <div className="admin-confirm">
                      <span>Remove?</span>
                      <button className="confirm-yes" onClick={() => handleDelete(account.id)}>Yes</button>
                      <button className="confirm-no" onClick={() => setDeleteConfirm(null)}>No</button>
                    </div>
                  ) : (
                    <button
                      className="admin-delete-btn"
                      onClick={() => setDeleteConfirm(account.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setFormError(""); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add Admin Account</h2>
            <p className="modal-desc">
              New accounts will be able to log into the IRIS admin dashboard immediately.
            </p>

            <div className="modal-field">
              <label>Full Name</label>
              <input
                type="text"
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                placeholder="e.g. Maria Santos"
                className="modal-input"
              />
            </div>
            <div className="modal-field">
              <label>Username</label>
              <input
                type="text"
                value={newAccount.username}
                onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                placeholder="e.g. maria"
                className="modal-input"
              />
            </div>
            <div className="modal-field">
              <label>Password</label>
              <input
                type="password"
                value={newAccount.password}
                onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                placeholder="Enter password"
                className="modal-input"
              />
            </div>
            <div className="modal-field">
              <label>Role</label>
              <select
                value={newAccount.role}
                onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value as "admin" | "superadmin" })}
                className="modal-input"
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>

            {formError && <p className="modal-error">{formError}</p>}

            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => { setShowModal(false); setFormError(""); }}>
                Cancel
              </button>
              <button className="modal-confirm" onClick={handleAdd}>
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}