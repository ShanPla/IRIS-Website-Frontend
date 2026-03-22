import { useEffect, useState } from "react";
import { KeyRound, Trash2, UserPlus } from "lucide-react";
import { apiClient, getStoredPiAddress } from "../../lib/api";
import "./UserManagement.css";

interface HomeownerAccount {
  id: string;
  userId: string;
  role: string;
  fcmToken: string | null;
  invitedBy: string | null;
  createdAt: string;
}

interface BackendHomeowner {
  id: number;
  username: string;
  role: string;
  fcm_token: string | null;
  invited_by: number | null;
  created_at: string;
}

interface AppUserPermission {
  can_view_events: boolean;
  can_silence_alarm: boolean;
  can_change_mode: boolean;
  can_manage_profiles: boolean;
}

interface AppUserAccount {
  id: number;
  username: string;
  role: string;
  invited_by: number | null;
  fcm_token: string | null;
  created_at: string;
  face_profile_count: number;
  access_type: string;
  has_device_access: boolean;
  permissions: AppUserPermission | null;
}

export default function UserManagement() {
  const [users, setUsers] = useState<HomeownerAccount[]>([]);
  const [appUsers, setAppUsers] = useState<AppUserAccount[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<HomeownerAccount | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetDone, setResetDone] = useState(false);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingAllUsers, setLoadingAllUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    userId: "",
  });

  useEffect(() => {
    void loadData();
  }, []);

  const handleAdd = async () => {
    const parsedUserId = Number(newUser.userId);
    if (!newUser.userId.trim() || Number.isNaN(parsedUserId) || parsedUserId <= 0 || !Number.isInteger(parsedUserId)) {
      setFormError("Valid numeric User ID is required.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const response = await apiClient.post<BackendHomeowner>("/api/auth/admin/homeowners/by-id", {
        user_id: parsedUserId,
      });
      const mapped = mapHomeowner(response.data);
      setUsers((prev) => {
        const exists = prev.some((u) => u.id === mapped.id);
        if (exists) {
          return prev.map((u) => (u.id === mapped.id ? mapped : u));
        }
        return [...prev, mapped];
      });
      setNewUser({ userId: "" });
      setShowModal(false);
    } catch {
      setFormError("Failed to add user by ID.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/api/auth/admin/homeowners/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setDeleteConfirm(null);
    } catch {
      setFormError("Failed to delete admin user.");
    }
  };

  const handleResetPassword = async () => {
    if (!showResetModal || !newPassword.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.put(`/api/auth/admin/homeowners/${showResetModal.id}/password`, {
        password: newPassword,
      });
      setResetDone(true);
      setTimeout(() => {
        setResetDone(false);
        setNewPassword("");
        setShowResetModal(null);
      }, 1200);
    } catch {
      setFormError("Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  async function loadUsers() {
    setLoading(true);
    setLoadingAllUsers(true);
    setFormError("");
    try {
      const [accessResponse, allUsersResponse] = await Promise.all([
        apiClient.get<BackendHomeowner[]>("/api/auth/admin/homeowners"),
        apiClient.get<AppUserAccount[]>("/api/auth/admin/app-users"),
      ]);
      setUsers(accessResponse.data.map(mapHomeowner));
      setAppUsers(allUsersResponse.data);
    } catch {
      setFormError("Failed to load users from backend.");
    } finally {
      setLoading(false);
      setLoadingAllUsers(false);
    }
  }

  async function loadData() {
    await loadUsers();
  }

  return (
    <div className="user-mgmt">
      <div className="user-mgmt-header">
        <h1 className="user-mgmt-title">User Management</h1>
        <button className="user-add-btn" onClick={() => setShowModal(true)}>
          <UserPlus size={15} />
          Add User
        </button>
      </div>
      <p className="user-mgmt-desc">
        Device access users for Pi: {getStoredPiAddress() ?? "Not configured"}
      </p>
      {formError && <p className="modal-error">{formError}</p>}

      <div className="user-table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Role</th>
              <th>FCM Token</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>Loading device access users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5}>No device access users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <p className="user-name">{user.userId}</p>
                    <p className="user-contact">DB ID: {user.id}</p>
                    {user.invitedBy && <p className="user-contact">Invited by: {user.invitedBy}</p>}
                  </td>
                  <td>
                    <span className={`status-badge ${user.role === "admin" ? "status-badge--active" : "status-badge--inactive"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="user-meta">{user.fcmToken ?? "-"}</td>
                  <td className="user-meta">{new Date(user.createdAt).toLocaleString()}</td>
                  <td>
                    <div className="user-actions">
                      <button
                        className="user-action-btn"
                        title="Reset password"
                        onClick={() => setShowResetModal(user)}
                      >
                        <KeyRound size={14} />
                      </button>
                      {deleteConfirm === user.id ? (
                        <div className="admin-confirm">
                          <span>Remove?</span>
                          <button className="confirm-yes" onClick={() => void handleDelete(user.id)}>Yes</button>
                          <button className="confirm-no" onClick={() => setDeleteConfirm(null)}>No</button>
                        </div>
                      ) : (
                        <button
                          className="user-action-btn user-action-btn--danger"
                          title="Delete user"
                          onClick={() => setDeleteConfirm(user.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="user-table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th>All App Users</th>
              <th>Role</th>
              <th>Access Type</th>
              <th>Face Profiles</th>
              <th>Permissions</th>
            </tr>
          </thead>
          <tbody>
            {loadingAllUsers ? (
              <tr>
                <td colSpan={5}>Loading app user accounts...</td>
              </tr>
            ) : appUsers.length === 0 ? (
              <tr>
                <td colSpan={5}>No app user accounts found.</td>
              </tr>
            ) : (
              appUsers.map((user) => (
                <tr key={`all-${user.id}`}>
                  <td>
                    <p className="user-name">{user.username}</p>
                    <p className="user-contact">ID: {user.id}</p>
                  </td>
                  <td>
                    <span className={`status-badge ${user.role === "admin" ? "status-badge--active" : "status-badge--inactive"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="user-meta">{user.access_type}</td>
                  <td className="user-meta">{user.face_profile_count}</td>
                  <td className="user-meta">
                    {user.permissions
                      ? `view:${yesNo(user.permissions.can_view_events)} silence:${yesNo(user.permissions.can_silence_alarm)} mode:${yesNo(user.permissions.can_change_mode)} profiles:${yesNo(user.permissions.can_manage_profiles)}`
                      : "auto"}
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
            <h2 className="modal-title">Add User By ID</h2>
            <p className="modal-desc">Add an existing backend user using numeric User ID.</p>

            <div className="modal-field">
              <label>User ID *</label>
              <input
                type="text"
                value={newUser.userId}
                onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
                placeholder="e.g. 2"
                className="modal-input"
              />
            </div>

            {formError && <p className="modal-error">{formError}</p>}
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => { setShowModal(false); setFormError(""); setNewUser({ userId: "" }); }}>Cancel</button>
              <button className="modal-confirm" onClick={() => void handleAdd()} disabled={submitting}>
                {submitting ? "Adding..." : "Add User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="modal-overlay" onClick={() => { setShowResetModal(null); setNewPassword(""); setResetDone(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Reset Password</h2>
            <p className="modal-desc">Set a new password for <strong>{showResetModal.userId}</strong>.</p>
            <div className="modal-field">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="modal-input"
                autoFocus
              />
            </div>
            {resetDone && <p className="modal-success">Password reset successfully!</p>}
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => { setShowResetModal(null); setNewPassword(""); }}>Cancel</button>
              <button className="modal-confirm" onClick={() => void handleResetPassword()} disabled={submitting}>Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function mapHomeowner(user: BackendHomeowner): HomeownerAccount {
  return {
    id: String(user.id),
    userId: user.username,
    role: user.role,
    fcmToken: user.fcm_token,
    invitedBy: user.invited_by ? String(user.invited_by) : null,
    createdAt: user.created_at,
  };
}

function yesNo(value: boolean): string {
  return value ? "yes" : "no";
}
