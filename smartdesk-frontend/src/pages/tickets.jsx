import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaEdit,
    FaTrash,
    FaEye,
    FaUserPlus,
    FaPlus,
    FaSortAmountDown,
    FaUndo,
    FaSearch,
    FaArrowRight,
    FaFilter,
    FaCalendarAlt,
    FaTicketAlt,
    FaTimes,
} from "react-icons/fa";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import "../styles/ticket.css";

function readUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
}

function formatDate(value) {
    if (!value) return "Date not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

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

    const user = readUser();
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
                api.get("/statuses"),
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
                    sort: sortNewest ? "newest" : "oldest",
                },
            });

            setTickets(archived ? response.data.data || [] : response.data.tickets || []);
            setPagination(
                archived
                    ? {
                          current_page: response.data.current_page || 1,
                          last_page: response.data.last_page || 1,
                          total: response.data.total || 0,
                      }
                    : response.data.pagination || { current_page: 1, last_page: 1, total: 0 },
            );
        } catch (error) {
            console.error("Failed to load tickets:", error);
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
        const confirmed = window.confirm(
            "Archive this ticket? It will leave active queues but can be restored later.",
        );
        if (!confirmed) return;

        try {
            await api.delete(`/tickets/${id}`);
            alert("Ticket archived successfully.");
            loadTickets();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Failed to archive ticket.");
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
            alert(error.response?.data?.message || "Failed to claim ticket.");
        }
    }

    function clearFilters() {
        setCategoryId("");
        setStatusId("");
        setSelectedDate("");
        setSearch("");
        setPage(1);
    }

    function changeView(nextView) {
        setTicketView(nextView);
        setPage(1);
    }

    const canEditTicket = (ticket) =>
        role === "Admin" ||
        role === "Manager" ||
        (role === "IT Support Agent" &&
            ticket.assignedto !== null &&
            Number(ticket.assignedto) === Number(user?.id)) ||
        (role === "Employee" && ticket.assignedto === null && ticket.returnedto === null);

    const hasActiveFilters = Boolean(search || categoryId || statusId || selectedDate);
    const canCreate = role === "Admin" || role === "Employee";
    const pageTitle =
        ticketView === "archived"
            ? "Archive"
            : ticketView === "returned"
            ? "Returned requests"
            : ticketView === "unassigned"
            ? "Unassigned queue"
            : role === "IT Support Agent"
            ? "Assigned queue"
            : role === "Employee"
            ? "My requests"
            : "Request queue";

    return (
        <DashboardLayout>
            <div className="queue-page">
                <header className="queue-page-header">
                    <div className="queue-heading-copy">
                        <div className="queue-breadcrumb">
                            <span>WORKSPACE</span><i /><span>REQUEST CENTER</span>
                        </div>
                        <h1>{pageTitle}</h1>
                        <p>Keep work moving. Find the request, inspect its details, and take the next step.</p>
                    </div>

                    <div className="queue-heading-actions">
                        <div className="queue-total-counter">
                            <span className="queue-total-icon"><FaTicketAlt /></span>
                            <span><strong>{pagination.total}</strong><small>records found</small></span>
                        </div>
                        {canCreate && (
                            <button type="button" className="create-btn queue-create-btn" onClick={() => navigate("/create-ticket")}>
                                <FaPlus /> <span>New request</span>
                            </button>
                        )}
                    </div>
                </header>

                <section className="queue-control-panel">
                    <div className="queue-control-top">
                        <div>
                            <span className="panel-kicker">BROWSE REQUESTS</span>
                            <h2>Find the right record</h2>
                        </div>
                        <span className="queue-sort-summary">
                            <FaSortAmountDown /> {sortNewest ? "Newest first" : "Oldest first"}
                        </span>
                    </div>

                    {(role === "Admin" || role === "Manager" || role === "IT Support Agent") && (
                        <div className="ticket-toggle queue-view-switcher" aria-label="Request views">
                            <button
                                type="button"
                                className={ticketView === "default" ? "active" : ""}
                                onClick={() => changeView("default")}
                            >
                                {role === "IT Support Agent" ? "Assigned to me" : "All requests"}
                            </button>
                            {role !== "Manager" && (
                                <button
                                    type="button"
                                    className={ticketView === "unassigned" ? "active" : ""}
                                    onClick={() => changeView("unassigned")}
                                >
                                    Unassigned
                                </button>
                            )}
                            {(role === "Admin" || role === "Manager") && (
                                <button
                                    type="button"
                                    className={ticketView === "returned" ? "active" : ""}
                                    onClick={() => changeView("returned")}
                                >
                                    Returned
                                </button>
                            )}
                            {role === "Admin" && (
                                <button
                                    type="button"
                                    className={ticketView === "archived" ? "active" : ""}
                                    onClick={() => changeView("archived")}
                                >
                                    Archive
                                </button>
                            )}
                        </div>
                    )}

                    <div className="filters queue-filters">
                        <label className="queue-search-control">
                            <FaSearch />
                            <input
                                type="search"
                                placeholder="Search by title or keyword..."
                                value={search}
                                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                                aria-label="Search requests"
                            />
                            {search && (
                                <button type="button" className="queue-clear-search" onClick={() => { setSearch(""); setPage(1); }} aria-label="Clear search">
                                    <FaTimes />
                                </button>
                            )}
                        </label>

                        <label className="queue-select-control">
                            <span>Category</span>
                            <select
                                value={categoryId}
                                onChange={(event) => { setCategoryId(event.target.value); setPage(1); }}
                            >
                                <option value="">All categories</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>{category.category}</option>
                                ))}
                            </select>
                        </label>

                        <label className="queue-select-control">
                            <span>Status</span>
                            <select
                                value={statusId}
                                onChange={(event) => { setStatusId(event.target.value); setPage(1); }}
                            >
                                <option value="">All statuses</option>
                                {statuses.map((status) => (
                                    <option key={status.id} value={status.id}>{status.status}</option>
                                ))}
                            </select>
                        </label>

                        <label className="queue-select-control queue-date-control">
                            <span><FaCalendarAlt /> Created on</span>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(event) => { setSelectedDate(event.target.value); setPage(1); }}
                            />
                        </label>

                        <button
                            type="button"
                            className={`sort-newest-btn queue-sort-button ${sortNewest ? "active" : ""}`}
                            onClick={() => { setSortNewest((current) => !current); setPage(1); }}
                            aria-pressed={sortNewest}
                        >
                            <FaSortAmountDown /> <span>Reverse order</span>
                        </button>

                        {hasActiveFilters && (
                            <button type="button" className="clear-filters-btn queue-reset-button" onClick={clearFilters}>
                                <FaTimes /> Reset
                            </button>
                        )}
                    </div>
                </section>

                <section className="queue-results-panel">
                    <div className="queue-results-heading">
                        <div>
                            <span className="panel-kicker">RESULTS</span>
                            <h2>{loading ? "Updating request list..." : `${tickets.length} on this page`}</h2>
                        </div>
                        <span className="queue-result-range">
                            {pagination.total === 0
                                ? "No records"
                                : `Page ${pagination.current_page} of ${pagination.last_page}`}
                        </span>
                    </div>

                    {loading ? (
                        <div className="queue-loading-state">
                            <span className="loading-pulse" />
                            <div><strong>Loading requests</strong><p>Applying your queue and filter selections.</p></div>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="queue-empty-state">
                            <span><FaFilter /></span>
                            <h3>No matching requests</h3>
                            <p>Try changing your search or clearing one or more filters.</p>
                            {hasActiveFilters && <button type="button" className="secondary-button" onClick={clearFilters}>Clear filters <FaArrowRight /></button>}
                        </div>
                    ) : (
                        <div className="ticket-queue-list">
                            {tickets.map((ticket) => {
                                const status = ticket.status?.status || "Not set";
                                const priority = ticket.priority?.priority || "Not set";
                                const canView = ticketView !== "archived" && !(
                                    role === "IT Support Agent" && ticket.assignedto === null
                                );
                                const canAssign =
                                    ticketView !== "archived" &&
                                    (role === "Admin" || role === "Manager" || role === "IT Support Agent") &&
                                    (
                                        (ticket.assignedto === null && ticket.returnedto === null) ||
                                        ((role === "Admin" || role === "Manager") &&
                                            ticketView === "returned" &&
                                            status === "Returned")
                                    );

                                return (
                                    <article className="ticket-queue-item" key={ticket.id}>
                                        <div className="ticket-queue-id">
                                            <span>SD</span>
                                            <strong>#{ticket.id}</strong>
                                        </div>

                                        <div className="ticket-queue-main">
                                            {canView ? (
                                                <button type="button" className="ticket-queue-title" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                                                    {ticket.title || "Untitled request"} <FaArrowRight />
                                                </button>
                                            ) : (
                                                <strong className="ticket-queue-title-static">{ticket.title || "Untitled request"}</strong>
                                            )}
                                            <div className="ticket-queue-meta">
                                                <span>{ticket.category?.category || "Uncategorised"}</span>
                                                <i />
                                                <span>By {ticket.creator?.firstname || ticket.creator?.username || "Unknown"}</span>
                                                <i />
                                                <span>{formatDate(ticket.creation_date || ticket.creationdate)}</span>
                                            </div>
                                        </div>

                                        <div className="ticket-queue-labels">
                                            <span className={`queue-status-pill status-${status.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{status}</span>
                                            <span className={`queue-priority-pill priority-${priority.toLowerCase()}`}>{priority}</span>
                                        </div>

                                        <div className="ticket-queue-actions">
                                            {canView && (
                                                <button type="button" className="queue-action-btn" title="View request" aria-label={`View ticket ${ticket.id}`} onClick={() => navigate(`/tickets/${ticket.id}`)}>
                                                    <FaEye />
                                                </button>
                                            )}
                                            {ticketView !== "archived" && canEditTicket(ticket) && (
                                                <button type="button" className="queue-action-btn" title="Edit request" aria-label={`Edit ticket ${ticket.id}`} onClick={() => navigate(`/tickets/edit/${ticket.id}`)}>
                                                    <FaEdit />
                                                </button>
                                            )}
                                            {role === "Admin" && ticketView !== "archived" && (
                                                <button type="button" className="queue-action-btn queue-action-danger" title="Archive request" aria-label={`Archive ticket ${ticket.id}`} onClick={() => deleteTicket(ticket.id)}>
                                                    <FaTrash />
                                                </button>
                                            )}
                                            {canAssign && (
                                                <button
                                                    type="button"
                                                    className="queue-action-btn queue-action-assign"
                                                    title={role === "IT Support Agent" ? "Claim request" : "Assign request"}
                                                    aria-label={`Assign ticket ${ticket.id}`}
                                                    onClick={() => role === "IT Support Agent"
                                                        ? claimTicket(ticket.id)
                                                        : navigate(`/tickets/assign/${ticket.id}`)}
                                                >
                                                    <FaUserPlus />
                                                </button>
                                            )}
                                            {role === "Admin" && ticketView === "archived" && (
                                                <button type="button" className="queue-action-btn queue-action-restore" title="Restore request" aria-label={`Restore ticket ${ticket.id}`} onClick={() => restoreTicket(ticket.id)}>
                                                    <FaUndo />
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {!loading && pagination.last_page > 1 && (
                        <footer className="queue-pagination">
                            <span>Showing page {pagination.current_page} of {pagination.last_page} · {pagination.total} total records</span>
                            <div>
                                <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
                                <button type="button" disabled={page >= pagination.last_page} onClick={() => setPage((current) => current + 1)}>Next <FaArrowRight /></button>
                            </div>
                        </footer>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}

export default Tickets;
