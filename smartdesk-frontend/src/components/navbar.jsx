import "../styles/navbar.css";
import { FaBell } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import api from "../services/api";

const pageDetails = {
    dashboard: ["Dashboard", "Your service desk at a glance"],
    tickets: ["Tickets", "Track and manage support requests"],
    "create-ticket": ["Create Ticket", "Open a new support request"],
    users: ["User Management", "Manage people, roles, and access"],
    profile: ["My Profile", "Manage your account and security"],
    reports: ["Reports", "Review service desk performance"],
    settings: ["Service Settings", "Manage ticket categories and priorities"]
};

function Navbar() {
    const location = useLocation();
    const storedUser = localStorage.getItem("user");
    let user = {};
    try {
        user = storedUser ? JSON.parse(storedUser) : {};
    } catch {
        user = {};
    }
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

    const loadUnreadCount = async () => {
        try {
            const response = await api.get("/notifications/unread-count");
            setUnreadCount(response.data.count || 0);
        } catch {
            // Session errors are handled globally; the header stays usable on network errors.
        }
    };

    const loadNotifications = async () => {
        setLoadingNotifications(true);
        try {
            const response = await api.get("/notifications", { params: { per_page: 10 } });
            setNotifications(response.data.data || []);
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
            await api.put(`/notifications/${notification.id}/read`);
            setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
            setUnreadCount((current) => Math.max(0, current - 1));
        }
        setIsOpen(false);
    };

    const markAllRead = async () => {
        await api.put("/notifications/read-all");
        setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
        setUnreadCount(0);
    };

    return (

        <header className="navbar">
            <div className="navbar-heading">
                <span>SmartDesk / {title}</span>
                <h2>{title}</h2>
                <p>{subtitle}</p>
            </div>

            <div className="navbar-right">

                <div className="notification-wrap" ref={notificationRef}>
                    <button type="button" className="notification" aria-label="Notifications" aria-expanded={isOpen} onClick={toggleNotifications}>
                        <FaBell />
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
                    </button>

                    {isOpen && (
                        <div className="notification-panel">
                            <div className="notification-panel-header">
                                <div><strong>Notifications</strong><span>{unreadCount} unread</span></div>
                                {unreadCount > 0 && <button type="button" onClick={markAllRead}>Mark all read</button>}
                            </div>
                            <div className="notification-list">
                                {loadingNotifications && <p className="notification-empty">Loading notifications...</p>}
                                {!loadingNotifications && notifications.length === 0 && <p className="notification-empty">You are all caught up.</p>}
                                {!loadingNotifications && notifications.map((item) => (
                                    <Link
                                        key={item.id}
                                        to={item.action_url || "/dashboard"}
                                        className={`notification-item ${item.read_at ? "" : "is-unread"}`}
                                        onClick={() => markRead(item)}
                                    >
                                        <span className="notification-item-dot" />
                                        <div><p>{item.message}</p><time>{new Date(item.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</time></div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <Link className="user-info" to="/profile">
                    <span className="navbar-avatar">{initial}</span>
                    <div>
                        <h4>{user?.firstname || user?.username || "User"}</h4>
                        <p>{role}</p>
                    </div>
                </Link>

            </div>

        </header>

    );

}

export default Navbar;
