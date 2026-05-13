import { useEffect, useRef } from "react";

export default function LandingPage({ onEnter }) {
  const badgeDotRef = useRef(null);

  useEffect(() => {
    const counters = document.querySelectorAll(".landing-stat-value[data-target]");
    counters.forEach(el => {
      const target = el.getAttribute("data-target");
      if (!target) return;
      el.textContent = target;
    });
  }, []);

  return (
    <div className="landing-page">
      <div className="landing-grid-bg" aria-hidden="true" />
      <div className="landing-glow-orbs" aria-hidden="true" />

      <div className="landing-inner">
        <div className="landing-logo-wrap">
          <div className="landing-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5m0 0-5 5m5-5 5 5" />
            </svg>
          </div>
          <span className="landing-logo-text">InvMax</span>
        </div>

        <div className="landing-hero">
          <div className="landing-badge">
            <span className="landing-badge-dot" ref={badgeDotRef} />
            Now Live
          </div>
          <h1 className="landing-h1">
            Smarter <span>Inventory</span>
            <br />Management
          </h1>
          <p className="landing-subtitle">
            EOQ-powered reorder decisions and profit-maximizing budget planning for sari-sari stores and small retail shops.
          </p>
        </div>

        <div className="landing-cta-wrap">
          <button className="landing-btn-primary" onClick={onEnter}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
            Open InvMax
          </button>
          <span className="landing-btn-hint">Free to use · No installation needed</span>
        </div>

        <div className="landing-features">
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
              </svg>
            </div>
            <div className="landing-feature-title">EOQ Calculator</div>
            <div className="landing-feature-desc">Find the optimal order quantity to minimize holding and ordering costs.</div>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19V9m8 10V5m8 14v-7" />
              </svg>
            </div>
            <div className="landing-feature-title">Budget Planner</div>
            <div className="landing-feature-desc">Knapsack algorithm selects the most profitable restock mix for your budget.</div>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              </svg>
            </div>
            <div className="landing-feature-title">Low Stock Alerts</div>
            <div className="landing-feature-desc">Automatic warnings when products fall below their reorder threshold.</div>
          </div>
        </div>

        <div className="landing-stats">
          <div className="landing-stat">
            <div className="landing-stat-value" data-target="EOQ">EOQ</div>
            <div className="landing-stat-label">Algorithm</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-value" data-target="0/1">0/1</div>
            <div className="landing-stat-label">Knapsack</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-value" data-target="PH">PH</div>
            <div className="landing-stat-label">Peso-based</div>
          </div>
        </div>

        <div className="landing-footer">Built with InvMax Inventory Optimization System</div>
      </div>
    </div>
  );
}