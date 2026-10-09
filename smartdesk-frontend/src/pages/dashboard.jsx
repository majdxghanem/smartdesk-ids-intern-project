import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaClock,
  FaCommentDots,
  FaEdit,
  FaFolderOpen,
  FaHistory,
  FaPlus,
  FaReply,
  FaTicketAlt,
  FaUndo,
  FaUserCheck,
} from "react-icons/fa";
import DashboardLayout from "../layouts/DashboardLayout";
import StatisticCard from "../components/StatisticCard";
import api from "../services/api";
import "../styles/dashboard.css";

const activityIcons = {
  created: FaPlus,
  updated: FaEdit,
  assigned: FaUserCheck,
  claimed: FaUserCheck,
  comment: FaCommentDots,
  reply: FaReply,
  closed: FaCheckCircle,
  returned: FaUndo,
};

function formatActivityDate(value) {
  if (!value) return "Unknown time";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function displayName(user) {
  if (!user) return "System";

  return user.firstname || user.username || `User #${user.id}`;
}

function lowerFirst(value) {
  if (!value) return "performed an action.";

  return value.charAt(0).toLowerCase() + value.slice(1);
}

function Dashboard() {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : {};
  const role =
    typeof user?.role === "string"
      ? user.role
      : user?.role?.role || user?.role_name || user?.rolename;

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const response = await api.get("/dashboard");

        if (!active) return;

        setDashboard(response.data);
        setError("");
      } catch (requestError) {
        if (!active) return;

        setError(
          requestError.response?.data?.message ||
            "Failed to load the dashboard.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <h2>Loading Dashboard...</h2>
      </DashboardLayout>
    );
  }

  if (error || !dashboard) {
    return (
      <DashboardLayout>
        <div className="dashboard-error">
          {error || "Dashboard data is unavailable."}
        </div>
      </DashboardLayout>
    );
  }

  const activities = dashboard.activityLog || [];
  const recentTickets = dashboard.recentTickets || [];

  return (
    <DashboardLayout>
      <div className="dashboard-page">
        <div className="dashboard-intro">
          <span className="page-eyebrow">Service overview</span>
          <h1 className="page-title">
            Welcome back, {user.firstname || user.name || "User"}
          </h1>
          <p className="page-subtitle">
            Here&apos;s the latest picture of your support workspace.
          </p>
        </div>

        <section className="dashboard-summary-rail" aria-label="Ticket statistics">
        <div className="dashboard-cards">
          <StatisticCard
            title="Open Tickets"
            value={dashboard.statistics.open}
            icon={<FaFolderOpen />}
            color="#2563EB"
          />

          <StatisticCard
            title="Assigned Tickets"
            value={dashboard.statistics.assigned}
            icon={<FaClock />}
            color="#F59E0B"
          />

          <StatisticCard
            title="Closed Tickets"
            value={dashboard.statistics.closed}
            icon={<FaCheckCircle />}
            color="#22C55E"
          />

          <StatisticCard
            title="Total Tickets"
            value={dashboard.statistics.total}
            icon={<FaTicketAlt />}
            color="#7C3AED"
          />
        </div>

        </section>

        <div className="dashboard-lower-grid">
        <section className="dashboard-recent-card">
          <div className="dashboard-activity-header">
            <div><div className="dashboard-activity-title"><FaTicketAlt /><h2>Recent Tickets</h2></div><p>The five newest requests in your current workspace.</p></div>
            <Link className="dashboard-view-all" to="/tickets">View all tickets</Link>
          </div>
          <div className="dashboard-recent-table-wrap">
            <table className="dashboard-recent-table"><thead><tr><th>Ticket</th><th>Category</th><th>Priority</th><th>Status</th><th>Created</th></tr></thead><tbody>{recentTickets.length === 0 ? <tr><td colSpan="5">No tickets are available yet.</td></tr> : recentTickets.map((ticket) => <tr key={ticket.id}><td><Link to={`/tickets/${ticket.id}`}>#{ticket.id} · {ticket.title}</Link></td><td>{ticket.category?.category || "Not set"}</td><td>{ticket.priority?.priority || "Not set"}</td><td>{ticket.status?.status || "Not set"}</td><td>{formatActivityDate(ticket.creation_date)}</td></tr>)}</tbody></table>
          </div>
        </section>

        {role === "Admin" && (
          <section className="dashboard-activity-card">
            <div className="dashboard-activity-header">
              <div>
                <div className="dashboard-activity-title">
                  <FaHistory />
                  <h2>All Ticket Activity</h2>
                </div>
                <p>Newest activity first, accurate to the second</p>
              </div>

              <span className="dashboard-activity-count">
                {activities.length}{" "}
                {activities.length === 1 ? "activity" : "activities"}
              </span>
            </div>

            {activities.length === 0 ? (
              <div className="dashboard-activity-empty">
                No ticket activity has been recorded yet.
              </div>
            ) : (
              <div className="dashboard-activity-list">
                {activities.map((activity) => {
                  const Icon = activityIcons[activity.type] || FaHistory;

                  return (
                    <article
                      className={`dashboard-activity-entry dashboard-activity-${activity.type}`}
                      key={activity.id}
                    >
                      <div className="dashboard-activity-icon">
                        <Icon />
                      </div>

                      <div className="dashboard-activity-content">
                        <div className="dashboard-activity-entry-header">
                          <div>
                            <div className="dashboard-activity-ticket">
                              Ticket #{activity.ticket.id}
                              <span>{activity.ticket.title}</span>
                            </div>

                            <p className="dashboard-activity-action">
                              <strong>{displayName(activity.user)}</strong>{" "}
                              {lowerFirst(activity.action)}
                            </p>
                          </div>

                          <time dateTime={activity.date}>
                            {formatActivityDate(activity.date)}
                          </time>
                        </div>

                        <div className="dashboard-activity-meta">
                          {activity.user?.role && (
                            <span className="dashboard-activity-role">
                              {activity.user.role}
                            </span>
                          )}

                          {activity.details && <p>{activity.details}</p>}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
