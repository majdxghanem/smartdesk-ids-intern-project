import { useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaEnvelope,
  FaIdBadge,
  FaLock,
  FaSave,
  FaShieldAlt,
  FaUser,
} from "react-icons/fa";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import "../styles/profile.css";

function firstValidationError(error) {
  const errors = error.response?.data?.errors;
  return errors ? Object.values(errors).flat()[0] : null;
}

function formatDate(value) {
  if (!value) return "Unknown";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString([], {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

function updateStoredUser(profile) {
  const stored = localStorage.getItem("user");
  const current = stored ? JSON.parse(stored) : {};

  localStorage.setItem(
    "user",
    JSON.stringify({
      ...current,
      id: profile.id,
      firstname: profile.firstname,
      username: profile.username,
      email: profile.email,
      role: profile.role,
    }),
  );
}

function Profile() {
  const [profile, setProfile] = useState(null);
  const [infoForm, setInfoForm] = useState({
    firstname: "",
    email: "",
    current_password: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [infoError, setInfoError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get("/profile");
        const user = response.data.user;

        setProfile(user);
        setInfoForm({
          firstname: user.firstname || "",
          email: user.email || "",
          current_password: "",
        });
      } catch (requestError) {
        setInfoError(
          requestError.response?.data?.message || "Failed to load profile.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function updateInfoField(event) {
    const { name, value } = event.target;
    setInfoForm((current) => ({ ...current, [name]: value }));
  }

  function updatePasswordField(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  }

  async function saveInformation(event) {
    event.preventDefault();
    setSavingInfo(true);
    setInfoError("");
    setInfoMessage("");

    if (
      infoForm.email !== profile.email &&
      !infoForm.current_password.trim()
    ) {
      setInfoError("Enter your current password to change your email.");
      setSavingInfo(false);
      return;
    }

    try {
      const response = await api.put("/profile", infoForm);
      const user = response.data.user;

      setProfile(user);
      updateStoredUser(user);
      setInfoForm({
        firstname: user.firstname || "",
        email: user.email || "",
        current_password: "",
      });
      setInfoMessage(response.data.message);
    } catch (requestError) {
      setInfoError(
        firstValidationError(requestError) ||
          requestError.response?.data?.message ||
          "Failed to update profile.",
      );
    } finally {
      setSavingInfo(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordError("");
    setPasswordMessage("");

    try {
      const response = await api.put("/profile", passwordForm);
      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
      setPasswordMessage(response.data.message);
    } catch (requestError) {
      setPasswordError(
        firstValidationError(requestError) ||
          requestError.response?.data?.message ||
          "Failed to change password.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="profile-state">Loading profile...</div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="profile-alert profile-alert-error">
          {infoError || "Profile is unavailable."}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="profile-page">
        <section className="profile-hero">
          <div className="profile-avatar">
            {profile.firstname?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="profile-hero-copy">
            <span className="profile-eyebrow">My Profile</span>
            <h1>{profile.firstname}</h1>
            <p>@{profile.username}</p>
          </div>
          <span className="profile-role"><FaShieldAlt /> {profile.role}</span>
        </section>

        <div className="profile-layout">
          <aside className="profile-overview-card">
            <h2>Account Overview</h2>
            <div className="profile-overview-item">
              <span><FaIdBadge /></span>
              <div><small>Username</small><strong>@{profile.username}</strong></div>
            </div>
            <div className="profile-overview-item">
              <span><FaEnvelope /></span>
              <div><small>Email</small><strong>{profile.email}</strong></div>
            </div>
            <div className="profile-overview-item">
              <span><FaUser /></span>
              <div><small>Role</small><strong>{profile.role}</strong></div>
            </div>
            <div className="profile-overview-item">
              <span><FaCalendarAlt /></span>
              <div><small>Member since</small><strong>{formatDate(profile.creationdate)}</strong></div>
            </div>
            <div className="profile-account-status">
              <span /> Active account
            </div>
          </aside>

          <main className="profile-forms">
            <section className="profile-form-card">
              <div className="profile-card-heading">
                <span><FaUser /></span>
                <div>
                  <h2>Personal Information</h2>
                  <p>Update your name or email address.</p>
                </div>
              </div>

              {infoMessage && <div className="profile-alert profile-alert-success">{infoMessage}</div>}
              {infoError && <div className="profile-alert profile-alert-error">{infoError}</div>}

              <form onSubmit={saveInformation}>
                <label className="profile-field">
                  <span>Name</span>
                  <input
                    name="firstname"
                    value={infoForm.firstname}
                    onChange={updateInfoField}
                    required
                  />
                </label>

                <label className="profile-field">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    value={infoForm.email}
                    onChange={updateInfoField}
                    required
                  />
                </label>

                <label className="profile-field">
                  <span>Current Password</span>
                  <input
                    type="password"
                    name="current_password"
                    value={infoForm.current_password}
                    onChange={updateInfoField}
                    placeholder="Required only when changing email"
                  />
                  <small>Your name can be changed without a password.</small>
                </label>

                <button
                  type="submit"
                  className="profile-save-btn"
                  disabled={savingInfo}
                >
                  <FaSave /> {savingInfo ? "Saving..." : "Save Information"}
                </button>
              </form>
            </section>

            <section className="profile-form-card">
              <div className="profile-card-heading security">
                <span><FaLock /></span>
                <div>
                  <h2>Change Password</h2>
                  <p>Confirm your current password before choosing a new one.</p>
                </div>
              </div>

              {passwordMessage && <div className="profile-alert profile-alert-success">{passwordMessage}</div>}
              {passwordError && <div className="profile-alert profile-alert-error">{passwordError}</div>}

              <form onSubmit={changePassword}>
                <label className="profile-field">
                  <span>Current Password</span>
                  <input
                    type="password"
                    name="current_password"
                    value={passwordForm.current_password}
                    onChange={updatePasswordField}
                    required
                  />
                </label>
                <div className="profile-password-row">
                  <label className="profile-field">
                    <span>New Password</span>
                    <input
                      type="password"
                      name="password"
                      value={passwordForm.password}
                      onChange={updatePasswordField}
                      minLength="8"
                      required
                    />
                  </label>
                  <label className="profile-field">
                    <span>Confirm New Password</span>
                    <input
                      type="password"
                      name="password_confirmation"
                      value={passwordForm.password_confirmation}
                      onChange={updatePasswordField}
                      minLength="8"
                      required
                    />
                  </label>
                </div>
                <p className="profile-password-guidance">Use at least 8 characters with uppercase, lowercase, and a number.</p>

                <button
                  type="submit"
                  className="profile-save-btn security"
                  disabled={savingPassword}
                >
                  <FaLock /> {savingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            </section>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Profile;
