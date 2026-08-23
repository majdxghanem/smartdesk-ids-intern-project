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
    FaCog
} from "react-icons/fa";

import api from "../services/api";
import "../styles/sidebar.css";


function Sidebar() {
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const user = JSON.parse(localStorage.getItem("user"));

    const role =
        typeof user?.role === "string"
            ? user.role
            : user?.role?.role || user?.role_name || user?.rolename;

    const navClassName = ({ isActive }) => (isActive ? "active" : "");

    const handleLogout = async () => {

        if (isLoggingOut) {
            return;
        }

        setIsLoggingOut(true);

        try {
            await api.post("/logout");
        }
        catch (error) {
            console.error("Logout request failed:", error);
        }
        finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/", { replace: true });
        }

    };

    return (

        <aside className="sidebar">
            <Link className="sidebar-brand" to="/dashboard">
                <img
                    className="sidebar-brand-mark"
                    src="/smartdesk-logo.svg"
                    alt="SmartDesk"
                />
                <span className="sidebar-brand-copy">
                    <strong>SmartDesk</strong>
                    <small>Service workspace</small>
                </span>
            </Link>

            <nav className="sidebar-navigation" aria-label="Main navigation">
                <span className="sidebar-section-label">Workspace</span>
                <ul>
                <li>
                    <NavLink to="/dashboard" className={navClassName}>
                        <FaHome />
                        <span>Dashboard</span>
                    </NavLink>
                </li>

                {(role === "Admin" || role === "Manager") && (

                    <li>
                        <NavLink to="/tickets" className={navClassName}>
                            <FaTicketAlt />
                            <span>Tickets</span>
                        </NavLink>
                    </li>

                )}

                {role === "Employee" && (

                    <li>
                        <NavLink to="/tickets" className={navClassName}>
                            <FaTicketAlt />
                            <span>My Tickets</span>
                        </NavLink>
                    </li>

                )}

                {role === "IT Support Agent" && (

                    <li>
                        <NavLink to="/tickets" className={navClassName}>
                            <FaTicketAlt />
                            <span>Assigned Tickets</span>
                        </NavLink>
                    </li>

                )}

                {(role === "Admin" || role === "Employee") && (

                    <li>
                        <NavLink to="/create-ticket" className={navClassName}>
                            <FaPlusCircle />
                            <span>Create Ticket</span>
                        </NavLink>
                    </li>

                )}

                {role === "Admin" && (

                    <li>
                        <NavLink to="/users" className={navClassName}>
                            <FaUsers />
                            <span>Users</span>
                        </NavLink>
                    </li>

                )}

                {role === "Admin" && (
                    <li>
                        <NavLink to="/settings/reference" className={navClassName}>
                            <FaCog />
                            <span>Service Settings</span>
                        </NavLink>
                    </li>
                )}

                {(role === "Admin" || role === "Manager") && (

                    <li>
                        <NavLink to="/reports" className={navClassName}>
                            <FaChartBar />
                            <span>Reports</span>
                        </NavLink>
                    </li>

                )}

                <li>
                    <NavLink to="/profile" className={navClassName}>
                        <FaUser />
                        <span>Profile</span>
                    </NavLink>
                </li>

                </ul>
            </nav>

            <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
                disabled={isLoggingOut}
            >

                <FaSignOutAlt />
                <span>{isLoggingOut ? "Logging out..." : "Sign out"}</span>

            </button>

        </aside>

    );

}

export default Sidebar;
