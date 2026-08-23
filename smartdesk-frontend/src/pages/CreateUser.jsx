import { useEffect, useState } from "react";
import { FaArrowLeft, FaUserPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import "../styles/user-management.css";

function firstValidationError(error) {
  const errors = error.response?.data?.errors;
  return errors ? Object.values(errors).flat()[0] : null;
}

function CreateUser() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    firstname: "",
    username: "",
    email: "",
    roleid: "",
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRoles() {
      try {
        const response = await api.get("/roles");
        setRoles(response.data);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message || "Failed to load roles.",
        );
      }
    }

    loadRoles();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/users", form);
      navigate("/users", {
        replace: true,
        state: { message: "User created successfully." },
      });
    } catch (requestError) {
      setError(
        firstValidationError(requestError) ||
          requestError.response?.data?.message ||
          "Failed to create the user.",
      );
    } finally {
      setLoading(false);
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
            <span><FaUserPlus /></span>
            <div>
              <h1>Create User</h1>
              <p>Add a new account and choose its access role.</p>
            </div>
          </div>

          {error && <div className="users-alert users-alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="user-form-grid">
              <label className="user-field">
                <span>Name</span>
                <input
                  name="firstname"
                  value={form.firstname}
                  onChange={updateField}
                  placeholder="Full name"
                  required
                />
              </label>

              <label className="user-field">
                <span>Username</span>
                <input
                  name="username"
                  value={form.username}
                  onChange={updateField}
                  placeholder="Username"
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
                  placeholder="name@smartdesk.com"
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

              <label className="user-field">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={updateField}
                  minLength="8"
                  placeholder="8+ chars, mixed case, number"
                  required
                />
              </label>

              <label className="user-field">
                <span>Confirm Password</span>
                <input
                  type="password"
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={updateField}
                  minLength="8"
                  placeholder="Repeat password"
                  required
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
                disabled={loading}
              >
                <FaUserPlus /> {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default CreateUser;
