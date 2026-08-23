import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaEdit,
    FaTrash,
    FaEye,
    FaUserPlus,
    FaPlus,
    FaSortAmountDown,
    FaUndo
} from "react-icons/fa";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import "../styles/ticket.css";

function Tickets() {
    const navigate = useNavigate();

    const [tickets, setTickets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [statusId, setStatusId] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [sortNewest, setSortNewest] = useState(true);
    const [ticketView, setTicketView] = useState("default");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const role =
        typeof user?.role === "string"
            ? user.role
            : user?.role?.role || user?.role_name || user?.rolename;

    useEffect(() => {
        loadFilterOptions();
    }, []);

    async function loadFilterOptions() {
        try {
            const [categoryResponse, statusResponse] = await Promise.all([
                api.get("/categories"),
                api.get("/statuses")
            ]);

            setCategories(categoryResponse.data);
            setStatuses(statusResponse.data);
        } catch (error) {
            console.error("Failed to load ticket filters:", error);
        }
    }

    const loadTickets = useCallback(async () => {
        setLoading(true);

        try {
            const archived = ticketView === "archived";
            const response = await api.get(archived ? "/tickets/archived" : "/tickets", {
                params: {
                    page,
                    per_page: 20,
                    search: search || undefined,
                    assigned:
                        ticketView === "unassigned"
                            ? "unassigned"
                            : ticketView === "returned"
                            ? "returned"
                            : undefined,
                    categoryid: categoryId || undefined,
                    statusid: statusId || undefined,
                    date: selectedDate || undefined,
                    sort: sortNewest ? "newest" : "oldest"
                }
            });

            setTickets(archived ? response.data.data || [] : response.data.tickets || []);
            setPagination(archived ? {
                current_page: response.data.current_page || 1,
                last_page: response.data.last_page || 1,
                total: response.data.total || 0,
            } : response.data.pagination || { current_page: 1, last_page: 1, total: 0 });
        } catch (error) {
            console.error(error);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    }, [categoryId, page, search, selectedDate, sortNewest, statusId, ticketView]);

    useEffect(() => {
        const timer = window.setTimeout(loadTickets, search ? 350 : 0);
        return () => window.clearTimeout(timer);
    }, [loadTickets, search]);

    async function deleteTicket(id) {
        const confirmArchive = window.confirm(
            "Archive this ticket? It will leave active queues but can be restored later."
        );

        if (!confirmArchive) return;

        try {
            await api.delete(`/tickets/${id}`);
            alert("Ticket archived successfully.");
            loadTickets();
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.message ||
                "Failed to archive ticket."
            );
        }
    }

    async function restoreTicket(id) {
        try {
            const response = await api.put(`/tickets/${id}/restore`);
            alert(response.data.message);
            loadTickets();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to restore ticket.");
        }
    }

    async function claimTicket(id) {
        try {
            const response = await api.put(`/tickets/${id}/assign`);
            alert(response.data.message);
            loadTickets();
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Failed to claim ticket."
            );
        }
    }

    function clearFilters() {
        setCategoryId("");
        setStatusId("");
        setSelectedDate("");
        setSearch("");
        setPage(1);
    }

    const canEditTicket = (ticket) =>
        role === "Admin" ||
        role === "Manager" ||
        (role === "IT Support Agent" &&
            ticket.assignedto !== null &&
            Number(ticket.assignedto) === Number(user?.id)) ||
        (role === "Employee" && ticket.assignedto === null && ticket.returnedto === null);

    const hasActiveFilters = categoryId || statusId || selectedDate;

    return (
        <DashboardLayout>
            <div className="page-header">
                <div>
                    <span className="page-eyebrow">Support workspace</span>
                    <h1>Tickets</h1>
                    <p>Review, filter, and manage service requests.</p>
                </div>

                {(role === "Admin" || role === "Employee") && (
                    <button
                        className="create-btn"
                        onClick={() => navigate("/create-ticket")}
                    >
                        <FaPlus /> Create Ticket
                    </button>
                )}
            </div>

            <div className="filters">
                {(role === "Admin" ||
                    role === "Manager" ||
                    role === "IT Support Agent") && (
                    <div className="ticket-toggle">
                        <button
                            type="button"
                            className={ticketView === "default" ? "active" : ""}
                            onClick={() => setTicketView("default")}
                        >
                            {role === "IT Support Agent"
                                ? "My Tickets"
                                : "All Tickets"}
                        </button>

                        {role !== "Manager" && (
                            <button
                                type="button"
                                className={
                                    ticketView === "unassigned" ? "active" : ""
                                }
                                onClick={() => setTicketView("unassigned")}
                            >
                                Unassigned
                            </button>
                        )}

                        {(role === "Admin" || role === "Manager") && (
                            <button
                                type="button"
                                className={
                                    ticketView === "returned" ? "active" : ""
                                }
                                onClick={() => setTicketView("returned")}
                            >
                                Returned Tickets
                            </button>
                        )}

                        {role === "Admin" && (
                            <button type="button" className={ticketView === "archived" ? "active" : ""} onClick={() => { setTicketView("archived"); setPage(1); }}>Archived</button>
                        )}
                    </div>
                )}

                <input
                    type="text"
                    placeholder="Search tickets..."
                    value={search}
                    onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                />

                <select
                    value={categoryId}
                    onChange={(event) => { setCategoryId(event.target.value); setPage(1); }}
                >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.category}
                        </option>
                    ))}
                </select>

                <select
                    value={statusId}
                    onChange={(event) => { setStatusId(event.target.value); setPage(1); }}
                >
                    <option value="">All Statuses</option>
                    {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                            {status.status}
                        </option>
                    ))}
                </select>

                <label className="date-filter">
                    <span>Date</span>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(event) => { setSelectedDate(event.target.value); setPage(1); }}
                    />
                </label>

                <button
                    type="button"
                    className={`sort-newest-btn ${sortNewest ? "active" : ""}`}
                    onClick={() => { setSortNewest((current) => !current); setPage(1); }}
                    aria-pressed={sortNewest}
                >
                    <FaSortAmountDown /> {sortNewest ? "Newest first" : "Oldest first"}
                </button>

                {hasActiveFilters && (
                    <button
                        type="button"
                        className="clear-filters-btn"
                        onClick={clearFilters}
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {loading ? (
                <h2>Loading...</h2>
            ) : (
                <div className="ticket-table-wrapper">
                    <table className="ticket-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Created By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {tickets.length === 0 ? (
                                <tr>
                                    <td className="ticket-empty" colSpan="7">
                                        No tickets match the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                tickets.map((ticket) => (
                                    <tr key={ticket.id}>
                                        <td>{ticket.id}</td>
                                        <td>{ticket.title}</td>
                                        <td>{ticket.category?.category || "Not set"}</td>
                                        <td>
                                            <span
                                                className={`badge ${(ticket.priority?.priority || "").toLowerCase()}`}
                                            >
                                                {ticket.priority?.priority || "Not set"}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${
                                                    ticket.status?.status === "Open"
                                                        ? "open"
                                                        : ticket.status?.status === "In Progress"
                                                        ? "progress"
                                                        : ticket.status?.status === "Returned"
                                                        ? "returned"
                                                        : "closed"
                                                }`}
                                            >
                                                {ticket.status?.status || "Not set"}
                                            </span>
                                        </td>
                                        <td>{ticket.creator?.firstname || ticket.creator?.username || "Unknown"}</td>
                                        <td>
                                            <div className="actions">
                                                {ticketView !== "archived" && !(
                                                    role === "IT Support Agent" &&
                                                    ticket.assignedto === null
                                                ) && (
                                                    <button
                                                        className="action-btn view"
                                                        title="View"
                                                        onClick={() =>
                                                            navigate(
                                                                `/tickets/${ticket.id}`
                                                            )
                                                        }
                                                    >
                                                        <FaEye />
                                                    </button>
                                                )}

                                                {ticketView !== "archived" && canEditTicket(ticket) && (
                                                    <button
                                                        className="action-btn edit"
                                                        title="Edit"
                                                        onClick={() =>
                                                            navigate(`/tickets/edit/${ticket.id}`)
                                                        }
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                )}

                                                {role === "Admin" && ticketView !== "archived" && (
                                                    <button
                                                        className="action-btn delete"
                                                        title="Archive"
                                                        onClick={() => deleteTicket(ticket.id)}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )}

                                                {ticketView !== "archived" && (role === "Admin" ||
                                                    role === "Manager" ||
                                                    role === "IT Support Agent") &&
                                                    ((ticket.assignedto === null && ticket.returnedto === null) ||
                                                        ((role === "Admin" ||
                                                            role === "Manager") &&
                                                            ticketView === "returned" &&
                                                            ticket.status.status ===
                                                                "Returned")) && (
                                                        <button
                                                            className="action-btn assign"
                                                            title="Assign"
                                                            onClick={() => {
                                                                if (
                                                                    role ===
                                                                    "IT Support Agent"
                                                                ) {
                                                                    claimTicket(ticket.id);
                                                                } else {
                                                                    navigate(
                                                                        `/tickets/assign/${ticket.id}`
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <FaUserPlus />
                                                        </button>
                                                    )}

                                                {role === "Admin" && ticketView === "archived" && (
                                                    <button className="action-btn assign" title="Restore" onClick={() => restoreTicket(ticket.id)}><FaUndo /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    {pagination.last_page > 1 && (
                        <div className="ticket-pagination">
                            <span>{pagination.total} tickets</span>
                            <div>
                                <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
                                <span>Page {pagination.current_page} of {pagination.last_page}</span>
                                <button type="button" disabled={page >= pagination.last_page} onClick={() => setPage((current) => current + 1)}>Next</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </DashboardLayout>
    );
}

export default Tickets;
