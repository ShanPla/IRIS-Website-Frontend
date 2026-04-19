import { useEffect, useState, type CSSProperties } from "react";
import { Key, Shield, Trash2, UserPlus, Users } from "lucide-react";
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

interface Homeowner {
  id: number;
  username: string;
  role: string;
}

interface AppUser {
  id: number;
  username: string;
  role: string;
  face_profile_count: number;
  access_type: string;
  has_device_access: boolean;
}

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [homeowners, setHomeowners] = useState<Homeowner[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteHomeownerConfirm, setDeleteHomeownerConfirm] = useState<number | null>(null);
  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newAccount, setNewAccount] = useState({ username: "", password: "" });
  const hasReachedLimit = accounts.length >= 2;

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setFormError("");

    try {
      const [accountsRes, homeownersRes, appUsersRes] = await Promise.all([
        apiClient.get<BackendAdminAccount[]>("/api/auth/admin/accounts"),
        apiClient.get<Homeowner[]>("/api/auth/admin/homeowners").catch(() => ({ data: [] as Homeowner[] })),
        apiClient.get<AppUser[]>("/api/auth/admin/app-users").catch(() => ({ data: [] as AppUser[] })),
      ]);

      setAccounts(accountsRes.data.map(mapAdminAccount));
      setHomeowners(homeownersRes.data);
      setAppUsers(appUsersRes.data);
    } catch {
      setFormError("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }

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

      setAccounts((current) => [...current, mapAdminAccount(response.data)]);
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
      setAccounts((current) => current.filter((account) => account.id !== id));
      setDeleteConfirm(null);
    } catch {
      setFormError("Failed to delete admin account.");
    }
  };

  const handleDeleteHomeowner = async (id: number) => {
    try {
      await apiClient.delete(`/api/auth/admin/homeowners/${id}`);
      setHomeowners((current) => current.filter((homeowner) => homeowner.id !== id));
      setDeleteHomeownerConfirm(null);
    } catch {
      setFormError("Failed to delete homeowner.");
    }
  };

  const handleResetPassword = async (id: number) => {
    if (!newPassword.trim() || newPassword.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    try {
      await apiClient.put(`/api/auth/admin/homeowners/${id}/password`, { password: newPassword });
      setResetPasswordId(null);
      setNewPassword("");
    } catch {
      setFormError("Failed to reset password.");
    }
  };

  const deviceAccessUsers = appUsers.filter((user) => user.has_device_access).length;

  return (
    <div className="app-page admin-page">
      <div className="app-page__header">
        <div>
          <p className="app-page__eyebrow">Admin Governance</p>
          <h1 className="app-page__title">Admin Accounts</h1>
          <p className="app-page__subtitle">
            Manage administrator credentials, keep homeowner access healthy, and stay aligned with
            the leaner device-focused navigation.
          </p>
        </div>
        <div className="app-page__actions">
          <button className="app-button app-button--primary" onClick={() => setShowModal(true)} disabled={hasReachedLimit}>
            <UserPlus size={15} />
            Add Admin
          </button>
        </div>
      </div>

      {formError && <p className="app-error">{formError}</p>}

      <div className="admin-kpis">
        <AdminKpi icon={<Shield size={20} />} label="Admin Accounts" value={loading ? "..." : String(accounts.length)} meta="Maximum of two dashboard admins" tone="primary" />
        <AdminKpi icon={<Users size={20} />} label="Homeowners" value={loading ? "..." : String(homeowners.length)} meta="Primary and invited homeowner accounts" tone="success" />
        <AdminKpi icon={<Users size={20} />} label="Total App Users" value={loading ? "..." : String(appUsers.length)} meta="Accounts stored in the backend" tone="warning" />
        <AdminKpi icon={<Key size={20} />} label="Device Access" value={loading ? "..." : String(deviceAccessUsers)} meta="Users currently linked to a device" tone="danger" />
      </div>

      <section className="app-card admin-panel app-fade-up">
        <div className="app-panel-header">
          <div>
            <h2 className="app-section-title">Administrator Accounts</h2>
            <p className="app-panel-subtitle">Direct access to the web dashboard. Limited to two operators.</p>
          </div>
        </div>

        <div className="app-table-card">
          <table className="app-table">
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
                    <td>
                      <div className="admin-identity">
                        <strong>@{account.username}</strong>
                        <span>ID {account.id}</span>
                      </div>
                    </td>
                    <td>
                      <span className="app-status app-status--primary">{formatRole(account.role)}</span>
                    </td>
                    <td>{new Date(account.createdAt).toLocaleString()}</td>
                    <td>
                      {deleteConfirm === account.id ? (
                        <div className="admin-inline-actions">
                          <button className="app-button app-button--danger" onClick={() => void handleDelete(account.id)}>
                            Confirm
                          </button>
                          <button className="app-button app-button--secondary" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button className="admin-action" onClick={() => setDeleteConfirm(account.id)}>
                          <Trash2 size={15} />
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="app-card admin-panel app-fade-up">
        <div className="app-panel-header">
          <div>
            <h2 className="app-section-title">Homeowner Directory</h2>
            <p className="app-panel-subtitle">Reset homeowner credentials or remove stale accounts when needed.</p>
          </div>
        </div>

        <div className="app-table-card">
          <table className="app-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Password</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4}>Loading homeowners...</td>
                </tr>
              ) : homeowners.length === 0 ? (
                <tr>
                  <td colSpan={4}>No homeowners found.</td>
                </tr>
              ) : (
                homeowners.map((homeowner) => (
                  <tr key={homeowner.id}>
                    <td>
                      <div className="admin-identity">
                        <strong>@{homeowner.username}</strong>
                        <span>ID {homeowner.id}</span>
                      </div>
                    </td>
                    <td>
                      <span className="app-status app-status--neutral">{formatRole(homeowner.role)}</span>
                    </td>
                    <td>
                      {resetPasswordId === homeowner.id ? (
                        <div className="admin-password-row">
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            placeholder="New password"
                            className="app-input"
                          />
                          <button className="app-button app-button--primary" onClick={() => void handleResetPassword(homeowner.id)}>
                            Save
                          </button>
                          <button className="app-button app-button--secondary" onClick={() => { setResetPasswordId(null); setNewPassword(""); }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button className="admin-action" onClick={() => setResetPasswordId(homeowner.id)}>
                          <Key size={15} />
                          Reset Password
                        </button>
                      )}
                    </td>
                    <td>
                      {deleteHomeownerConfirm === homeowner.id ? (
                        <div className="admin-inline-actions">
                          <button className="app-button app-button--danger" onClick={() => void handleDeleteHomeowner(homeowner.id)}>
                            Confirm
                          </button>
                          <button className="app-button app-button--secondary" onClick={() => setDeleteHomeownerConfirm(null)}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button className="admin-action admin-action--danger" onClick={() => setDeleteHomeownerConfirm(homeowner.id)}>
                          <Trash2 size={15} />
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <div className="app-modal-overlay" onClick={() => { setShowModal(false); setFormError(""); }}>
          <div className="app-card app-modal" onClick={(event) => event.stopPropagation()}>
            <h2 className="app-modal__title">Add Admin Account</h2>
            <p className="app-modal__desc">This account can sign in to the dashboard immediately after creation.</p>

            <div className="app-form-grid">
              <div className="app-field">
                <label>Username</label>
                <input
                  type="text"
                  value={newAccount.username}
                  onChange={(event) => setNewAccount((current) => ({ ...current, username: event.target.value }))}
                  placeholder="e.g. iris-admin"
                  className="app-input"
                />
              </div>
              <div className="app-field">
                <label>Password</label>
                <input
                  type="password"
                  value={newAccount.password}
                  onChange={(event) => setNewAccount((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter a secure password"
                  className="app-input"
                />
              </div>
            </div>

            {hasReachedLimit && <p className="app-error">Admin limit reached. Remove an existing admin to continue.</p>}

            <div className="app-modal__actions">
              <button className="app-button app-button--secondary" onClick={() => { setShowModal(false); setFormError(""); }}>
                Cancel
              </button>
              <button className="app-button app-button--primary" onClick={() => void handleAdd()} disabled={submitting || hasReachedLimit}>
                {submitting ? "Creating..." : "Create Admin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminKpi({
  icon,
  label,
  value,
  meta,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  meta: string;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const palette =
    tone === "success"
      ? { accent: "#16A34A", soft: "#DCFCE7" }
      : tone === "warning"
        ? { accent: "#EA580C", soft: "#FFEDD5" }
        : tone === "danger"
          ? { accent: "#DC2626", soft: "#FEE2E2" }
          : { accent: "#2563EB", soft: "#DBEAFE" };

  return (
    <article
      className="app-card app-kpi-card app-fade-up"
      style={
        {
          "--kpi-accent": `${palette.accent}20`,
          "--kpi-accent-soft": palette.soft,
          "--kpi-accent-text": palette.accent,
        } as CSSProperties
      }
    >
      <div className="app-kpi-card__header">
        <div>
          <p className="app-kpi-card__label">{label}</p>
          <p className="app-kpi-card__value">{value}</p>
          <p className="app-kpi-card__meta">{meta}</p>
        </div>
        <span className="app-kpi-card__icon">{icon}</span>
      </div>
    </article>
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

function formatRole(role: string) {
  return role.replace(/_/g, " ");
}
