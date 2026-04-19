import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Camera, Search, Server, Trash2, UserPlus, Users } from "lucide-react";
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

  const filteredProfiles = useMemo(
    () => profiles.filter((profile) => profile.name.toLowerCase().includes(search.toLowerCase())),
    [profiles, search]
  );

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
      setProfiles((current) => [mapProfile(response.data), ...current]);
      setNewName("");
      setNewPhoto(null);
      setShowModal(false);
    } catch {
      setError("Failed to add profile. Make sure the backend is reachable and the image is valid.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError("");

    try {
      await apiClient.delete(`/api/faces/${id}`);
      setProfiles((current) => current.filter((profile) => profile.id !== id));
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
      setError("Failed to load profiles from the backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-page profiles-page">
      <div className="app-page__header">
        <div>
          <p className="app-page__eyebrow">Recognition Library</p>
          <h1 className="app-page__title">Face Profiles</h1>
          <p className="app-page__subtitle">
            Manage the authorized identities used by the recognizer while keeping the new admin
            workspace clean and focused.
          </p>
        </div>
        <div className="app-page__actions">
          {getStoredPiAddress() && (
            <span className="app-inline-note">
              <Server size={14} />
              {getStoredPiAddress()}
            </span>
          )}
          <button className="app-button app-button--primary" onClick={() => setShowModal(true)}>
            <UserPlus size={15} />
            Add Profile
          </button>
        </div>
      </div>

      {error && <p className="app-error">{error}</p>}

      <div className="profiles-kpis">
        <ProfileKpi icon={<Camera size={20} />} label="Registered Profiles" value={loading ? "..." : String(profiles.length)} meta="Recognition identities on this node" tone="primary" />
        <ProfileKpi icon={<Search size={20} />} label="Search Results" value={loading ? "..." : String(filteredProfiles.length)} meta="Profiles matching the current filter" tone="success" />
        <ProfileKpi icon={<Users size={20} />} label="Registered By" value={loading ? "..." : `${new Set(profiles.map((profile) => profile.registeredBy)).size}`} meta="Distinct backend users who added faces" tone="warning" />
      </div>

      <section className="app-card profiles-toolbar app-fade-up">
        <div className="profiles-search">
          <Search size={16} className="profiles-search__icon" />
          <input
            type="text"
            placeholder="Search profiles..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="app-input profiles-search__input"
          />
        </div>
        <span className="profiles-toolbar__count">
          {filteredProfiles.length} profile{filteredProfiles.length !== 1 ? "s" : ""}
        </span>
      </section>

      {loading ? (
        <p className="app-empty">Loading profiles...</p>
      ) : filteredProfiles.length === 0 ? (
        <section className="app-card profiles-empty app-fade-up">
          <Camera size={26} />
          <div>
            <h2>No profiles found</h2>
            <p>Try a different search term or add a new authorized face profile.</p>
          </div>
        </section>
      ) : (
        <div className="profiles-grid">
          {filteredProfiles.map((profile, index) => (
            <article
              key={profile.id}
              className="app-card profile-card app-fade-up"
              style={{ animationDelay: `${index * 40}ms` } as CSSProperties}
            >
              {profile.imageUrl ? (
                <img src={profile.imageUrl} alt={profile.name} className="profile-card__image" />
              ) : (
                <div className="profile-card__placeholder">
                  <Camera size={24} />
                </div>
              )}
              <div className="profile-card__body">
                <div>
                  <p className="profile-card__name">{profile.name}</p>
                  <p className="profile-card__meta">Added {profile.addedAt}</p>
                  <p className="profile-card__meta">Registered by user #{profile.registeredBy ?? "-"}</p>
                </div>
                {deleteConfirm === profile.id ? (
                  <div className="profile-card__confirm">
                    <span>Remove this profile?</span>
                    <div className="profile-card__confirm-actions">
                      <button className="app-button app-button--danger" onClick={() => void handleDelete(profile.id)}>
                        Confirm
                      </button>
                      <button className="app-button app-button--secondary" onClick={() => setDeleteConfirm(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="profile-card__delete" onClick={() => setDeleteConfirm(profile.id)}>
                    <Trash2 size={15} />
                    Remove
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal && (
        <div className="app-modal-overlay" onClick={() => { setShowModal(false); setError(""); }}>
          <div className="app-card app-modal" onClick={(event) => event.stopPropagation()}>
            <h2 className="app-modal__title">Add Face Profile</h2>
            <p className="app-modal__desc">Register a new identity with a clear image so the recognizer can match it accurately.</p>

            <div className="app-form-grid">
              <div className="app-field">
                <label>Full name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="e.g. Maria Santos"
                  className="app-input"
                  autoFocus
                />
              </div>
              <div className="app-field">
                <label>Photo</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="app-input"
                  onChange={(event) => setNewPhoto(event.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            {error && <p className="app-error">{error}</p>}

            <div className="app-modal__actions">
              <button className="app-button app-button--secondary" onClick={() => { setShowModal(false); setError(""); }}>
                Cancel
              </button>
              <button className="app-button app-button--primary" onClick={() => void handleAdd()} disabled={submitting}>
                {submitting ? "Adding..." : "Add Profile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileKpi({
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
  tone: "primary" | "success" | "warning";
}) {
  const palette =
    tone === "success"
      ? { accent: "#16A34A", soft: "#DCFCE7" }
      : tone === "warning"
        ? { accent: "#EA580C", soft: "#FFEDD5" }
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

function mapProfile(profile: BackendProfile): FaceProfile {
  return {
    id: String(profile.id),
    name: profile.name,
    addedAt: profile.created_at.split("T")[0],
    imageUrl: buildApiUrl(`/api/faces/${profile.id}/image`),
    registeredBy: String(profile.registered_by),
  };
}
