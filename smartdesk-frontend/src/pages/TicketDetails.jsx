import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaCheckCircle,
    FaComments,
    FaDownload,
    FaHistory,
    FaPaperclip,
    FaTrash,
    FaUpload,
    FaUndo
} from "react-icons/fa";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import "../styles/ticket.css";

function TicketDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [ticketAction, setTicketAction] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [attachmentAction, setAttachmentAction] = useState("");
    const [attachmentError, setAttachmentError] = useState("");
    const [attachmentsLoading, setAttachmentsLoading] = useState(true);
    const [uploadProgress, setUploadProgress] = useState(0);

    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const role =
        typeof user?.role === "string"
            ? user.role
            : user?.role?.role || user?.role_name || user?.rolename;

    useEffect(() => {
        let isActive = true;

        async function loadTicket() {
            try {
                const response = await api.get(`/tickets/${id}`);

                if (isActive) {
                    setTicket(response.data);
                }
            } catch (requestError) {
                if (isActive) {
                    setError(
                        requestError.response?.data?.message ||
                        "Failed to load ticket details."
                    );
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        }

        loadTicket();

        return () => {
            isActive = false;
        };
    }, [id]);

    useEffect(() => {
        let isActive = true;

        api.get(`/tickets/${id}/attachments`)
            .then((response) => {
                if (isActive) setAttachments(response.data.attachments || []);
            })
            .catch((requestError) => {
                if (isActive) setAttachmentError(requestError.response?.data?.message || "Failed to load attachments.");
            })
            .finally(() => {
                if (isActive) setAttachmentsLoading(false);
            });

        return () => { isActive = false; };
    }, [id]);

    function formatDate(value) {
        if (!value) return "Not set";

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? value
            : date.toLocaleString();
    }

    function formatUser(user, emptyValue) {
        if (!user) return emptyValue;

        const name = [user.firstname, user.lastname]
            .filter(Boolean)
            .join(" ");

        const account = user.email || user.username;

        if (name && account) return `${name} (${account})`;

        return name || account || `User #${user.id}`;
    }

    function getStatusClass(status) {
        if (status === "Open") return "open";
        if (status === "In Progress") return "progress";
        if (status === "Returned") return "returned";

        return "closed";
    }

    async function updateTicketState(action) {
        const actionLabel = action === "close" ? "close" : "return";
        const confirmed = window.confirm(
            `Are you sure you want to ${actionLabel} this ticket?`
        );

        if (!confirmed) return;

        setTicketAction(action);

        try {
            const response = await api.put(`/tickets/${id}/${action}`);
            alert(response.data.message);
            navigate("/tickets");
        } catch (requestError) {
            alert(
                requestError.response?.data?.message ||
                `Failed to ${actionLabel} ticket.`
            );
        } finally {
            setTicketAction("");
        }
    }

    async function uploadAttachment(event) {
        event.preventDefault();
        if (!attachmentFile) return;
        const form = event.currentTarget;
        setAttachmentAction("upload");
        setAttachmentError("");
        setUploadProgress(0);

        const formData = new FormData();
        formData.append("file", attachmentFile);

        try {
            const response = await api.post(`/tickets/${id}/attachments`, formData, {
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
                    }
                },
            });
            setAttachments((current) => [response.data.attachment, ...current]);
            setAttachmentFile(null);
            form.reset();
        } catch (requestError) {
            const errors = requestError.response?.data?.errors;
            setAttachmentError(errors ? Object.values(errors).flat()[0] : requestError.response?.data?.message || "Upload failed.");
        } finally {
            setAttachmentAction("");
            setUploadProgress(0);
        }
    }

    async function downloadAttachment(attachment) {
        setAttachmentAction(`download-${attachment.id}`);
        setAttachmentError("");
        try {
            const response = await api.get(`/attachments/${attachment.id}/download`, { responseType: "blob" });
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement("a");
            link.href = url;
            link.download = attachment.filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch {
            setAttachmentError("The attachment could not be downloaded.");
        } finally {
            setAttachmentAction("");
        }
    }

    async function removeAttachment(attachment) {
        if (!window.confirm(`Remove ${attachment.filename}?`)) return;
        setAttachmentAction(`delete-${attachment.id}`);
        setAttachmentError("");
        try {
            await api.delete(`/attachments/${attachment.id}`);
            setAttachments((current) => current.filter((item) => item.id !== attachment.id));
        } catch (requestError) {
            setAttachmentError(requestError.response?.data?.message || "The attachment could not be removed.");
        } finally {
            setAttachmentAction("");
        }
    }

    function formatFileSize(bytes) {
        if (!bytes) return "0 KB";
        if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    const canCompleteTicket =
        role === "IT Support Agent" &&
        Number(ticket?.assignedto) === Number(user?.id) &&
        ticket?.status?.status === "In Progress";

    const canOpenComments =
        role === "Admin" || role === "Manager" ||
        (role === "Employee" &&
            Number(ticket?.createdby) === Number(user?.id)) ||
        (role === "IT Support Agent" &&
            Number(ticket?.assignedto) === Number(user?.id));

    return (
        <DashboardLayout>
            <div className="page-header">
                <div>
                    <h1>Ticket Details</h1>
                    <p className="ticket-details-subtitle">
                        Complete information for ticket #{id}
                    </p>
                </div>

                <button
                    type="button"
                    className="assignment-back-btn"
                    onClick={() => navigate("/tickets")}
                >
                    <FaArrowLeft /> Back to Tickets
                </button>
            </div>

            {loading ? (
                <h2 className="ticket-details-loading">
                    Loading ticket details...
                </h2>
            ) : error ? (
                <div className="ticket-details-error">{error}</div>
            ) : (
                <>
                    <div className="ticket-details-card">
                        <div className="ticket-details-grid">
                            <div className="ticket-detail-item">
                                <span className="ticket-detail-label">
                                    Ticket ID
                                </span>
                                <span className="ticket-detail-value">
                                    #{ticket.id}
                                </span>
                            </div>

                            {ticket.returned_to && (
                                <div className="ticket-detail-item">
                                    <span className="ticket-detail-label">Returned To</span>
                                    <span className="ticket-detail-value">{formatUser(ticket.returned_to, "Review queue")}</span>
                                </div>
                            )}

                            <div className="ticket-detail-item">
                                <span className="ticket-detail-label">
                                    Status
                                </span>
                                <span
                                    className={`badge ${getStatusClass(
                                        ticket.status?.status
                                    )}`}
                                >
                                    {ticket.status?.status || "Not set"}
                                </span>
                            </div>

                            <div className="ticket-detail-item ticket-detail-full">
                                <span className="ticket-detail-label">
                                    Title
                                </span>
                                <span className="ticket-detail-value ticket-detail-title">
                                    {ticket.title}
                                </span>
                            </div>

                            <div className="ticket-detail-item ticket-detail-full">
                                <span className="ticket-detail-label">
                                    Description
                                </span>
                                <p className="ticket-detail-description">
                                    {ticket.description || "No description provided."}
                                </p>
                            </div>

                            <div className="ticket-detail-item">
                                <span className="ticket-detail-label">
                                    Category
                                </span>
                                <span className="ticket-detail-value">
                                    {ticket.category?.category || "Not set"}
                                </span>
                            </div>

                            <div className="ticket-detail-item">
                                <span className="ticket-detail-label">
                                    Priority
                                </span>
                                <span
                                    className={`badge ${(
                                        ticket.priority?.priority || ""
                                    ).toLowerCase()}`}
                                >
                                    {ticket.priority?.priority || "Not set"}
                                </span>
                            </div>

                            <div className="ticket-detail-item">
                                <span className="ticket-detail-label">
                                    Created By
                                </span>
                                <span className="ticket-detail-value">
                                    {formatUser(ticket.creator, "Unknown user")}
                                </span>
                            </div>

                            <div className="ticket-detail-item">
                                <span className="ticket-detail-label">
                                    Assigned Agent
                                </span>
                                <span className="ticket-detail-value">
                                    {formatUser(
                                        ticket.assigned_user,
                                        "Unassigned"
                                    )}
                                </span>
                            </div>

                            <div className="ticket-detail-item">
                                <span className="ticket-detail-label">
                                    Created At
                                </span>
                                <span className="ticket-detail-value">
                                    {formatDate(ticket.creation_date)}
                                </span>
                            </div>

                            <div className="ticket-detail-item">
                                <span className="ticket-detail-label">
                                    Last Updated
                                </span>
                                <span className="ticket-detail-value">
                                    {formatDate(ticket.update_date)}
                                </span>
                            </div>

                            <div className="ticket-detail-item">
                                <span className="ticket-detail-label">
                                    Closed At
                                </span>
                                <span className="ticket-detail-value">
                                    {formatDate(ticket.closed_date)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <section className="ticket-attachments-card">
                        <div className="ticket-attachments-heading">
                            <div><span><FaPaperclip /> Supporting files</span><p>PDF, Office, image, text, CSV, or ZIP files up to 10 MB.</p></div>
                            <span className="ticket-attachment-count">{attachments.length}</span>
                        </div>

                        <form className="ticket-attachment-upload" onSubmit={uploadAttachment}>
                            <input type="file" onChange={(event) => setAttachmentFile(event.target.files?.[0] || null)} accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.doc,.docx,.xls,.xlsx,.zip" />
                            <button type="submit" disabled={!attachmentFile || attachmentAction === "upload"}><FaUpload /> {attachmentAction === "upload" ? `Uploading${uploadProgress ? ` ${uploadProgress}%` : "..."}` : "Upload file"}</button>
                        </form>

                        {attachmentError && <div className="ticket-details-error" role="alert">{attachmentError}</div>}
                        <div className="ticket-attachment-list">
                            {attachmentsLoading && <p className="ticket-attachment-empty">Loading supporting files...</p>}
                            {!attachmentsLoading && attachments.length === 0 && <p className="ticket-attachment-empty">No supporting files have been added.</p>}
                            {attachments.map((attachment) => (
                                <div className="ticket-attachment-row" key={attachment.id}>
                                    <FaPaperclip />
                                    <div><strong>{attachment.filename}</strong><span>{formatFileSize(attachment.filesize)} · {formatUser(attachment.user, "Unknown uploader")} · {formatDate(attachment.date)}</span></div>
                                    <button type="button" aria-label={`Download ${attachment.filename}`} onClick={() => downloadAttachment(attachment)} disabled={attachmentAction === `download-${attachment.id}`}><FaDownload /></button>
                                    {(role === "Admin" || Number(attachment.userid) === Number(user?.id)) && <button className="attachment-delete" type="button" aria-label={`Remove ${attachment.filename}`} onClick={() => removeAttachment(attachment)} disabled={attachmentAction === `delete-${attachment.id}`}><FaTrash /></button>}
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="ticket-details-actions">
                        {canCompleteTicket && (
                            <>
                                <button
                                    type="button"
                                    className="ticket-page-btn close-ticket"
                                    onClick={() => updateTicketState("close")}
                                    disabled={ticketAction !== ""}
                                >
                                    <FaCheckCircle />
                                    {ticketAction === "close"
                                        ? "Closing..."
                                        : "Close Ticket"}
                                </button>

                                <button
                                    type="button"
                                    className="ticket-page-btn return-ticket"
                                    onClick={() => updateTicketState("return")}
                                    disabled={ticketAction !== ""}
                                >
                                    <FaUndo />
                                    {ticketAction === "return"
                                        ? "Returning..."
                                        : "Return Ticket"}
                                </button>
                            </>
                        )}

                        {canOpenComments && (
                            <button
                                type="button"
                                className="ticket-page-btn comments"
                                onClick={() =>
                                    navigate(`/tickets/${id}/comments`)
                                }
                            >
                                <FaComments /> Comments
                            </button>
                        )}

                        <button
                            type="button"
                            className="ticket-page-btn activity"
                            onClick={() =>
                                navigate(`/tickets/${id}/activity`)
                            }
                        >
                            <FaHistory /> Activity
                        </button>
                    </div>
                </>
            )}
        </DashboardLayout>
    );
}

export default TicketDetails;
