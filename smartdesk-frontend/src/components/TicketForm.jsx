import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FaArrowRight,
    FaCheckCircle,
    FaClipboardList,
    FaLightbulb,
    FaShieldAlt,
    FaTag,
} from "react-icons/fa";
import api from "../services/api";
import "../styles/form.css";

function TicketForm({ mode }) {
    const navigate = useNavigate();
    const { id } = useParams();

    let user = null;
    try {
        user = JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        user = null;
    }

    const role =
        typeof user?.role === "string"
            ? user.role
            : user?.role?.role || user?.role_name || user?.rolename;

    const isManagerEditor = mode === "edit" && role === "Manager";
    const isAgentEditor = mode === "edit" && role === "IT Support Agent";
    const isRestrictedEditor = isManagerEditor || isAgentEditor;

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
            const [priorityResponse, categoryResponse, statusResponse] = await Promise.all([
                api.get("/priorities"),
                api.get("/categories"),
                api.get("/statuses"),
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
            const response = await api.get(\`/tickets/\${id}\`);
            const ticket = response.data;
            setTitle(ticket.title || "");
            setDescription(ticket.description || "");
            setPriorityid(ticket.priorityid || "");
            setCategoryid(ticket.categoryid || "");
            setStatusid(ticket.statusid || "");
        } catch (error) {
            console.error("Failed to load ticket:", error);
            alert(error.response?.data?.message || "Failed to load the ticket.");
            navigate("/tickets");
        }
    }, [id, navigate]);

    useEffect(() => {
        loadDropdowns();
        if (mode === "edit") loadTicket();
    }, [loadDropdowns, loadTicket, mode]);

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);

        try {
            const data = isManagerEditor
                ? { categoryid, statusid }
                : isAgentEditor
                ? { categoryid, priorityid }
                : { title, description, priorityid, categoryid };

            if (mode === "create") {
                await api.post("/tickets", data);
                alert("Ticket created successfully!");
            } else {
                await api.put(\`/tickets/\${id}\`, data);
                alert("Ticket updated successfully!");
            }

            navigate("/tickets");
        } catch (error) {
            console.error("Failed to save ticket:", error);
            alert(error.response?.data?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    const selectedCategory = categories.find((item) => String(item.id) === String(categoryid));
    const selectedPriority = priorities.find((item) => String(item.id) === String(priorityid));
    const selectedStatus = statuses.find((item) => String(item.id) === String(statusid));
    const isCreate = mode === "create";

    return (
        <form className="ticket-form redesigned-ticket-form" onSubmit={handleSubmit}>
            <header className="ticket-compose-heading">
                <div>
                    <div className="compose-breadcrumb">
                        <span>REQUEST CENTER</span><i />{isCreate ? "NEW REQUEST" : \`TICKET #\${id}\`}
                    </div>
                    <h1>{isCreate ? "Create a request" : "Update request details"}</h1>
                    <p>
                        {isCreate
                            ? "Give your support team the context they need to get started."
                            : "Review this ticket and update the fields available to your role."}
                    </p>
                </div>
                <div className="compose-heading-mark">
                    <FaClipboardList />
                    <span>{isCreate ? "NEW ENTRY" : \`RECORD #\${id}\`}</span>
                </div>
            </header>

            {isRestrictedEditor && (
                <div className="form-permission-note redesign-permission-note">
                    <FaShieldAlt />
                    <span>
                        {isAgentEditor
                            ? "Your role can update the priority and category for this ticket."
                            : "Your role can update the status and category for this ticket."}
                    </span>
                </div>
            )}

            <div className="ticket-compose-layout">
                <div className="ticket-compose-fields">
                    <section className="ticket-compose-card">
                        <div className="compose-section-heading">
                            <span className="compose-step-number">01</span>
                            <div>
                                <span className="panel-kicker">THE BASICS</span>
                                <h2>Request details</h2>
                                <p>Describe the issue in a way someone else can understand.</p>
                            </div>
                            <span className="compose-required">Required</span>
                        </div>

                        <label className="form-group compose-title-field">
                            <span>Request title <i>Required</i></span>
                            <input
                                type="text"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder="e.g. Unable to access shared drive"
                                disabled={isRestrictedEditor}
                                required={!isRestrictedEditor}
                            />
                            <small>Keep it short and specific so the issue is easy to identify.</small>
                        </label>

                        <label className="form-group compose-description-field">
                            <span>Description <i>Required</i></span>
                            <textarea
                                rows="7"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="What happened? What were you trying to do? Include any steps or error messages that could help."
                                disabled={isRestrictedEditor}
                                required={!isRestrictedEditor}
                            />
                            <small>Useful context makes it easier for the support team to investigate.</small>
                        </label>
                    </section>

                    <section className="ticket-compose-card">
                        <div className="compose-section-heading">
                            <span className="compose-step-number">02</span>
                            <div>
                                <span className="panel-kicker">ROUTING</span>
                                <h2>Classification</h2>
                                <p>Help route the request to the right workflow.</p>
                            </div>
                        </div>

                        <div className="compose-routing-grid">
                            <label className="form-group">
                                <span><FaTag /> Category <i>Required</i></span>
                                <select
                                    value={categoryid}
                                    onChange={(event) => setCategoryid(event.target.value)}
                                    required
                                >
                                    <option value="">Choose a category</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.category}
                                        </option>
                                    ))}
                                </select>
                                <small>Choose the area most related to the issue.</small>
                            </label>

                            {isManagerEditor ? (
                                <label className="form-group">
                                    <span><FaCheckCircle /> Status <i>Required</i></span>
                                    <select
                                        value={statusid}
                                        onChange={(event) => setStatusid(event.target.value)}
                                        required
                                    >
                                        <option value="">Choose a status</option>
                                        {statuses.map((status) => (
                                            <option key={status.id} value={status.id}>
                                                {status.status}
                                            </option>
                                        ))}
                                    </select>
                                    <small>Reflect the request's current workflow stage.</small>
                                </label>
                            ) : (
                                <label className="form-group">
                                    <span><FaShieldAlt /> Priority <i>Required</i></span>
                                    <select
                                        value={priorityid}
                                        onChange={(event) => setPriorityid(event.target.value)}
                                        required
                                    >
                                        <option value="">Choose a priority</option>
                                        {priorities.map((priority) => (
                                            <option key={priority.id} value={priority.id}>
                                                {priority.priority}
                                            </option>
                                        ))}
                                    </select>
                                    <small>Choose how urgently the issue needs attention.</small>
                                </label>
                            )}
                        </div>
                    </section>

                    <div className="ticket-form-actions compose-actions">
                        <button
                            type="button"
                            className="form-cancel-btn"
                            onClick={() => navigate("/tickets")}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? "Saving request..." : isCreate ? "Submit request" : "Save changes"}
                            {!loading && <FaArrowRight />}
                        </button>
                    </div>
                </div>

                <aside className="ticket-compose-aside">
                    <section className="ticket-preview-card">
                        <div className="compose-aside-heading">
                            <span className="preview-icon"><FaClipboardList /></span>
                            <div><span className="panel-kicker">PREVIEW</span><h2>Request summary</h2></div>
                        </div>
                        <div className="ticket-preview-document">
                            <div className="preview-document-top">
                                <span>{isCreate ? "DRAFT REQUEST" : \`TICKET #\${id}\`}</span>
                                <span className="preview-document-dot" />
                            </div>
                            <h3>{title.trim() || "Your request title"}</h3>
                            <p>{description.trim() || "Your description will appear here, helping the support team understand the issue."}</p>
                            <div className="preview-document-tags">
                                <span>{selectedCategory?.category || "No category selected"}</span>
                                <span>{isManagerEditor ? selectedStatus?.status || "Status not selected" : selectedPriority?.priority || "Priority not set"}</span>
                            </div>
                        </div>
                        <p className="preview-disclaimer">Preview only. Your request is saved when you submit the form.</p>
                    </section>

                    <section className="compose-guidance-card">
                        <div className="compose-aside-heading">
                            <span className="guidance-icon"><FaLightbulb /></span>
                            <div><span className="panel-kicker">QUICK GUIDE</span><h2>Make it helpful</h2></div>
                        </div>
                        <div className="guidance-item">
                            <span>01</span>
                            <div><strong>Name the issue</strong><p>Use a title that says what isn't working.</p></div>
                        </div>
                        <div className="guidance-item">
                            <span>02</span>
                            <div><strong>Add useful detail</strong><p>Include the steps, error text, or impact.</p></div>
                        </div>
                        <div className="guidance-item">
                            <span>03</span>
                            <div><strong>Classify carefully</strong><p>Pick the closest category and priority.</p></div>
                        </div>
                    </section>

                    <div className="compose-privacy-note">
                        <FaShieldAlt />
                        <p><strong>Workspace access applies</strong><span>Requests follow SmartDesk's existing permissions and role rules.</span></p>
                    </div>
                </aside>
            </div>
        </form>
    );
}

export default TicketForm;
