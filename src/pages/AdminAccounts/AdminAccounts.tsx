import { useEffect, useState } from "react";
import { Shield, Trash2, UserPlus } from "lucide-react";
import { apiClient } from "../../lib/api";
import "./AdminAccounts.css";

interface AdminAccount {
  id: string;
  username: string;
  role: string;
  createdAt: string;
}

interface BackendAdminAccount {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newAccount, setNewAccount] = useState({
    username: "",
    password: "",
  });
  const hasReachedLimit = accounts.length >= 2;

  useEffect(() => {
    void loadAccounts();
  }, []);

  const handleAdd = async () => {
    if (!newAccount.username.trim() || !newAccount.password.trim()) {
      setFormError("Username and password are required.");
      return;
    }
    if (hasReachedLimit) {
      setFormError("Only 2 admin accounts are allowed.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const response = await apiClient.post<BackendAdminAccount>("/api/auth/admin/accounts", {
        username: newAccount.username.trim(),
        password: newAccount.password,
      });
      setAccounts((prev) => [...prev, mapAdminAccount(response.data)]);
      setNewAccount({ username: "", password: "" });
      setShowModal(false);
    } catch {
      setFormError("Failed to create admin account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/api/auth/admin/accounts/${id}`);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirm(null);
    } catch {
      setFormError("Failed to delete admin account.");
    }
  };

  async function loadAccounts() {
    setLoading(true);
    setFormError("");
    try {
      const response = await apiClient.get<BackendAdminAccount[]>("/api/auth/admin/accounts");
      setAccounts(response.data.map(mapAdminAccount));
    } catch {
      setFormError("Failed to load admin accounts.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-accounts">
      <div className="admin-accounts-header">
        <h1 className="admin-accounts-title">Admin Accounts</h1>
        <button className="admin-add-btn" onClick={() => setShowModal(true)} disabled={hasReachedLimit}>
          <UserPlus size={15} />
          Add Account
        </button>
      </div>

      <p className="admin-accounts-desc">
        Manage dashboard administrator accounts. Maximum: 2 admin accounts.
      </p>
      {formError && <p className="modal-error">{formError}</p>}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>Loading admin accounts...</td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={4}>No admin accounts found.</td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr key={account.id}>
                  <td className="admin-username">@{account.username}</td>
                  <td>
                    <span className="role-badge role-badge--admin">
                      <Shield size={12} />
                      {account.role}
                    </span>
                  </td>
                  <td>{new Date(account.createdAt).toLocaleString()}</td>
                  <td>
                    {deleteConfirm === account.id ? (
                      <div className="admin-confirm">
                        <span>Remove?</span>
                        <button className="confirm-yes" onClick={() => void handleDelete(account.id)}>Yes</button>
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setFormError(""); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add Admin Account</h2>
            <p className="modal-desc">
              New accounts can log into the IRIS admin dashboard immediately.
            </p>

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

            {formError && <p className="modal-error">{formError}</p>}
            {hasReachedLimit && <p className="modal-error">Admin limit reached (2 accounts).</p>}

            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => { setShowModal(false); setFormError(""); }}>
                Cancel
              </button>
              <button className="modal-confirm" onClick={() => void handleAdd()} disabled={submitting || hasReachedLimit}>
                {submitting ? "Adding..." : "Add Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function mapAdminAccount(account: BackendAdminAccount): AdminAccount {
  return {
    id: String(account.id),
    username: account.username,
    role: account.role,
    createdAt: account.created_at,
  };
}
