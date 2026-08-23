import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaBan,
  FaCheckCircle,
  FaEdit,
  FaSearch,
  FaTrash,
  FaUserPlus,
  FaUsers,
} from "react-icons/fa";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import "../styles/user-management.css";

function isBanned(user) {
  return Boolean(Number(user.isbanned));
}

function roleName(user) {
  return user.role?.role || "No role";
}

function formatDate(value) {
  if (!value) return "Unknown";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function Users() {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [summary, setSummary] = useState({ total: 0, active: 0, banned: 0 });

  const loadUsers = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get("/users", { params: { search: search || undefined, page, per_page: 20 } });
      setUsers(response.data.users || []);
      setPagination(response.data.pagination || { current_page: 1, last_page: 1, total: 0 });
      setSummary(response.data.summary || { total: 0, active: 0, banned: 0 });
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Failed to load users.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = window.setTimeout(loadUsers, search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers, search]);

  async function toggleBan(user) {
    const banning = !isBanned(user);
    let banreason = null;

    if (banning) {
      banreason = window.prompt(
        `Why are you banning ${user.firstname}? (Optional)`,
        "",
      );

      if (banreason === null) return;
    } else if (!window.confirm(`Unban ${user.firstname}'s account?`)) {
      return;
    }

    setBusyUserId(user.id);
    setMessage("");
    setError("");

    try {
      const response = await api.put(`/users/${user.id}/ban`, {
        isbanned: banning,
        banreason: banreason?.trim() || null,
      });

      setMessage(response.data.message);
      await loadUsers();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          `Failed to ${banning ? "ban" : "unban"} the user.`,
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function deleteUser(user) {
    if (
      !window.confirm(
        `Delete ${user.firstname}'s account permanently? This cannot be undone.`,
      )
    ) {
      return;
    }

    setBusyUserId(user.id);
    setMessage("");
    setError("");

    try {
      const response = await api.delete(`/users/${user.id}`);
      setMessage(response.data.message);
      await loadUsers();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Failed to delete the user.",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="users-page">
        <div className="users-page-header">
          <div>
            <div className="users-title-row">
              <span className="users-title-icon">
                <FaUsers />
              </span>
              <div>
                <h1>User Management</h1>
                <p>Manage accounts, roles, access, and user status.</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="users-primary-btn"
            onClick={() => navigate("/users/create")}
          >
            <FaUserPlus /> Create User
          </button>
        </div>

        <div className="users-summary-grid">
          <div className="users-summary-card">
            <span>Total users</span>
            <strong>{summary.total}</strong>
          </div>
          <div className="users-summary-card users-summary-active">
            <span>Active users</span>
            <strong>{summary.active}</strong>
          </div>
          <div className="users-summary-card users-summary-banned">
            <span>Banned users</span>
            <strong>{summary.banned}</strong>
          </div>
        </div>

        {message && <div className="users-alert users-alert-success">{message}</div>}
        {error && <div className="users-alert users-alert-error">{error}</div>}

        <section className="users-table-card">
          <div className="users-table-toolbar">
            <div>
              <h2>Current Users</h2>
              <p>{pagination.total} matching accounts</p>
            </div>

            <label className="users-search">
              <FaSearch />
              <input
                type="search"
                placeholder="Search name, email, role..."
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              />
            </label>
          </div>

          {loading ? (
            <div className="users-state">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="users-state">No users match your search.</div>
          ) : (
            <div className="users-table-scroll">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const banned = isBanned(user);
                    const isCurrentUser =
                      Number(currentUser?.id) === Number(user.id);
                    const busy = Number(busyUserId) === Number(user.id);

                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="users-person-cell">
                            <span className="users-avatar">
                              {user.firstname?.charAt(0).toUpperCase() || "U"}
                            </span>
                            <div>
                              <strong>{user.firstname}</strong>
                              <span>@{user.username}</span>
                            </div>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className="users-role-badge">
                            {roleName(user)}
                          </span>
                        </td>
                        <td>{formatDate(user.creationdate)}</td>
                        <td>
                          <span
                            className={`users-status-badge ${
                              banned ? "banned" : "active"
                            }`}
                            title={banned ? user.banreason || "Banned" : "Active"}
                          >
                            {banned ? "Banned" : "Active"}
                          </span>
                        </td>
                        <td>
                          {isCurrentUser ? (
                            <span className="users-current-account">
                              Current account
                            </span>
                          ) : (
                            <div className="users-actions">
                              <button
                                type="button"
                                className="users-icon-btn edit"
                                title="Edit user"
                                onClick={() => navigate(`/users/${user.id}/edit`)}
                                disabled={busy}
                              >
                                <FaEdit />
                              </button>
                              <button
                                type="button"
                                className={`users-icon-btn ${
                                  banned ? "unban" : "ban"
                                }`}
                                title={banned ? "Unban user" : "Ban user"}
                                onClick={() => toggleBan(user)}
                                disabled={busy}
                              >
                                {banned ? <FaCheckCircle /> : <FaBan />}
                              </button>
                              <button
                                type="button"
                                className="users-icon-btn delete"
                                title="Delete user"
                                onClick={() => deleteUser(user)}
                                disabled={busy}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {pagination.last_page > 1 && <div className="users-pagination"><span>Page {pagination.current_page} of {pagination.last_page}</span><div><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><button type="button" disabled={page >= pagination.last_page} onClick={() => setPage((current) => current + 1)}>Next</button></div></div>}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default Users;
