import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "../styles/form.css";

function TicketForm({ mode }) {
    const navigate = useNavigate();
    const { id } = useParams();

    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const role =
        typeof user?.role === "string"
            ? user.role
            : user?.role?.role || user?.role_name || user?.rolename;

    const isManagerEditor =
        mode === "edit" && role === "Manager";
    const isAgentEditor =
        mode === "edit" && role === "IT Support Agent";
    const isRestrictedEditor =
        isManagerEditor || isAgentEditor;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priorityid, setPriorityid] = useState("");
    const [categoryid, setCategoryid] = useState("");
    const [statusid, setStatusid] = useState("");

    const [priorities, setPriorities] = useState([]);
    const [categories, setCategories] = useState([]);
    const [statuses, setStatuses] = useState([]);

    const [loading, setLoading] = useState(false);

    const loadDropdowns = useCallback(async () => {
        try {
            const [
                priorityResponse,
                categoryResponse,
                statusResponse
            ] = await Promise.all([
                api.get("/priorities"),
                api.get("/categories"),
                api.get("/statuses")
            ]);

            setPriorities(priorityResponse.data);
            setCategories(categoryResponse.data);
            setStatuses(statusResponse.data);
        } catch (error) {
            console.error("Failed to load ticket form options:", error);
        }
    }, []);

    const loadTicket = useCallback(async () => {
        try {
            const response = await api.get(`/tickets/${id}`);
            const ticket = response.data;

            setTitle(ticket.title);
            setDescription(ticket.description);
            setPriorityid(ticket.priorityid);
            setCategoryid(ticket.categoryid);
            setStatusid(ticket.statusid);
        } catch (error) {
            console.error("Failed to load ticket:", error);
            alert(
                error.response?.data?.message ||
                "Failed to load the ticket."
            );
            navigate("/tickets");
        }
    }, [id, navigate]);

    useEffect(() => {
        loadDropdowns();

        if (mode === "edit") {
            loadTicket();
        }
    }, [loadDropdowns, loadTicket, mode]);

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);

        try {
            const data = isManagerEditor
                ? {
                    categoryid,
                    statusid
                }
                : isAgentEditor
                ? {
                    categoryid,
                    priorityid
                }
                : {
                    title,
                    description,
                    priorityid,
                    categoryid
                };

            if (mode === "create") {
                await api.post("/tickets", data);
                alert("Ticket created successfully!");
            } else {
                await api.put(`/tickets/${id}`, data);
                alert("Ticket updated successfully!");
            }

            navigate("/tickets");
        } catch (error) {
            console.error("Failed to save ticket:", error);

            alert(
                error.response?.data?.message ||
                "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <form className="ticket-form" onSubmit={handleSubmit}>
            <div className="ticket-form-heading">
                <span className="form-eyebrow">
                    {mode === "create" ? "New request" : `Ticket #${id}`}
                </span>
                <h1>
                    {mode === "create"
                        ? "Create a support ticket"
                        : "Edit ticket details"}
                </h1>
                <p>
                    {mode === "create"
                        ? "Describe the issue clearly so the support team can help faster."
                        : "Review the request and update the fields available to your role."}
                </p>
            </div>

            {isRestrictedEditor && (
                <p className="form-permission-note">
                    {isAgentEditor
                        ? "You can update only the ticket priority and category."
                        : "You can update only the ticket status and category."}
                </p>
            )}

            <div className="ticket-form-primary-fields">
            <div className="form-group">
                <label>Title</label>

                <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    disabled={isRestrictedEditor}
                    required={!isRestrictedEditor}
                />
            </div>

            <div className="form-group">
                <label>Description</label>

                <textarea
                    rows="6"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    disabled={isRestrictedEditor}
                    required={!isRestrictedEditor}
                />
            </div>

            </div>

            <aside className="ticket-form-classification">
            <div className="form-row">
                <div className="form-group">
                    <label>Category</label>

                    <select
                        value={categoryid}
                        onChange={(event) => setCategoryid(event.target.value)}
                        required
                    >
                        <option value="">Select Category</option>

                        {categories.map((category) => (
                            <option
                                key={category.id}
                                value={category.id}
                            >
                                {category.category}
                            </option>
                        ))}
                    </select>
                </div>

                {isManagerEditor ? (
                    <div className="form-group">
                        <label>Status</label>

                        <select
                            value={statusid}
                            onChange={(event) => setStatusid(event.target.value)}
                            required
                        >
                            <option value="">Select Status</option>

                            {statuses.map((status) => (
                                <option
                                    key={status.id}
                                    value={status.id}
                                >
                                    {status.status}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="form-group">
                        <label>Priority</label>

                        <select
                            value={priorityid}
                            onChange={(event) => setPriorityid(event.target.value)}
                            required
                        >
                            <option value="">Select Priority</option>

                            {priorities.map((priority) => (
                                <option
                                    key={priority.id}
                                    value={priority.id}
                                >
                                    {priority.priority}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            </aside>

            <div className="ticket-form-actions">
                <button
                    type="button"
                    className="form-cancel-btn"
                    onClick={() => navigate("/tickets")}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                >
                    {loading
                        ? "Saving..."
                        : mode === "create"
                        ? "Create Ticket"
                        : "Save Changes"}
                </button>
            </div>
        </form>
    );
}

export default TicketForm;
