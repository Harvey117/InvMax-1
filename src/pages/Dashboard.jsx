import { useState } from "react";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import { calcEOQ, fmtPeso, getCostPrice, getLowStockThreshold, getProfitPerUnit, getSellingPrice, getStockStatus } from "../utils/inventory";

export default function Dashboard({ products, onRefresh, toast, search }) {
  const [showAlert, setShowAlert] = useState(false);

  const lowItems = products.filter(p => p.stock <= getLowStockThreshold(p.demand));
  const now = new Date();
  const thisMonth = products.filter(p => {
    const d = new Date(p.added_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const filtered = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  return (
    <>
      <div className="page-title">Dashboard</div>
      <div className="page-sub">Your inventory at a glance</div>

      {lowItems.length > 0 && (
        <div className="alert-badge" style={{ marginBottom: 16, display: "inline-flex" }} onClick={() => setShowAlert(true)}>
          <Icon name="alert" size={15} />
          {lowItems.length} item{lowItems.length > 1 ? "s" : ""} need restocking
        </div>
      )}

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Products</div>
          <div className="stat-value" style={{ color: "var(--teal)" }}>{products.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Stock</div>
          <div className="stat-value" style={{ color: "var(--amber)" }}>{lowItems.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Added This Month</div>
          <div className="stat-value" style={{ color: "var(--text2)" }}>+{thisMonth}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="section-title">Products</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Cost</th>
                <th>Sell</th>
                <th>Profit</th>
                <th>EOQ</th>
                <th>Demand</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>
                  {search ? "No products match your search." : "No products yet. Add one to get started!"}
                </td></tr>
              ) : filtered.map(p => {
                const st = getStockStatus(p);
                const eoq = calcEOQ(p.demand, p.order_cost, p.holding);
                return (
                  <tr key={p.id} className={st.label === "Critical" ? "tr-critical" : st.label === "Low" ? "tr-low" : ""}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 13 }}>{p.stock}</td>
                    <td>
                      <span className={`badge badge-${st.label.toLowerCase()}`}>
                        <span className="status-dot" style={{ background: st.color }} />
                        {st.label}
                      </span>
                    </td>
                    <td style={{ color: "var(--text2)" }}>{fmtPeso(getCostPrice(p))}</td>
                    <td style={{ color: "var(--text2)" }}>{fmtPeso(getSellingPrice(p))}</td>
                    <td style={{ color: "var(--teal)" }}>{fmtPeso(getProfitPerUnit(p))}</td>
                    <td style={{ fontFamily: "var(--mono)", color: "var(--teal)", fontSize: 13 }}>
                      {eoq > 0 ? Math.round(eoq) : "—"}
                    </td>
                    <td style={{ color: "var(--text2)" }}>{p.demand}/yr</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAlert && (
        <Modal title="Low Stock Alert" onClose={() => setShowAlert(false)}>
          <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 16 }}>
            These products are below their reorder threshold (≈2 weeks of demand):
          </p>
          {lowItems.map(p => {
            const t = getLowStockThreshold(p.demand);
            return (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                <span style={{ color: "var(--red)" }}>{p.stock} / {t} units</span>
              </div>
            );
          })}
          <button className="btn btn-primary" style={{ marginTop: 20, width: "100%", justifyContent: "center" }} onClick={() => setShowAlert(false)}>Dismiss</button>
        </Modal>
      )}
    </>
  );
}
