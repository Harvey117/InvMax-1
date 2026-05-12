import { useEffect, useState } from "react";
import Icon from "../components/Icon";
import { calcEOQ, fmtPeso, getCostPrice, getProfitDensity, getProfitPerUnit, getSellingPrice } from "../utils/inventory";

export default function OptimizePage({ products, toast }) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [eoqResult, setEoqResult] = useState(null);
  const [budget, setBudget] = useState("");
  const [checked, setChecked] = useState({});
  const [knapResult, setKnapResult] = useState(null);

  useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const runEOQ = () => {
    const p = products.find(product => product.id === selectedProductId);
    if (!p) return;
    const eoq = calcEOQ(p.demand, p.order_cost, p.holding);
    if (!eoq) {
      toast(`"${p.name}" needs Demand Rate, Order Cost, and Holding Cost greater than 0. Edit the product first.`, "warn");
      return;
    }
    const orderCost = (p.demand / eoq) * p.order_cost;
    const holdingCost = (eoq / 2) * p.holding;
    setEoqResult({ eoq, orderCost, holdingCost, total: orderCost + holdingCost, ordersYear: p.demand / eoq, p });
    toast(`EOQ for "${p.name}": ${Math.round(eoq)} units`);
  };

  const runKnapsack = () => {
    const bud = parseFloat(budget);
    if (!bud || bud <= 0) { toast("Enter a valid budget.", "warn"); return; }
    const selected = products.filter(p => checked[p.id]);
    if (!selected.length) { toast("Select at least one product.", "warn"); return; }

    const SCALE = 100;
    const W = Math.min(Math.round(bud * SCALE), 1000000);
    const baseResults = selected.map(p => {
      const costPrice = getCostPrice(p);
      const sellingPrice = getSellingPrice(p);
      const profit = getProfitPerUnit(p);
      const density = getProfitDensity(p);
      const eoq = calcEOQ(p.demand, p.order_cost, p.holding);
      const eoqUnits = eoq > 0 ? Math.round(eoq) : 0;
      const targetUnits = eoqUnits > 0 ? Math.max(eoqUnits - Number(p.stock || 0), 1) : Math.floor(bud / Math.max(costPrice, 1));
      const maxUnits = costPrice > 0 ? Math.min(Math.floor(bud / costPrice), Math.max(0, targetUnits)) : 0;
      let reason = "";
      if (costPrice <= 0) reason = "Missing Cost Price";
      else if (sellingPrice <= 0) reason = "Missing Selling Price";
      else if (profit <= 0) reason = "Selling Price must be higher than Cost Price";
      else if (maxUnits <= 0) reason = "Cost is above budget or no restock needed";
      return { p, costPrice, sellingPrice, profit, density, eoqUnits, maxUnits, reason };
    });

    const groups = [];
    baseResults.forEach((item, productIndex) => {
      if (item.reason) return;
      let remaining = item.maxUnits;
      let chunk = 1;
      while (remaining > 0) {
        const qty = Math.min(chunk, remaining);
        groups.push({
          productIndex,
          qty,
          weight: Math.max(1, Math.round(item.costPrice * qty * SCALE)),
          value: Math.max(1, Math.round(item.profit * qty * SCALE)),
        });
        remaining -= qty;
        chunk *= 2;
      }
    });

    if (!groups.length) {
      setKnapResult({
        results: baseResults.map(r => ({ ...r, units: 0, spend: 0, revenue: 0, totalProfit: 0, chosen: false })),
        totalSpend: 0,
        totalRevenue: 0,
        totalProfit: 0,
        remaining: bud,
      });
      toast("No profitable product can fit within this budget.", "warn");
      return;
    }

    const dp = new Array(W + 1).fill(0);
    const choice = new Array(W + 1).fill(null);
    groups.forEach((group, groupIndex) => {
      for (let cap = W; cap >= group.weight; cap--) {
        const candidate = dp[cap - group.weight] + group.value;
        if (candidate > dp[cap]) {
          dp[cap] = candidate;
          choice[cap] = { groupIndex, prevCap: cap - group.weight };
        }
      }
    });

    let bestCap = 0;
    for (let cap = 1; cap <= W; cap++) {
      if (dp[cap] > dp[bestCap]) bestCap = cap;
    }

    const quantities = new Array(baseResults.length).fill(0);
    let cap = bestCap;
    while (choice[cap]) {
      const picked = groups[choice[cap].groupIndex];
      quantities[picked.productIndex] += picked.qty;
      cap = choice[cap].prevCap;
    }

    let totalSpend = 0;
    let totalRevenue = 0;
    let totalProfit = 0;
    const results = baseResults.map((item, i) => {
      const units = quantities[i] || 0;
      const spend = units * item.costPrice;
      const revenue = units * item.sellingPrice;
      const itemProfit = units * item.profit;
      totalSpend += spend;
      totalRevenue += revenue;
      totalProfit += itemProfit;
      let reason = item.reason;
      if (!reason && units === 0) {
        reason = "Not part of the most profitable mix for this budget";
      }
      return { ...item, units, spend, revenue, totalProfit: itemProfit, reason, chosen: units > 0 };
    });

    setKnapResult({ results, totalSpend, totalRevenue, totalProfit, remaining: bud - totalSpend });
    toast(`Budget optimized for maximum profit: ${fmtPeso(totalProfit)}`);
  };

  return (
    <>
      <div className="page-title">Optimize</div>
      <div className="page-sub">EOQ calculation and profit-based budget planning</div>

      <div className="two-col">
        {/* EOQ */}
        <div className="card">
          <div className="card-header"><span className="section-title"><Icon name="lightning" size={16} /> EOQ — Economic Order Quantity</span></div>
          <div className="card-body">
            <div className="field">
              <label>Select Product</label>
              <select className="input" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={runEOQ} disabled={!products.length}>Calculate EOQ</button>

            {eoqResult && (
              <div className="eoq-result">
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Optimal Order Quantity</div>
                <div className="eoq-number">{Math.round(eoqResult.eoq)}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>units per order</div>
                <div className="eoq-rows">
                  {[
                    ["Annual Order Cost", fmtPeso(eoqResult.orderCost)],
                    ["Annual Holding Cost", fmtPeso(eoqResult.holdingCost)],
                    ["Total Annual Cost", fmtPeso(eoqResult.total)],
                    ["Orders per Year", eoqResult.ordersYear.toFixed(1)],
                  ].map(([l, v]) => (
                    <div className="eoq-row" key={l}>
                      <span style={{ color: "var(--text2)" }}>{l}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Knapsack */}
        <div className="card">
          <div className="card-header"><span className="section-title"><Icon name="barChart" size={16} /> Budget Planner</span></div>
          <div className="card-body">
            <div className="field">
              <label>Your Budget (₱)</label>
              <input className="input" type="number" min="1" step="any" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 5000" />
            </div>
            <div className="field">
              <label>Select Products to include</label>
              <div className="card" style={{ maxHeight: 200, overflowY: "auto", padding: 0 }}>
                {products.length === 0 ? (
                  <div style={{ padding: 16, color: "var(--muted)", fontSize: 13 }}>No products yet.</div>
                ) : products.map((p, i) => (
                  <div className="checkbox-row" key={p.id}>
                    <input type="checkbox" checked={!!checked[p.id]} onChange={e => setChecked(c => ({ ...c, [p.id]: e.target.checked }))} />
                    <span style={{ flex: 1, fontSize: 13 }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>
                      Cost {fmtPeso(getCostPrice(p))} · Profit {fmtPeso(getProfitPerUnit(p))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-amber" onClick={runKnapsack} disabled={!products.length}>Calculate Best Mix</button>

            {knapResult && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>
                  Optimizer selected {knapResult.results.filter(r => r.chosen).length} of {knapResult.results.length} product(s)
                </div>
                {knapResult.results.map(r => (
                  <div className={`knap-item ${r.chosen ? "selected" : ""}`} key={r.p.id}>
                    <div className="knap-item-name" style={{ color: r.chosen ? "var(--text)" : "var(--muted)" }}>
                      {r.p.name} {r.chosen ? "selected" : "skipped"}
                    </div>
                    <div className="knap-detail">
                      Cost {fmtPeso(r.costPrice)} · Sell {fmtPeso(r.sellingPrice)} · Profit {fmtPeso(r.profit)}/unit · Density {(r.density * 100).toFixed(1)}%
                    </div>
                    {r.chosen ? (
                      <>
                        <div style={{ color: "var(--teal)", fontWeight: 700, fontSize: 14, marginTop: 4 }}>
                          Buy {r.units} units · Spend {fmtPeso(r.spend)} · Profit {fmtPeso(r.totalProfit)}
                        </div>
                        {r.eoqUnits > 0 && (
                          <div style={{ fontSize: 11, color: r.units >= r.eoqUnits ? "var(--teal)" : "var(--amber)", marginTop: 2 }}>
                            {r.units >= r.eoqUnits ? "Covers EOQ optimal" : `Below EOQ (${r.eoqUnits} units)`}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{r.reason}</div>
                    )}
                  </div>
                ))}
                <div className="sep" />
                <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Total Spend: <strong>{fmtPeso(knapResult.totalSpend)}</strong></span>
                    <span style={{ color: "var(--teal)" }}>Remaining: {fmtPeso(knapResult.remaining)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Expected Revenue: <strong>{fmtPeso(knapResult.totalRevenue)}</strong></span>
                    <span style={{ color: "var(--teal)" }}>Expected Profit: <strong>{fmtPeso(knapResult.totalProfit)}</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
