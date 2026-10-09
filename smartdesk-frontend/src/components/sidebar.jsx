import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
    FaHome,
    FaTicketAlt,
    FaPlusCircle,
    FaUsers,
    FaChartBar,
    FaUser,
    FaSignOutAlt,
    FaCog,
    FaChevronRight,
    FaLayerGroup,
    FaShieldAlt,
} from "react-icons/fa";

import api from "../services/api";
import "../styles/sidebar.css";

function readUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
        return {};
    }
}

function Sidebar() {
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const user = readUser();

    const role =
        typeof user?.role === "string"
            ? user.role
            : user?.role?.role || user?.role_name || user?.rolename || "User";

    const navClassName = ({ isActive }) => isActive ? "active" : "";

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);

        try {
            await api.post("/logout");
        } catch (error) {
            console.error("Logout request failed:", error);
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/", { replace: true });
        }
    };

    const isEmployee = role === "Employee";
    const isAdminOrManager = role === "Admin" || role === "Manager";
    const isSupportAgent = role === "IT Support Agent";

    return (
        <aside className="sidebar redesign-sidebar">
            <div className="sidebar-top">
                <Link className="sidebar-brand" to="/dashboard" aria-label="SmartDesk overview">
                    <span className="sidebar-brand-emblem">
                        <img
                            className="sidebar-brand-mark"
                            src="/smartdesk-logo.svg"
                            alt=""
                        />
                    </span>
                    <span className="sidebar-brand-copy">
                        <strong>smartdesk<span>.</span></strong>
                        <small>OPERATIONS PLATFORM</small>
                    </span>
                </Link>

                <div className="sidebar-workspace-switcher">
                    <span className="workspace-monogram"><FaLayerGroup /></span>
                    <span className="workspace-switcher-copy">
                        <strong>Service operations</strong>
                        <small>Internal workspace</small>
                    </span>
                    <FaChevronRight className="workspace-switcher-chevron" />
                </div>
            </div>

            <nav className="sidebar-navigation" aria-label="Main navigation">
                <div className="sidebar-nav-group">
                    <span className="sidebar-section-label">WORKSPACE</span>
                    <ul>
                        <li>
                            <NavLink to="/dashboard" className={navClassName} title="Overview">
                                <FaHome /><span>Overview</span><i className="nav-active-marker" />
                            </NavLink>
                        </li>

                        <li>
                            <NavLink to="/tickets" className={navClassName} title={isSupportAgent ? "Assigned queue" : isEmployee ? "My requests" : "Request queue"}>
                                <FaTicketAlt />
                                <span>{isSupportAgent ? "Assigned queue" : isEmployee ? "My requests" : "Request queue"}</span>
                                <i className="nav-active-marker" />
                            </NavLink>
                        </li>

                        {(role === "Admin" || isEmployee) && (
                            <li>
                                <NavLink to="/create-ticket" className={navClassName} title="New request">
                                    <FaPlusCircle /><span>New request</span><i className="nav-active-marker" />
                                </NavLink>
                            </li>
                        )}

                        {isAdminOrManager && (
                            <li>
                                <NavLink to="/reports" className={navClassName} title="Insights & reports">
                                    <FaChartBar /><span>Insights & reports</span><i className="nav-active-marker" />
                                </NavLink>
                            </li>
                        )}
                    </ul>
                </div>

                {role === "Admin" && (
                    <div className="sidebar-nav-group">
                        <span className="sidebar-section-label">ADMINISTRATION</span>
                        <ul>
                            <li>
                                <NavLink to="/users" className={navClassName} title="People & access">
                                    <FaUsers /><span>People &amp; access</span><i className="nav-active-marker" />
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/settings/reference" className={navClassName} title="Service configuration">
                                    <FaCog /><span>Configuration</span><i className="nav-active-marker" />
                                </NavLink>
                            </li>
                        </ul>
                    </div>
                )}

                <div className="sidebar-nav-group">
                    <span className="sidebar-section-label">PERSONAL</span>
                    <ul>
                        <li>
                            <NavLink to="/profile" className={navClassName} title="My account">
                                <FaUser /><span>My account</span><i className="nav-active-marker" />
                            </NavLink>
                        </li>
                    </ul>
                </div>
            </nav>

            <div className="sidebar-bottom">
                <div className="sidebar-account-card">
                    <span className="sidebar-account-avatar">
                        {(user?.firstname || user?.username || "U").charAt(0).toUpperCase()}
                    </span>
                    <span className="sidebar-account-copy">
                        <strong>{user?.firstname || user?.username || "Signed-in user"}</strong>
                        <small><FaShieldAlt /> {role}</small>
                    </span>
                    <span className="sidebar-account-state" title="Signed in" />
                </div>

                <button
                    type="button"
                    className="logout-button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    <FaSignOutAlt />
                    <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
                </button>
                <div className="sidebar-build-note">SMARTDESK <span>•</span> SERVICE DESK</div>
            </div>
        </aside>
    );
}

export default Sidebar;
