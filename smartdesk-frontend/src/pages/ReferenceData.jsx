import { useEffect, useState } from "react";
import { FaCheck, FaEdit, FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import "../styles/reference-data.css";

function ReferenceSection({ title, description, endpoint, field, items, onReload }) {
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const createItem = async (event) => {
    event.preventDefault();
    if (!newValue.trim()) return;
    setBusy(true); setError("");
    try { await api.post(endpoint, { [field]: newValue.trim() }); setNewValue(""); await onReload(); }
    catch (requestError) { setError(requestError.response?.data?.message || "Could not create this value."); }
    finally { setBusy(false); }
  };

  const updateItem = async (id) => {
    if (!editingValue.trim()) return;
    setBusy(true); setError("");
    try { await api.put(`${endpoint}/${id}`, { [field]: editingValue.trim() }); setEditingId(null); await onReload(); }
    catch (requestError) { setError(requestError.response?.data?.message || "Could not update this value."); }
    finally { setBusy(false); }
  };

  const removeItem = async (item) => {
    if (!window.confirm(`Remove “${item[field]}”?`)) return;
    setBusy(true); setError("");
    try { await api.delete(`${endpoint}/${item.id}`); await onReload(); }
    catch (requestError) { setError(requestError.response?.data?.message || "Could not remove this value."); }
    finally { setBusy(false); }
  };

  return (
    <section className="reference-card">
      <div className="reference-heading"><div><h2>{title}</h2><p>{description}</p></div><span>{items.length}</span></div>
      <form className="reference-create" onSubmit={createItem}><input value={newValue} onChange={(event) => setNewValue(event.target.value)} maxLength="100" placeholder={`Add ${title.toLowerCase().slice(0, -1)}`} /><button type="submit" disabled={busy || !newValue.trim()}><FaPlus /> Add</button></form>
      {error && <div className="reference-error">{error}</div>}
      <div className="reference-list">
        {items.map((item) => <div className="reference-row" key={item.id}>{editingId === item.id ? <input autoFocus value={editingValue} onChange={(event) => setEditingValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") updateItem(item.id); }} /> : <span>{item[field]}</span>}<div>{editingId === item.id ? <><button className="save" type="button" onClick={() => updateItem(item.id)} disabled={busy}><FaCheck /></button><button type="button" onClick={() => setEditingId(null)}><FaTimes /></button></> : <><button type="button" onClick={() => { setEditingId(item.id); setEditingValue(item[field]); }}><FaEdit /></button><button className="delete" type="button" onClick={() => removeItem(item)} disabled={busy}><FaTrash /></button></>}</div></div>)}
      </div>
    </section>
  );
}

function ReferenceData() {
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const [categoryResponse, priorityResponse, statusResponse] = await Promise.all([api.get("/categories"), api.get("/priorities"), api.get("/statuses")]);
    setCategories(categoryResponse.data); setPriorities(priorityResponse.data); setStatuses(statusResponse.data); setLoading(false);
  };

  useEffect(() => { loadData().catch(() => setLoading(false)); }, []);

  return <DashboardLayout><div className="page-header"><div><span className="page-eyebrow">Administration</span><h1>Service Settings</h1><p>Maintain the controlled values used by ticket forms, filters, and reports.</p></div></div>{loading ? <div className="reference-loading">Loading service settings...</div> : <><div className="reference-grid"><ReferenceSection title="Categories" description="Types of support requests." endpoint="/categories" field="category" items={categories} onReload={loadData} /><ReferenceSection title="Priorities" description="Business impact and urgency levels." endpoint="/priorities" field="priority" items={priorities} onReload={loadData} /><section className="reference-card reference-status-card"><div className="reference-heading"><div><h2>Workflow statuses</h2><p>System-controlled states protect assignment, return, and resolution rules.</p></div><span>{statuses.length}</span></div><div className="reference-status-list">{statuses.map((status) => <span key={status.id}>{status.status}</span>)}</div></section></div></>}</DashboardLayout>;
}

export default ReferenceData;
