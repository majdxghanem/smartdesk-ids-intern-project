import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaComments,
    FaPaperPlane,
    FaReply,
    FaTimes
} from "react-icons/fa";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import "../styles/ticketComments.css";

function buildCommentTree(comments) {
    const commentsById = new Map();
    const roots = [];

    comments.forEach((comment) => {
        commentsById.set(comment.id, {
            ...comment,
            replies: []
        });
    });

    comments.forEach((comment) => {
        const current = commentsById.get(comment.id);
        const parent = commentsById.get(comment.parentid);

        if (comment.parentid && parent) {
            parent.replies.push(current);
        } else {
            roots.push(current);
        }
    });

    return roots;
}

function formatDate(value) {
    if (!value) return "Unknown time";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

function displayName(user) {
    return user?.firstname || user?.username || `User #${user?.id}`;
}

function userInitial(user) {
    return displayName(user).charAt(0).toUpperCase();
}

function CommentThread({
    comment,
    currentUserId,
    replyingTo,
    replyText,
    sendingKey,
    onStartReply,
    onCancelReply,
    onReplyTextChange,
    onSendReply
}) {
    const isCurrentUser = Number(comment.user?.id) === Number(currentUserId);
    const isReplying = replyingTo === comment.id;

    return (
        <div className="comment-thread">
            <article
                className={`comment-message ${
                    isCurrentUser ? "comment-message-own" : ""
                }`}
            >
                <div className="comment-avatar">
                    {userInitial(comment.user)}
                </div>

                <div className="comment-message-content">
                    <div className="comment-meta">
                        <strong>{displayName(comment.user)}</strong>
                        <span className="comment-role">
                            {comment.user?.role || "User"}
                        </span>
                        <time dateTime={comment.date}>
                            {formatDate(comment.date)}
                        </time>
                    </div>

                    <div className="comment-bubble">
                        <p>{comment.comment}</p>
                    </div>

                    <button
                        type="button"
                        className="comment-reply-button"
                        onClick={() => onStartReply(comment.id)}
                    >
                        <FaReply /> Reply
                    </button>
                </div>
            </article>

            {isReplying && (
                <form
                    className="comment-reply-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSendReply(comment.id);
                    }}
                >
                    <textarea
                        value={replyText}
                        onChange={(event) =>
                            onReplyTextChange(event.target.value)
                        }
                        placeholder={`Reply to ${displayName(comment.user)}...`}
                        maxLength={5000}
                        rows={2}
                        autoFocus
                    />

                    <div className="comment-reply-actions">
                        <button
                            type="button"
                            className="comment-cancel-button"
                            onClick={onCancelReply}
                        >
                            <FaTimes /> Cancel
                        </button>
                        <button
                            type="submit"
                            className="comment-send-button"
                            disabled={
                                !replyText.trim() || sendingKey !== null
                            }
                        >
                            <FaPaperPlane />
                            {sendingKey === comment.id
                                ? "Sending..."
                                : "Send Reply"}
                        </button>
                    </div>
                </form>
            )}

            {comment.replies.length > 0 && (
                <div className="comment-children">
                    {comment.replies.map((reply) => (
                        <CommentThread
                            key={reply.id}
                            comment={reply}
                            currentUserId={currentUserId}
                            replyingTo={replyingTo}
                            replyText={replyText}
                            sendingKey={sendingKey}
                            onStartReply={onStartReply}
                            onCancelReply={onCancelReply}
                            onReplyTextChange={onReplyTextChange}
                            onSendReply={onSendReply}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function TicketComments() {
    const { id } = useParams();
    const navigate = useNavigate();
    const conversationEndRef = useRef(null);

    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [sendingKey, setSendingKey] = useState(null);

    const storedUser = localStorage.getItem("user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    const loadConversation = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);

        try {
            const response = await api.get(`/tickets/${id}/comments`);
            setTicket(response.data.ticket);
            setComments(response.data.comments || []);
            setError("");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Failed to load the ticket conversation."
            );
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadConversation();
        const timer = window.setInterval(() => loadConversation(false), 15000);

        return () => window.clearInterval(timer);
    }, [loadConversation]);

    useEffect(() => {
        conversationEndRef.current?.scrollIntoView({
            behavior: comments.length > 0 ? "smooth" : "auto"
        });
    }, [comments.length]);

    const commentTree = useMemo(
        () => buildCommentTree(comments),
        [comments]
    );

    async function sendComment(parentid = null) {
        const text = parentid ? replyText.trim() : message.trim();

        if (!text || sendingKey !== null) return;

        setSendingKey(parentid || "root");

        try {
            await api.post(`/tickets/${id}/comments`, {
                comment: text,
                parentid
            });

            if (parentid) {
                setReplyingTo(null);
                setReplyText("");
            } else {
                setMessage("");
            }

            await loadConversation(false);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Failed to send the comment."
            );
        } finally {
            setSendingKey(null);
        }
    }

    function startReply(commentId) {
        setReplyingTo(commentId);
        setReplyText("");
    }

    function cancelReply() {
        setReplyingTo(null);
        setReplyText("");
    }

    return (
        <DashboardLayout>
            <div className="comments-page">
                <div className="comments-page-header">
                    <div>
                        <div className="comments-title-row">
                            <FaComments />
                            <h1>Ticket Conversation</h1>
                        </div>
                        <p>
                            Ticket #{id}
                            {ticket?.title ? ` — ${ticket.title}` : ""}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="comments-back-button"
                        onClick={() => navigate(`/tickets/${id}`)}
                    >
                        <FaArrowLeft /> Back to Ticket
                    </button>
                </div>

                {ticket && (
                    <div className="conversation-participants">
                        <span>
                            <strong>Employee:</strong>{" "}
                            {displayName(ticket.creator)}
                        </span>
                        <span>
                            <strong>Assigned agent:</strong>{" "}
                            {ticket.assigned_user
                                ? displayName(ticket.assigned_user)
                                : "Unassigned"}
                        </span>
                        <span className="admin-participant">
                            Admin and manager participation enabled
                        </span>
                    </div>
                )}

                <section className="conversation-card">
                    <div className="conversation-messages">
                        {loading ? (
                            <div className="conversation-state">
                                Loading conversation...
                            </div>
                        ) : error && !ticket ? (
                            <div className="conversation-state conversation-error">
                                {error}
                            </div>
                        ) : commentTree.length === 0 ? (
                            <div className="conversation-empty">
                                <FaComments />
                                <h2>No comments yet</h2>
                                <p>Start the conversation about this ticket.</p>
                            </div>
                        ) : (
                            commentTree.map((comment) => (
                                <CommentThread
                                    key={comment.id}
                                    comment={comment}
                                    currentUserId={currentUser?.id}
                                    replyingTo={replyingTo}
                                    replyText={replyText}
                                    sendingKey={sendingKey}
                                    onStartReply={startReply}
                                    onCancelReply={cancelReply}
                                    onReplyTextChange={setReplyText}
                                    onSendReply={sendComment}
                                />
                            ))
                        )}

                        <div ref={conversationEndRef} />
                    </div>

                    {ticket && (
                        <form
                            className="conversation-composer"
                            onSubmit={(event) => {
                                event.preventDefault();
                                sendComment();
                            }}
                        >
                            {error && (
                                <div className="composer-error">{error}</div>
                            )}

                            <div className="composer-row">
                                <textarea
                                    value={message}
                                    onChange={(event) =>
                                        setMessage(event.target.value)
                                    }
                                    placeholder="Write a comment..."
                                    maxLength={5000}
                                    rows={2}
                                />
                                <button
                                    type="submit"
                                    className="comment-send-button"
                                    disabled={
                                        !message.trim() || sendingKey !== null
                                    }
                                >
                                    <FaPaperPlane />
                                    {sendingKey === "root"
                                        ? "Sending..."
                                        : "Send"}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}

export default TicketComments;
