import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
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
  FaChartLine,
  FaRegCompass,
  FaFileAlt,
} from "react-icons/fa";
import DashboardLayout from "../layouts/DashboardLayout";
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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const role =
    typeof user?.role === "string"
      ? user.role
      : user?.role?.role || user?.role_name || user?.rolename || "User";
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
        <div className="workspace-loading">
          <span className="loading-pulse" />
          <div>
            <strong>Preparing your workspace</strong>
            <p>Loading the latest service desk activity...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !dashboard) {
    return (
      <DashboardLayout>
        <div className="dashboard-error">
          <strong>We couldn't load this overview.</strong>
          <p>{error || "Dashboard data is unavailable."}</p>
          <Link to="/tickets">Go to the request queue <FaArrowRight /></Link>
        </div>
      </DashboardLayout>
    );
  }

  const stats = dashboard.statistics || {};
  const activities = dashboard.activityLog || [];
  const recentTickets = dashboard.recentTickets || [];
  const total = Number(stats.total) || 0;
  const closed = Number(stats.closed) || 0;
  const closedPercent = total > 0 ? Math.min(100, Math.round((closed / total) * 100)) : 0;
  const firstName = user.firstname || user.name || user.username || "there";
  const canCreate = role === "Admin" || role === "Employee";
  const canSeeReports = role === "Admin" || role === "Manager";

  return (
    <DashboardLayout>
      <div className="dashboard-page redesigned-overview">
        <header className="overview-header">
          <div className="overview-header-copy">
            <div className="overview-overline">
              <span className="page-eyebrow">OPERATIONS OVERVIEW</span>
              <span className="overview-divider" />
              <span className="overview-date">
                {new Date().toLocaleDateString([], {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <h1 className="page-title">Welcome back, {firstName}.</h1>
            <p className="page-subtitle">
              Everything happening across your service desk, in one place.
            </p>
          </div>

          <div className="overview-actions">
            {canCreate && (
              <Link className="primary-button" to="/create-ticket">
                <FaPlus /> Start a request
              </Link>
            )}
            <Link className="secondary-button" to="/tickets">
              Open queue <FaArrowRight />
            </Link>
          </div>
        </header>

        <section className="overview-pulse-panel">
          <div className="overview-pulse-heading">
            <div>
              <span className="panel-kicker">LIVE SNAPSHOT</span>
              <h2>Workspace pulse</h2>
              <p>Current totals returned by your service desk.</p>
            </div>
            <span className="overview-data-status"><i /> Connected workspace</span>
          </div>

          <div className="overview-metrics">
            <article className="overview-metric metric-open">
              <div className="overview-metric-top">
                <span className="overview-metric-icon"><FaFolderOpen /></span>
                <span className="overview-metric-caption">01 / OPEN</span>
              </div>
              <strong>{stats.open ?? 0}</strong>
              <span className="overview-metric-label">Open requests</span>
              <p>Requests awaiting resolution</p>
            </article>

            <article className="overview-metric metric-assigned">
              <div className="overview-metric-top">
                <span className="overview-metric-icon"><FaClock /></span>
                <span className="overview-metric-caption">02 / ASSIGNED</span>
              </div>
              <strong>{stats.assigned ?? 0}</strong>
              <span className="overview-metric-label">Assigned work</span>
              <p>Requests in the support queue</p>
            </article>

            <article className="overview-metric metric-closed">
              <div className="overview-metric-top">
                <span className="overview-metric-icon"><FaCheckCircle /></span>
                <span className="overview-metric-caption">03 / CLOSED</span>
              </div>
              <strong>{stats.closed ?? 0}</strong>
              <span className="overview-metric-label">Resolved requests</span>
              <p>Completed service requests</p>
            </article>

            <article className="overview-metric metric-total">
              <div className="overview-metric-top">
                <span className="overview-metric-icon"><FaTicketAlt /></span>
                <span className="overview-metric-caption">04 / ALL TIME</span>
              </div>
              <strong>{stats.total ?? 0}</strong>
              <span className="overview-metric-label">Total requests</span>
              <p>Records visible to your role</p>
            </article>
          </div>
        </section>

        <div className="overview-content-grid">
          <div className="overview-main-column">
            <section className="overview-request-panel">
              <div className="panel-heading-row">
                <div>
                  <span className="panel-kicker">THE LATEST</span>
                  <h2>Recent requests</h2>
                  <p>The newest tickets available in your workspace.</p>
                </div>
                <Link className="panel-text-link" to="/tickets">
                  View queue <FaArrowRight />
                </Link>
              </div>

              {recentTickets.length === 0 ? (
                <div className="overview-empty">
                  <span><FaTicketAlt /></span>
                  <strong>No requests to show yet</strong>
                  <p>New tickets will appear here when they are created.</p>
                  {canCreate && <Link className="secondary-button" to="/create-ticket">Create first request <FaArrowRight /></Link>}
                </div>
              ) : (
                <div className="overview-request-list">
                  {recentTickets.map((ticket) => {
                    const status = ticket.status?.status || "Not set";
                    const priority = ticket.priority?.priority || "Not set";
                    return (
                      <Link className="overview-request-row" key={ticket.id} to={`/tickets/${ticket.id}`}>
                        <span className="request-id-block">
                          <small>REQUEST</small>
                          <strong>#{ticket.id}</strong>
                        </span>
                        <span className="request-main-copy">
                          <strong>{ticket.title}</strong>
                          <span>{ticket.category?.category || "Uncategorised"} <i /> {formatActivityDate(ticket.creation_date)}</span>
                        </span>
                        <span className="request-row-state">
                          <span className={`request-status-pill status-${status.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{status}</span>
                          <small className={`request-priority priority-${priority.toLowerCase()}`}>{priority} priority</small>
                        </span>
                        <span className="request-row-arrow"><FaArrowRight /></span>
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="overview-panel-footer">
                <span><FaRegCompass /> Queue overview</span>
                <Link to="/tickets">Explore all requests <FaArrowRight /></Link>
              </div>
            </section>

            {role === "Admin" && (
              <section className="overview-activity-panel">
                <div className="panel-heading-row">
                  <div>
                    <span className="panel-kicker">AUDIT TRAIL</span>
                    <h2>Latest activity</h2>
                    <p>Recent actions recorded across the ticket workflow.</p>
                  </div>
                  <span className="activity-total-count">{activities.length} entries</span>
                </div>

                {activities.length === 0 ? (
                  <div className="overview-empty compact-empty">
                    <span><FaHistory /></span>
                    <strong>No activity recorded</strong>
                    <p>Ticket updates and comments will appear here.</p>
                  </div>
                ) : (
                  <div className="overview-activity-list">
                    {activities.slice(0, 8).map((activity) => {
                      const Icon = activityIcons[activity.type] || FaHistory;
                      return (
                        <article className="overview-activity-row" key={activity.id}>
                          <span className="activity-row-icon"><Icon /></span>
                          <div className="activity-row-copy">
                            <p>
                              <strong>{displayName(activity.user)}</strong>{" "}
                              {lowerFirst(activity.action)}
                            </p>
                            <Link to={activity.ticket?.id ? `/tickets/${activity.ticket.id}` : "/tickets"}>
                              {activity.ticket?.title || `Ticket #${activity.ticket?.id || "—"}`}
                              <FaArrowRight />
                            </Link>
                          </div>
                          <time>{formatActivityDate(activity.date)}</time>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="overview-side-column">
            <section className="resolution-card">
              <div className="resolution-card-top">
                <span className="panel-kicker">RESOLUTION TRACKER</span>
                <span className="resolution-icon"><FaChartLine /></span>
              </div>
              <h2>Closure overview</h2>
              <p>Closed requests compared with all records currently visible to you.</p>
              <div className="resolution-count">
                <strong>{closed}</strong><span>of {total} requests closed</span>
              </div>
              <div
                className="resolution-track"
                role="progressbar"
                aria-label="Share of tickets closed"
                aria-valuenow={closedPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${closedPercent}%` }} />
              </div>
              <div className="resolution-legend">
                <span>{closedPercent}% closed</span>
                <span>{Math.max(total - closed, 0)} remaining</span>
              </div>
              <div className="resolution-card-footer">
                <span>Based on live ticket totals</span>
              </div>
            </section>

            <section className="overview-shortcuts-panel">
              <div className="panel-heading-row">
                <div>
                  <span className="panel-kicker">SHORTCUTS</span>
                  <h2>Go somewhere</h2>
                </div>
              </div>

              <Link className="overview-shortcut" to="/tickets">
                <span className="shortcut-icon"><FaTicketAlt /></span>
                <span><strong>Request queue</strong><small>Find and manage tickets</small></span>
                <FaArrowRight />
              </Link>
              {canSeeReports && (
                <Link className="overview-shortcut" to="/reports">
                  <span className="shortcut-icon"><FaChartLine /></span>
                  <span><strong>Service insights</strong><small>Open performance reports</small></span>
                  <FaArrowRight />
                </Link>
              )}
              <Link className="overview-shortcut" to="/profile">
                <span className="shortcut-icon"><FaFileAlt /></span>
                <span><strong>Account settings</strong><small>Profile and security</small></span>
                <FaArrowRight />
              </Link>
            </section>

            <section className="overview-note-card">
              <span className="overview-note-mark">SD</span>
              <div>
                <span className="panel-kicker">A SMALL REMINDER</span>
                <h3>Good requests start with context.</h3>
                <p>A clear title and useful description help the team understand what needs attention.</p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
