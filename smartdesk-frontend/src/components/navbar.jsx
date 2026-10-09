import "../styles/navbar.css";
import { FaBell, FaPlus, FaChevronRight } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import api from "../services/api";

const pageDetails = {
    dashboard: ["Overview", "A clear view of the service desk today"],
    tickets: ["Request queue", "Find, filter, and move requests forward"],
    "create-ticket": ["New request", "Give the support team the context they need"],
    users: ["People & access", "Manage accounts, roles, and access"],
    profile: ["My account", "Your profile and security settings"],
    reports: ["Insights & reports", "Review service desk performance"],
    settings: ["Configuration", "Manage service categories and priorities"]
};

function readUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
        return {};
    }
}

function Navbar() {
    const location = useLocation();
    const user = readUser();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const notificationRef = useRef(null);

    const section = location.pathname.split("/").filter(Boolean)[0] || "dashboard";
    const [title, subtitle] = pageDetails[section] || pageDetails.dashboard;
    const role =
        typeof user?.role === "string"
            ? user.role
            : user?.role?.role || user?.role_name || user?.rolename || "User";
    const initial = (user?.firstname || user?.username || "U").charAt(0).toUpperCase();
    const canCreate = role === "Admin" || role === "Employee";

    const loadUnreadCount = async () => {
        try {
            const response = await api.get("/notifications/unread-count");
            setUnreadCount(response.data.count || 0);
        } catch {
            // Preserve a usable header when the notifications service is unavailable.
        }
    };

    const loadNotifications = async () => {
        setLoadingNotifications(true);
        try {
            const response = await api.get("/notifications", { params: { per_page: 10 } });
            setNotifications(response.data.data || []);
        } catch {
            setNotifications([]);
        } finally {
            setLoadingNotifications(false);
        }
    };

    useEffect(() => {
        loadUnreadCount();
        const timer = window.setInterval(loadUnreadCount, 30000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const closeOnOutsideClick = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", closeOnOutsideClick);
        return () => document.removeEventListener("mousedown", closeOnOutsideClick);
    }, []);

    const toggleNotifications = () => {
        setIsOpen((current) => {
            if (!current) loadNotifications();
            return !current;
        });
    };

    const markRead = async (notification) => {
        if (!notification.read_at) {
            try {
                await api.put(\`/notifications/\${notification.id}/read\`);
                setNotifications((current) => current.map((item) =>
                    item.id === notification.id
                        ? { ...item, read_at: new Date().toISOString() }
                        : item
                ));
                setUnreadCount((current) => Math.max(0, current - 1));
            } catch (error) {
                console.error("Could not mark notification as read:", error);
            }
        }
        setIsOpen(false);
    };

    const markAllRead = async () => {
        try {
            await api.put("/notifications/read-all");
            setNotifications((current) => current.map((item) => ({
                ...item,
                read_at: item.read_at || new Date().toISOString()
            })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Could not mark notifications as read:", error);
        }
    };

    return (
        <header className="navbar redesign-navbar">
            <div className="navbar-leading">
                <div className="navbar-breadcrumb">
                    <span>SMARTDESK</span>
                    <FaChevronRight />
                    <strong>{title}</strong>
                </div>
                <div className="navbar-heading">
                    <h2>{title}</h2>
                    <p>{subtitle}</p>
                </div>
            </div>

            <div className="navbar-right">
                <span className="navbar-workspace-tag">
                    <i />
                    Workspace
                </span>

                {canCreate && (
                    <Link className="navbar-new-request" to="/create-ticket">
                        <FaPlus />
                        <span>New request</span>
                    </Link>
                )}

                <div className="notification-wrap" ref={notificationRef}>
                    <button
                        type="button"
                        className="notification"
                        aria-label="Notifications"
                        aria-expanded={isOpen}
                        onClick={toggleNotifications}
                    >
                        <FaBell />
                        {unreadCount > 0 && (
                            <span className="notification-badge">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {isOpen && (
                        <div className="notification-panel">
                            <div className="notification-panel-header">
                                <div>
                                    <strong>Activity inbox</strong>
                                    <span>{unreadCount} unread</span>
                                </div>
                                {unreadCount > 0 && (
                                    <button type="button" onClick={markAllRead}>Mark all read</button>
                                )}
                            </div>
                            <div className="notification-list">
                                {loadingNotifications && (
                                    <p className="notification-empty">Loading activity...</p>
                                )}
                                {!loadingNotifications && notifications.length === 0 && (
                                    <p className="notification-empty">You are all caught up.</p>
                                )}
                                {!loadingNotifications && notifications.map((item) => (
                                    <Link
                                        key={item.id}
                                        to={item.action_url || "/dashboard"}
                                        className={\`notification-item \${item.read_at ? "" : "is-unread"}\`}
                                        onClick={() => markRead(item)}
                                    >
                                        <span className="notification-item-dot" />
                                        <div>
                                            <p>{item.message}</p>
                                            <time>
                                                {new Date(item.date).toLocaleString([], {
                                                    dateStyle: "medium",
                                                    timeStyle: "short"
                                                })}
                                            </time>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <Link className="user-info" to="/profile" aria-label="Open your profile">
                    <span className="navbar-avatar">{initial}</span>
                    <div>
                        <h4>{user?.firstname || user?.username || "User"}</h4>
                        <p>{role}</p>
                    </div>
                    <FaChevronRight className="navbar-profile-arrow" />
                </Link>
            </div>
        </header>
    );
}

export default Navbar;
