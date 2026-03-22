import { useState } from "react";
import { UserPlus, Trash2, KeyRound, CheckCircle, XCircle } from "lucide-react";
import type { HomeownerUser } from "../../types/iris";
import "./UserManagement.css";

const mockUsers: HomeownerUser[] = [
  {
    id: "1",
    name: "Pedro Santos",
    email: "pedro@email.com",
    phone: "+63 912 345 6789",
    piDeviceId: "PI-001",
    piDeviceLabel: "Main House - Laguna",
    status: "active",
    lastLogin: "2026-03-18 09:00",
    lastAlertReceived: "2026-03-18 09:15",
  },
  {
    id: "2",
    name: "Maria Reyes",
    email: "maria@email.com",
    phone: "+63 917 654 3210",
    piDeviceId: "PI-002",
    piDeviceLabel: "Unit 4B - Makati",
    status: "active",
    lastLogin: "2026-03-17 14:30",
    lastAlertReceived: null,
  },
  {
    id: "3",
    name: "Jose Dela Cruz",
    email: "jose@email.com",
    phone: "+63 920 111 2222",
    piDeviceId: "PI-003",
    piDeviceLabel: "House - Cavite",
    status: "inactive",
    lastLogin: null,
    lastAlertReceived: null,
  },
];

export default function UserManagement() {
  const [users, setUsers] = useState<HomeownerUser[]>(mockUsers);
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<HomeownerUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetDone, setResetDone] = useState(false);
  const [formError, setFormError] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    piDeviceId: "",
    piDeviceLabel: "",
  });

  const handleAdd = () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.piDeviceId.trim()) {
      setFormError("Name, email, and Pi Device ID are required.");
      return;
    }
    const created: HomeownerUser = {
      id: Date.now().toString(),
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      phone: newUser.phone.trim(),
      piDeviceId: newUser.piDeviceId.trim(),
      piDeviceLabel: newUser.piDeviceLabel.trim() || newUser.piDeviceId.trim(),
      status: "active",
      lastLogin: null,
      lastAlertReceived: null,
    };
    setUsers([...users, created]);
    setNewUser({ name: "", email: "", phone: "", piDeviceId: "", piDeviceLabel: "" });
    setFormError("");
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setUsers(users.filter((u) => u.id !== id));
    setDeleteConfirm(null);
  };

  const handleToggleStatus = (id: string) => {
    setUsers(users.map((u) =>
      u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u
    ));
  };

  const handleResetPassword = () => {
    if (!newPassword.trim()) return;
    // TODO: send to backend
    setResetDone(true);
    setTimeout(() => {
      setResetDone(false);
      setNewPassword("");
      setShowResetModal(null);
    }, 1500);
  };

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
        Manage homeowner accounts linked to IRIS Pi devices. These users receive mobile alerts and can arm or disarm the system remotely.
      </p>

      <div className="user-table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th>Homeowner</th>
              <th>Pi Device</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Last Alert</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <p className="user-name">{user.name}</p>
                  <p className="user-contact">{user.email}</p>
                  <p className="user-contact">{user.phone}</p>
                </td>
                <td>
                  <p className="user-pi-label">{user.piDeviceLabel}</p>
                  <p className="user-pi-id">{user.piDeviceId}</p>
                </td>
                <td>
                  <button
                    className={`status-badge ${user.status === "active" ? "status-badge--active" : "status-badge--inactive"}`}
                    onClick={() => handleToggleStatus(user.id)}
                    title="Click to toggle status"
                  >
                    {user.status === "active"
                      ? <><CheckCircle size={12} /> Active</>
                      : <><XCircle size={12} /> Inactive</>
                    }
                  </button>
                </td>
                <td className="user-meta">{user.lastLogin ?? "—"}</td>
                <td className="user-meta">{user.lastAlertReceived ?? "—"}</td>
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
                        <button className="confirm-yes" onClick={() => handleDelete(user.id)}>Yes</button>
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setFormError(""); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add Homeowner Account</h2>
            <p className="modal-desc">Register a new homeowner and link them to their Pi device.</p>

            {[
              { label: "Full Name *", key: "name", placeholder: "e.g. Pedro Santos" },
              { label: "Email *", key: "email", placeholder: "e.g. pedro@email.com" },
              { label: "Phone", key: "phone", placeholder: "e.g. +63 912 345 6789" },
              { label: "Pi Device ID *", key: "piDeviceId", placeholder: "e.g. PI-004" },
              { label: "Pi Device Label", key: "piDeviceLabel", placeholder: "e.g. Main House - Laguna" },
            ].map(({ label, key, placeholder }) => (
              <div className="modal-field" key={key}>
                <label>{label}</label>
                <input
                  type="text"
                  value={newUser[key as keyof typeof newUser]}
                  onChange={(e) => setNewUser({ ...newUser, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="modal-input"
                />
              </div>
            ))}

            {formError && <p className="modal-error">{formError}</p>}
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => { setShowModal(false); setFormError(""); }}>Cancel</button>
              <button className="modal-confirm" onClick={handleAdd}>Add User</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => { setShowResetModal(null); setNewPassword(""); setResetDone(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Reset Password</h2>
            <p className="modal-desc">Set a new password for <strong>{showResetModal.name}</strong>.</p>
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
              <button className="modal-confirm" onClick={handleResetPassword}>Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}