import { useState } from "react";
import { UserPlus, Trash2, Search } from "lucide-react";
import type { FaceProfile } from "../../types/iris";
import "./Profiles.css";

const mockProfiles: FaceProfile[] = [
  {
    id: "1",
    name: "Reymark De Castro",
    addedAt: "2026-03-01",
    imageUrl: "https://placehold.co/80x80?text=RC",
  },
  {
    id: "2",
    name: "Steephen Resurreccion",
    addedAt: "2026-03-01",
    imageUrl: "https://placehold.co/80x80?text=SR",
  },
  {
    id: "3",
    name: "Shan Christian Platon",
    addedAt: "2026-03-01",
    imageUrl: "https://placehold.co/80x80?text=SP",
  },
];

export default function Profiles() {
  const [profiles, setProfiles] = useState<FaceProfile[]>(mockProfiles);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = profiles.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newProfile: FaceProfile = {
      id: Date.now().toString(),
      name: newName.trim(),
      addedAt: new Date().toISOString().split("T")[0],
      imageUrl: `https://placehold.co/80x80?text=${newName.trim().charAt(0)}`,
    };
    setProfiles([...profiles, newProfile]);
    setNewName("");
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setProfiles(profiles.filter((p) => p.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <div className="profiles">
      {/* Header */}
      <div className="profiles-header">
        <h1 className="profiles-title">Face Profiles</h1>
        <button className="profiles-add-btn" onClick={() => setShowModal(true)}>
          <UserPlus size={15} />
          Add Profile
        </button>
      </div>

      {/* Search */}
      <div className="profiles-search-row">
        <div className="profiles-search">
          <Search size={14} className="profiles-search-icon" />
          <input
            type="text"
            placeholder="Search profiles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="profiles-search-input"
          />
        </div>
        <p className="profiles-count">{filtered.length} profile{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="profiles-empty">No profiles found.</p>
      ) : (
        <div className="profiles-grid">
          {filtered.map((profile) => (
            <div key={profile.id} className="profile-card">
              <img
                src={profile.imageUrl}
                alt={profile.name}
                className="profile-avatar"
              />
              <div className="profile-info">
                <p className="profile-name">{profile.name}</p>
                <p className="profile-date">Added {profile.addedAt}</p>
              </div>
              {deleteConfirm === profile.id ? (
                <div className="profile-confirm">
                  <span>Remove?</span>
                  <button className="confirm-yes" onClick={() => handleDelete(profile.id)}>Yes</button>
                  <button className="confirm-no" onClick={() => setDeleteConfirm(null)}>No</button>
                </div>
              ) : (
                <button
                  className="profile-delete-btn"
                  onClick={() => setDeleteConfirm(profile.id)}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add Face Profile</h2>
            <p className="modal-desc">
              Enter the name of the person to register. Photo capture will be handled by the Pi camera.
            </p>
            <div className="modal-field">
              <label>Full Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Maria Santos"
                className="modal-input"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="modal-confirm" onClick={handleAdd}>Add Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}