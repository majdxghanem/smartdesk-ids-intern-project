import { useEffect, useState } from "react";
import { FaArrowLeft, FaSave, FaUserEdit } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import "../styles/user-management.css";

function firstValidationError(error) {
  const errors = error.response?.data?.errors;
  return errors ? Object.values(errors).flat()[0] : null;
}

function EditUser() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    firstname: "",
    username: "",
    email: "",
    roleid: "",
    password: "",
    password_confirmation: "",
  });
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const [userResponse, rolesResponse] = await Promise.all([
          api.get(`/users/${id}`),
          api.get("/roles"),
        ]);
        const user = userResponse.data.user;

        setRoles(rolesResponse.data);
        setForm({
          firstname: user.firstname || "",
          username: user.username || "",
          email: user.email || "",
          roleid: String(user.roleid || ""),
          password: "",
          password_confirmation: "",
        });
      } catch (requestError) {
        setError(
          requestError.response?.data?.message || "Failed to load the user.",
        );
      } finally {
        setPageLoading(false);
      }
    }

    loadUser();
  }, [id]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = { ...form };

    if (!payload.password) {
      delete payload.password;
      delete payload.password_confirmation;
    }

    try {
      await api.put(`/users/${id}`, payload);
      navigate("/users", {
        replace: true,
        state: { message: "User updated successfully." },
      });
    } catch (requestError) {
      setError(
        firstValidationError(requestError) ||
          requestError.response?.data?.message ||
          "Failed to update the user.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="user-form-page">
        <button
          type="button"
          className="users-back-btn"
          onClick={() => navigate("/users")}
        >
          <FaArrowLeft /> Back to Users
        </button>

        <section className="user-form-card">
          <div className="user-form-heading">
            <span><FaUserEdit /></span>
            <div>
              <h1>Edit User</h1>
              <p>Update account information, role, or reset the password.</p>
            </div>
          </div>

          {error && <div className="users-alert users-alert-error">{error}</div>}

          {pageLoading ? (
            <div className="users-state">Loading user...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="user-form-grid">
                <label className="user-field">
                  <span>Name</span>
                  <input
                    name="firstname"
                    value={form.firstname}
                    onChange={updateField}
                    required
                  />
                </label>

                <label className="user-field">
                  <span>Username</span>
                  <input
                    name="username"
                    value={form.username}
                    onChange={updateField}
                    required
                  />
                </label>

                <label className="user-field user-field-full">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={updateField}
                    required
                  />
                </label>

                <label className="user-field user-field-full">
                  <span>Role</span>
                  <select
                    name="roleid"
                    value={form.roleid}
                    onChange={updateField}
                    required
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.role}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="user-field-full user-form-divider">
                  <strong>Reset Password</strong>
                  <span>Leave empty to keep it, or use 8+ characters with mixed case and a number.</span>
                </div>

                <label className="user-field">
                  <span>New Password</span>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={updateField}
                    minLength="8"
                    placeholder="Optional"
                  />
                </label>

                <label className="user-field">
                  <span>Confirm New Password</span>
                  <input
                    type="password"
                    name="password_confirmation"
                    value={form.password_confirmation}
                    onChange={updateField}
                    minLength="8"
                    placeholder="Repeat new password"
                  />
                </label>
              </div>

              <div className="user-form-actions">
                <button
                  type="button"
                  className="users-secondary-btn"
                  onClick={() => navigate("/users")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="users-primary-btn"
                  disabled={saving}
                >
                  <FaSave /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default EditUser;
