import { useEffect, useMemo, useState } from "react";
import { FaChartBar, FaChartLine, FaCheckCircle, FaClock, FaDownload, FaFolderOpen, FaTicketAlt } from "react-icons/fa";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import "../styles/reports.css";

const palette = ["#3b82f6", "#22d3ee", "#34d399", "#fbbf24", "#a78bfa", "#fb7185"];

function HorizontalChart({ title, data }) {
  const max = Math.max(1, ...data.map((item) => item.count));

  return (
    <article className="report-chart-card">
      <h3>{title}</h3>
      <div className="report-horizontal-chart">
        {data.length === 0 && <p className="report-empty">No data for this month.</p>}
        {data.map((item, index) => (
          <div className="report-bar-row" key={item.label}>
            <div><span>{item.label}</span><strong>{item.count}</strong></div>
            <div className="report-bar-track"><span style={{ width: `${(item.count / max) * 100}%`, background: palette[index % palette.length] }} /></div>
          </div>
        ))}
      </div>
    </article>
  );
}

function drawPdfBarChart(doc, title, data, startY) {
  const chartData = data.slice(0, 7);
  const max = Math.max(1, ...chartData.map((item) => item.count));
  doc.setTextColor(15, 35, 62);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, 15, startY);
  let y = startY + 8;

  chartData.forEach((item, index) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(69, 87, 112);
    doc.text(String(item.label).slice(0, 25), 15, y + 3);
    doc.setFillColor(231, 237, 246);
    doc.roundedRect(68, y, 102, 5, 1.5, 1.5, "F");
    const colors = [[59, 130, 246], [34, 211, 238], [52, 211, 153], [251, 191, 36], [167, 139, 250], [251, 113, 133]];
    doc.setFillColor(...colors[index % colors.length]);
    doc.roundedRect(68, y, Math.max(2, (item.count / max) * 102), 5, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.text(String(item.count), 176, y + 3.5);
    y += 10;
  });

  return y + 3;
}

function Reports() {
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/reports/months")
      .then((response) => {
        const available = response.data.months || [];
        setMonths(available);
        if (available[0]) setSelectedMonth(available[0].value);
        else setLoading(false);
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "Failed to load report months.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    setLoading(true);
    setError("");
    api.get("/reports/monthly", { params: { month: selectedMonth } })
      .then((response) => setReport(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || "Failed to generate the monthly report."))
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  const dailyMaximum = useMemo(() => report ? Math.max(1, ...report.daily_volume.map((day) => Math.max(day.created, day.closed))) : 1, [report]);

  async function exportPdf() {
    if (!report) return;
    setExporting(true);

    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const metrics = report.metrics;
      doc.setFillColor(8, 28, 51);
      doc.rect(0, 0, 210, 34, "F");
      doc.setFillColor(37, 99, 235);
      doc.roundedRect(14, 9, 16, 16, 4, 4, "F");
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(1.2);
      doc.line(18, 14, 18, 20);
      doc.line(22, 12, 22, 20);
      doc.line(26, 16, 26, 20);
      doc.line(18, 20, 26, 20);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("SmartDesk", 36, 16);
      doc.setFontSize(11);
      doc.text(`${report.label} Service Report`, 36, 23);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(174, 193, 214);
      doc.text(`Period ${report.period.start} to ${report.period.end}`, 196, 17, { align: "right" });
      doc.text(`Generated ${new Date(report.generated_at).toLocaleString()}`, 196, 23, { align: "right" });

      const summary = [
        ["Tickets created", metrics.created], ["Closed in month", metrics.closed_during_month],
        ["Resolution rate", `${metrics.close_rate}%`], ["Month-end backlog", metrics.backlog_at_month_end],
        ["Avg. resolution", metrics.average_resolution_hours === null ? "N/A" : `${metrics.average_resolution_hours}h`],
        ["High / critical", metrics.high_priority],
      ];
      summary.forEach(([label, value], index) => {
        const x = 15 + (index % 3) * 61;
        const y = 43 + Math.floor(index / 3) * 23;
        doc.setFillColor(245, 248, 253);
        doc.setDrawColor(225, 232, 242);
        doc.roundedRect(x, y, 56, 18, 3, 3, "FD");
        doc.setTextColor(94, 111, 135);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(label, x + 4, y + 6);
        doc.setTextColor(15, 35, 62);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(String(value), x + 4, y + 14);
      });

      autoTable(doc, {
        startY: 94,
        head: [["Management summary"]],
        body: report.important_points.map((point, index) => [`${index + 1}. ${point}`]),
        theme: "grid",
        styles: { fontSize: 8.5, cellPadding: 3.2, textColor: [52, 69, 93], lineColor: [226, 232, 240], lineWidth: 0.2 },
        headStyles: { fillColor: [15, 45, 78], textColor: 255, fontStyle: "bold" },
      });

      let y = doc.lastAutoTable.finalY + 12;
      y = drawPdfBarChart(doc, "Ticket status distribution", report.breakdowns.status, y);
      if (y > 250) { doc.addPage(); y = 20; }
      drawPdfBarChart(doc, "Top request categories", report.breakdowns.category, y);

      doc.addPage();
      autoTable(doc, {
        startY: 18,
        head: [["Day", "Created", "Closed"]],
        body: report.daily_volume.map((day) => [day.date, day.created, day.closed]),
        theme: "striped",
        styles: { fontSize: 7.5, cellPadding: 2.2 },
        headStyles: { fillColor: [15, 45, 78] },
        didDrawPage: () => { doc.setFontSize(12); doc.setTextColor(15, 35, 62); doc.text("Daily ticket volume", 15, 12); },
      });

      doc.addPage();
      autoTable(doc, {
        startY: 18,
        head: [["ID", "Title", "Category", "Priority", "Status", "Owner", "Created", "Closed"]],
        body: report.tickets.map((ticket) => [`#${ticket.id}`, ticket.title, ticket.category, ticket.priority, ticket.status, ticket.assigned_to, new Date(ticket.created_at).toLocaleDateString(), ticket.closed_at ? new Date(ticket.closed_at).toLocaleDateString() : "-"]),
        theme: "grid",
        styles: { fontSize: 6.7, cellPadding: 1.8, overflow: "linebreak" },
        columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 38 }, 2: { cellWidth: 24 }, 3: { cellWidth: 17 }, 4: { cellWidth: 20 }, 5: { cellWidth: 28 }, 6: { cellWidth: 19 }, 7: { cellWidth: 19 } },
        headStyles: { fillColor: [15, 45, 78] },
        didDrawPage: () => { doc.setFontSize(12); doc.setTextColor(15, 35, 62); doc.text("Monthly ticket register", 15, 12); },
      });

      const pageCount = doc.getNumberOfPages();
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        doc.setPage(pageNumber);
        doc.setFontSize(7);
        doc.setTextColor(125, 139, 158);
        doc.text(`SmartDesk confidential service report · Page ${pageNumber} of ${pageCount}`, 105, 291, { align: "center" });
      }
      doc.save(`SmartDesk-Monthly-Report-${report.month}.pdf`);
    } catch {
      setError("The PDF could not be generated. Please refresh the report and try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="reports-page">
        <div className="reports-heading report-toolbar">
          <div><span className="page-eyebrow">Service intelligence</span><h1>Monthly Reports</h1><p>Operational metrics, workload diagrams, management insights, and a complete monthly ticket register.</p></div>
          <div className="report-controls">
            <label><span>Reporting month</span><select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>{months.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}</select></label>
            <button type="button" onClick={exportPdf} disabled={!report || loading || exporting}><FaDownload /> {exporting ? "Preparing PDF..." : "Export professional PDF"}</button>
          </div>
        </div>

        {error && <div className="report-error">{error}</div>}
        {loading && <div className="report-loading">Preparing monthly analytics...</div>}
        {!loading && report && (
          <>
            <section className="report-period-banner"><div><FaChartLine /><span><strong>{report.label}</strong><small>{report.period.start} — {report.period.end}</small></span></div><span>Generated {new Date(report.generated_at).toLocaleString()}</span></section>
            <div className="report-metric-grid">
              {[["Tickets created", report.metrics.created, FaTicketAlt, "blue"], ["Closed this month", report.metrics.closed_during_month, FaCheckCircle, "green"], ["Resolution rate", `${report.metrics.close_rate}%`, FaChartBar, "cyan"], ["Month-end backlog", report.metrics.backlog_at_month_end, FaFolderOpen, "orange"], ["Avg. resolution", report.metrics.average_resolution_hours === null ? "N/A" : `${report.metrics.average_resolution_hours}h`, FaClock, "violet"]].map(([label, value, Icon, tone]) => <article className={`report-metric-card ${tone}`} key={label}><span><Icon /></span><div><small>{label}</small><strong>{value}</strong></div></article>)}
            </div>

            <div className="report-insight-workspace">
            <section className="report-insights"><div className="report-section-title"><span><FaCheckCircle /></span><div><h2>Important points</h2><p>Automatically generated management summary for {report.label}.</p></div></div><ol>{report.important_points.map((point) => <li key={point}>{point}</li>)}</ol></section>
            <div className="report-chart-grid"><HorizontalChart title="Status distribution" data={report.breakdowns.status} /><HorizontalChart title="Request categories" data={report.breakdowns.category} /><HorizontalChart title="Priority profile" data={report.breakdowns.priority} /><HorizontalChart title="Agent workload" data={report.breakdowns.agent} /></div>
            </div>
            <section className="report-chart-card report-daily-card"><h3>Daily volume</h3><div className="report-chart-legend"><span className="created">Created</span><span className="closed">Closed</span></div><div className="report-daily-chart">{report.daily_volume.map((day) => <div className="report-day" key={day.date} title={`${day.date}: ${day.created} created, ${day.closed} closed`}><div><span className="created" style={{ height: `${Math.max(day.created ? 4 : 0, (day.created / dailyMaximum) * 100)}%` }} /><span className="closed" style={{ height: `${Math.max(day.closed ? 4 : 0, (day.closed / dailyMaximum) * 100)}%` }} /></div><small>{day.day}</small></div>)}</div></section>
            <section className="report-register"><div className="report-section-title"><span><FaTicketAlt /></span><div><h2>Monthly ticket register</h2><p>{report.tickets.length} tickets created during this reporting period.</p></div></div><div className="report-table-wrap"><table><thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Owner</th></tr></thead><tbody>{report.tickets.length === 0 ? <tr><td colSpan="6">No tickets were created in this month.</td></tr> : report.tickets.map((ticket) => <tr key={ticket.id}><td>#{ticket.id}</td><td>{ticket.title}</td><td>{ticket.category}</td><td>{ticket.priority}</td><td>{ticket.status}</td><td>{ticket.assigned_to}</td></tr>)}</tbody></table></div></section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Reports;
