import { useCallback, useEffect, useState } from "react";
import Icon from "./components/Icon";
import ToastContainer from "./components/ToastContainer";
import useToast from "./hooks/useToast";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import HelpPage from "./pages/HelpPage";
import LandingPage from "./pages/LandingPage";
import OptimizePage from "./pages/OptimizePage";
import ProductsPage from "./pages/ProductsPage";
import ProfilePage from "./pages/ProfilePage";
import ReportsPage from "./pages/ReportsPage";
import { supabase } from "./services/supabaseClient";
import { getLowStockThreshold } from "./utils/inventory";

const SESSION_KEY = "invmax_session";
const THEME_KEY = "invmax_theme";
const VISITED_KEY = "invmax_visited";

function readStoredSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (_) {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (_) {}
    return null;
  }
}

function saveStoredSession(sess) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
  } catch (_) {}
}

function clearStoredSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch (_) {}
}

function readStoredTheme() {
  try { return sessionStorage.getItem(THEME_KEY) || "dark"; } catch (_) { return "dark"; }
}

function saveStoredTheme(theme) {
  try { sessionStorage.setItem(THEME_KEY, theme); } catch (_) {}
}

function hasSeenLanding() {
  try { return sessionStorage.getItem(VISITED_KEY) === "1"; } catch (_) { return false; }
}

function markLandingSeen() {
  try { sessionStorage.setItem(VISITED_KEY, "1"); } catch (_) {}
}

function App() {
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => readStoredTheme());
  const [showLanding, setShowLanding] = useState(false);
  const { toasts, show: toast } = useToast();

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    saveStoredTheme(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  useEffect(() => {
    const storedSession = readStoredSession();
    if (storedSession) {
      setSession(storedSession);
      setShowLanding(false);
    } else if (!hasSeenLanding()) {
      setShowLanding(true);
    }
    setLoading(false);
  }, []);

  const handleEnterApp = () => {
    markLandingSeen();
    setShowLanding(false);
  };

  const handleLogin = (sess) => {
    setSession(sess);
    saveStoredSession(sess);
  };

  const handleLogout = async () => {
    if (session) await supabase.auth.signOut(session.access_token);
    setSession(null);
    clearStoredSession();
    setProducts([]);
    setProfile(null);
    setPage("dashboard");
    setShowLanding(true);
  };

  const fetchProducts = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase.from("products").select("*", {
        token: session.access_token,
        eq: ["user_id", session.user.id],
        order: "added_at.asc",
      });
    if (error) {
      toast("Unable to load products. Check your Supabase setup and internet connection.", "error");
      return;
    }
    if (data) setProducts(data);
  }, [session, toast]);

  const fetchProfile = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase.from("profiles").select("*", {
      token: session.access_token,
      eq: ["id", session.user.id],
    });
    if (error) return;
    if (data?.[0]) setProfile(data[0]);
  }, [session]);

  useEffect(() => {
    if (session) { fetchProducts(); fetchProfile(); }
  }, [session, fetchProducts, fetchProfile]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ color: "var(--teal)", fontSize: 18, fontWeight: 700 }}>Loading InvMax…</div>
    </div>
  );

  if (showLanding) return (
    <>
      <LandingPage onEnter={handleEnterApp} />
      <button className="theme-float" onClick={toggleTheme} aria-label="Toggle light mode">
        <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
        {theme === "dark" ? "Light" : "Dark"}
      </button>
      <ToastContainer toasts={toasts} />
    </>
  );

  if (!session) return (
    <>
      <AuthPage onLogin={handleLogin} toast={toast} />
      <button className="theme-float" onClick={toggleTheme} aria-label="Toggle light mode">
        <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
        {theme === "dark" ? "Light" : "Dark"}
      </button>
      <ToastContainer toasts={toasts} />
    </>
  );

  const nav = [
    { key: "dashboard", icon: "home", label: "Dashboard" },
    { key: "products", icon: "box", label: "Products" },
    { key: "optimize", icon: "lightning", label: "Optimize" },
    { key: "report", icon: "barChart", label: "Reports" },
    { key: "profile", icon: "user", label: "Profile" },
    { key: "help", icon: "help", label: "Help & FAQ" },
  ];

  const initial = (profile?.name || session.user?.email || "?")[0].toUpperCase();

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon"><Icon name="logo" size={18} /></div>
            <span className="logo-text">InvMax</span>
          </div>
        </div>
        <nav className="nav">
          {nav.map(n => (
            <button
              key={n.key}
              className={`nav-btn ${page === n.key ? "active" : ""}`}
              onClick={() => { setPage(n.key); setSidebarOpen(false); }}
            >
              <span className="nav-icon"><Icon name={n.icon} size={17} /></span> {n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{initial}</div>
            <div className="user-info">
              <div className="user-name">{profile?.name || "User"}</div>
              <div className="user-email">{session.user?.email}</div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <button className="hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Open menu">
            <Icon name="menu" size={22} />
          </button>
          <button className="btn btn-ghost theme-toggle" onClick={toggleTheme} aria-label="Toggle light mode">
            <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <div className="search-wrap">
            <Icon name="search" size={16} style={{ color: "var(--muted)" }} />
            <input
              className="search-input"
              placeholder="Search products…"
              value={search}
              onChange={e => { setSearch(e.target.value); if (page !== "dashboard") setPage("dashboard"); }}
            />
          </div>
          {products.filter(p => p.stock <= getLowStockThreshold(p.demand)).length > 0 && (
            <div
              className="alert-badge"
              style={{ marginLeft: "auto" }}
              onClick={() => setPage("dashboard")}
            >
              <Icon name="alert" size={15} />
              {products.filter(p => p.stock <= getLowStockThreshold(p.demand)).length} Low Stock
            </div>
          )}
        </div>

        <div className="page-content">
          {page === "dashboard" && <Dashboard products={products} onRefresh={fetchProducts} toast={toast} search={search} />}
          {page === "products" && <ProductsPage products={products} session={session} onRefresh={fetchProducts} toast={toast} />}
          {page === "optimize" && <OptimizePage products={products} toast={toast} />}
          {page === "report" && <ReportsPage products={products} user={session.user} toast={toast} />}
          {page === "profile" && <ProfilePage session={session} profile={profile} onProfileUpdate={p => setProfile(prev => ({ ...prev, ...p }))} onLogout={handleLogout} toast={toast} />}
          {page === "help" && <HelpPage />}
        </div>
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}

export default App;