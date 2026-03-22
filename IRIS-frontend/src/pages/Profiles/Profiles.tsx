import { useEffect, useMemo, useState } from "react";
import { Search, Trash2, UserPlus } from "lucide-react";
import { apiClient, buildApiUrl, getStoredPiAddress } from "../../lib/api";
import type { FaceProfile } from "../../types/iris";
import "./Profiles.css";

interface BackendProfile {
  id: number;
  name: string;
  registered_by: number;
  created_at: string;
}

export default function Profiles() {
  const [profiles, setProfiles] = useState<FaceProfile[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchProfiles();
  }, []);

  const filtered = useMemo(() => {
    return profiles.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [profiles, search]);

  const handleAdd = async () => {
    if (!newName.trim()) {
      setError("Name is required.");
      return;
    }
    if (!newPhoto) {
      setError("Please select a photo file.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", newName.trim());
      formData.append("file", newPhoto);

      const response = await apiClient.post<BackendProfile>("/api/faces/", formData);
      const profile = mapProfile(response.data);
      setProfiles((prev) => [profile, ...prev]);
      setNewName("");
      setNewPhoto(null);
      setShowModal(false);
    } catch {
      setError("Failed to add profile. Make sure the backend is running and image is valid.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError("");
    try {
      await apiClient.delete(`/api/faces/${id}`);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
    } catch {
      setError("Failed to delete profile.");
    }
  };

  async function fetchProfiles() {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get<BackendProfile[]>("/api/faces/");
      setProfiles(response.data.map(mapProfile));
    } catch {
      setError("Failed to load profiles from backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profiles">
      <div className="profiles-header">
        <h1 className="profiles-title">Face Profiles</h1>
        <button className="profiles-add-btn" onClick={() => setShowModal(true)}>
          <UserPlus size={15} />
          Add Profile
        </button>
      </div>

      <p className="profiles-count">Current Pi: {getStoredPiAddress() ?? "Not configured"}</p>

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

      {error && <p className="profiles-error">{error}</p>}

      {loading ? (
        <p className="profiles-empty">Loading profiles...</p>
      ) : filtered.length === 0 ? (
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
                <p className="profile-date">Registered by User #{profile.registeredBy ?? "-"}</p>
              </div>
              {deleteConfirm === profile.id ? (
                <div className="profile-confirm">
                  <span>Remove?</span>
                  <button className="confirm-yes" onClick={() => void handleDelete(profile.id)}>Yes</button>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setError(""); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add Face Profile</h2>
            <p className="modal-desc">
              Register a new profile with name and a clear face image.
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
              />
            </div>
            <div className="modal-field">
              <label>Photo</label>
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="modal-input"
                onChange={(e) => setNewPhoto(e.target.files?.[0] ?? null)}
              />
            </div>
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => { setShowModal(false); setError(""); }}>
                Cancel
              </button>
              <button className="modal-confirm" onClick={() => void handleAdd()} disabled={submitting}>
                {submitting ? "Adding..." : "Add Profile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function mapProfile(profile: BackendProfile): FaceProfile {
  return {
    id: String(profile.id),
    name: profile.name,
    addedAt: profile.created_at.split("T")[0],
    imageUrl: buildApiUrl(`/api/faces/${profile.id}/image`),
    registeredBy: String(profile.registered_by),
  };
}
