import { useState } from "react";
import Modal from "../components/Modal";
import { EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID } from "../config/email";
import { calcEOQ, fmtPeso, getCostPrice, getLowStockThreshold, getProfitPerUnit, getSellingPrice, getStockStatus } from "../utils/inventory";

const EMAILJS_CDN = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";

function loadEmailJS() {
  return new Promise((resolve, reject) => {
    if (window.emailjs) { resolve(); return; }
    const s = document.createElement("script");
    s.src = EMAILJS_CDN;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load EmailJS"));
    document.head.appendChild(s);
  });
}

export default function ReportsPage({ products, user, toast }) {
  const [period, setPeriod] = useState("weekly");
  const [email, setEmail] = useState(user?.email || "");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState(false);
  const [previewText, setPreviewText] = useState("");

  const getStatusColor = () => {
    const lower = status.toLowerCase();
    if (
      lower.includes("failed") ||
      lower.includes("not configured") ||
      lower.includes("invalid") ||
      lower.includes("rejected") ||
      lower.includes("please")
    ) {
      return "var(--red)";
    }
    if (lower.includes("blocked") || lower.includes("draft")) return "var(--amber)";
    return "var(--teal)";
  };

  const formatGeneratedAt = (date) => new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(date);

  const formatGeneratedDate = (date) => new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(date);

  const formatGeneratedTime = (date) => new Intl.DateTimeFormat("en-PH", {
    timeStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(date);

  const getDateRange = (date) => {
    const end = new Date(date);
    const start = new Date(date);
    start.setDate(end.getDate() - (period === "weekly" ? 6 : 29));
    const fmt = new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Manila",
    });
    return `${fmt.format(start)} - ${fmt.format(end)}`;
  };

  const buildReportSnapshot = () => {
    const now = new Date();
    const generatedAt = formatGeneratedAt(now);
    const dateRange = getDateRange(now);
    const lowCriticalCount = products.filter(p => {
      const t = getLowStockThreshold(p.demand);
      return p.stock <= t;
    }).length;
    const lines = [
      `InvMax — ${period === "weekly" ? "Weekly" : "Monthly"} Inventory Report`,
      `Generated: ${generatedAt}`,
      `Report Period: ${dateRange}`,
      `User: ${user?.email}`,
      "=".repeat(60),
      `${"Product".padEnd(22)} ${"Stock".padStart(6)} ${"Status".padEnd(10)} ${"Cost".padStart(10)} ${"Sell".padStart(10)} ${"Profit".padStart(10)} ${"EOQ".padStart(8)}`,
      "-".repeat(92),
    ];
    products.forEach(p => {
      const st = getStockStatus(p);
      const eoq = calcEOQ(p.demand, p.order_cost, p.holding);
      const eoqText = eoq > 0 ? String(Math.round(eoq)) : "—";
      lines.push(
        `${p.name.slice(0, 22).padEnd(22)} ${String(p.stock).padStart(6)} ${st.label.padEnd(10)} ` +
        `₱${getCostPrice(p).toFixed(2).padStart(9)} ₱${getSellingPrice(p).toFixed(2).padStart(9)} ` +
        `₱${getProfitPerUnit(p).toFixed(2).padStart(9)} ${eoqText.padStart(8)}`
      );
    });
    lines.push("=".repeat(60), `Total: ${products.length}  Low/Critical: ${lowCriticalCount}`, "", "— InvMax Inventory Optimization System");
    const reportBody = lines.join("\n");

    return {
      generatedAt,
      generatedDate: formatGeneratedDate(now),
      generatedTime: formatGeneratedTime(now),
      generatedIso: now.toISOString(),
      reportPeriod: period,
      reportPeriodLabel: period === "weekly" ? "Weekly Inventory Report" : "Monthly Inventory Report",
      dateRange,
      totalProducts: products.length,
      lowCriticalCount,
      reportBody,
    };
  };

  const buildText = () => {
    return buildReportSnapshot().reportBody;
  };

  const copyReport = async () => {
    const snapshot = buildReportSnapshot();
    try {
      await navigator.clipboard.writeText(snapshot.reportBody);
      setStatus("Report copied. Paste it into Gmail or your document.");
      toast("Report copied to clipboard!");
    } catch (_) {
      setPreviewText(snapshot.reportBody);
      setPreview(true);
      setStatus("Clipboard is blocked by this browser. Use Preview, then copy the report manually.");
      toast("Clipboard blocked. Preview opened instead.", "warn");
    }
  };

  const downloadReport = () => {
    const snapshot = buildReportSnapshot();
    const blob = new Blob([snapshot.reportBody], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invmax-${period}-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Report downloaded as a text file.");
    toast("Report downloaded!");
  };

  const openEmailDraft = () => {
    if (!email.includes("@")) {
      setStatus("Please enter a valid email.");
      return;
    }

    const snapshot = buildReportSnapshot();
    const subject = encodeURIComponent(`InvMax ${snapshot.reportPeriodLabel}`);
    const body = encodeURIComponent(snapshot.reportBody);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    setStatus("Email draft opened. Please click Send in your email app.");
    toast("Email draft opened. You still need to send it.");
  };

  const sendDirectEmail = async () => {
    if (!email.includes("@")) {
      setStatus("Please enter a valid email.");
      return;
    }

    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      setStatus("Direct email is not configured yet. Fill src/config/email.js or use Open Email Draft.");
      toast("Email provider not configured.", "warn");
      return;
    }

    setStatus("Sending…");

    try {
      // Load EmailJS from CDN instead of npm package — no extra install needed
      await loadEmailJS();
      window.emailjs.init(EMAILJS_PUBLIC_KEY);

      const snapshot = buildReportSnapshot();

      await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: email,
        user_email: user?.email || email,
        generated_at: snapshot.generatedAt,
        generated_date: snapshot.generatedDate,
        generated_time: snapshot.generatedTime,
        generated_iso: snapshot.generatedIso,
        report_period: snapshot.reportPeriod,
        report_period_label: snapshot.reportPeriodLabel,
        date_range: snapshot.dateRange,
        total_products: snapshot.totalProducts,
        low_critical_count: snapshot.lowCriticalCount,
        report_body: snapshot.reportBody,
      });

      setStatus("Report sent directly to email.");
      toast("Report sent to email!");
    } catch (e) {
      const msg = e?.text || e?.message || "Unknown error.";
      setStatus("Direct email failed: " + msg);
      toast("Direct email failed.", "error");
      console.error("[InvMax] EmailJS error:", e);
    }
  };

  return (
    <>
      <div className="page-title">Reports</div>
      <div className="page-sub">Generate inventory reports</div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-body">
          <div className="field">
            <label>Report Period</label>
            <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
              {[["weekly", "Weekly (last 7 days)"], ["monthly", "Monthly (last 30 days)"]].map(([v, l]) => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                  <input type="radio" value={v} checked={period === v} onChange={() => setPeriod(v)} style={{ accentColor: "var(--teal)" }} />
                  {l}
                </label>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Send report to email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>
            Use Send Direct Email after configuring src/config/email.js. If not configured, open a draft, copy, or download the report.
          </div>
          {status && <div style={{ fontSize: 13, color: getStatusColor(), marginBottom: 12 }}>{status}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={sendDirectEmail}>Send Direct Email</button>
            <button className="btn btn-ghost" onClick={openEmailDraft}>Open Email Draft</button>
            <button className="btn btn-ghost" onClick={copyReport}>Copy Report</button>
            <button className="btn btn-ghost" onClick={downloadReport}>Download</button>
            <button className="btn btn-amber" onClick={() => { setPreviewText(buildText()); setPreview(true); }}>Preview</button>
          </div>
        </div>
      </div>

      {preview && (
        <Modal title="Report Preview" onClose={() => setPreview(false)} maxWidth={640}>
          <pre style={{ background: "var(--card)", padding: 16, borderRadius: 8, fontSize: 11, fontFamily: "var(--mono)", overflowX: "auto", whiteSpace: "pre-wrap", color: "var(--text2)" }}>
            {previewText}
          </pre>
          <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => setPreview(false)}>Close</button>
        </Modal>
      )}
    </>
  );
}