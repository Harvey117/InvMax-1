import { useState } from "react";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import { supabase } from "../services/supabaseClient";
import { validatePassword } from "../utils/inventory";

function getAuthErrorMessage(error, fallback = "Authentication failed.") {
  const message = error?.message || "";
  const lower = message.toLowerCase();

  if (
    lower.includes("networkerror") ||
    lower.includes("failed to fetch") ||
    lower.includes("load failed") ||
    lower.includes("fetch")
  ) {
    return "Cannot connect to Supabase. Open src/config/supabase.js and replace YOUR_PROJECT and YOUR_ANON_KEY with your real Supabase URL and anon key.";
  }

  return message || fallback;
}

export default function AuthPage({ onLogin, toast }) {
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [liEmail, setLiEmail] = useState("");
  const [liPw, setLiPw] = useState("");
  const [showLiPw, setShowLiPw] = useState(false);

  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suDob, setSuDob] = useState("");
  const [suPw, setSuPw] = useState("");
  const [suConfirmPw, setSuConfirmPw] = useState("");
  const [pwHint, setPwHint] = useState("");
  const [confirmPwHint, setConfirmPwHint] = useState("");
  const [showSuPw, setShowSuPw] = useState(false);
  const [showSuConfirmPw, setShowSuConfirmPw] = useState(false);
  const [termsOpened, setTermsOpened] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  const signupAge = suDob ? Math.floor((Date.now() - new Date(suDob)) / 31557600000) : "";

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: liEmail, password: liPw });
    setLoading(false);
    if (error) { setErr(getAuthErrorMessage(error, "Incorrect email or password.")); return; }
    onLogin(data.session);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErr("");
    const email = liEmail.trim();
    if (!email.includes("@")) { setErr("Enter your email first, then click Forgot Password."); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, window.location.origin);
    setLoading(false);
    if (error) { setErr("Password reset failed: " + getAuthErrorMessage(error)); return; }
    setShowForgot(false);
    toast("Password reset link sent to your email.", "success");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErr("");
    if (suName.trim().length < 2) { setErr("Name must be at least 2 characters."); return; }
    if (!suDob) { setErr("Please enter your date of birth."); return; }
    const age = Math.floor((Date.now() - new Date(suDob)) / 31557600000);
    if (age < 18) { setErr("You must be at least 18 to register."); return; }
    const pwErrors = validatePassword(suPw);
    if (pwErrors.length) { setErr("Password missing: " + pwErrors.join(", ")); return; }
    if (suPw !== suConfirmPw) { setErr("Passwords do not match."); return; }
    if (!termsOpened || !termsAgreed) { setErr("Open and read the Terms and Conditions before agreeing."); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: suEmail, password: suPw,
      options: { data: { name: suName, phone: suPhone, dob: suDob } },
    });
    setLoading(false);
    if (error) {
      const duplicateName = error.message?.toLowerCase().includes("duplicate") || error.message?.toLowerCase().includes("unique");
      setErr(duplicateName ? "This full name is already used by another account. Please use a unique name." : getAuthErrorMessage(error));
      return;
    }
    toast("Account created! Check your email to confirm, then log in.", "success");
    setTab("login");
  };

  const pwCheck = (v) => {
    setSuPw(v);
    const e = validatePassword(v);
    if (!v) setPwHint("");
    else if (e.length) setPwHint("Missing: " + e.join(", "));
    else setPwHint("✓ Strong password");

    if (suConfirmPw) {
      setConfirmPwHint(v === suConfirmPw ? "✓ Passwords match" : "Passwords do not match");
    }
  };

  const confirmPwCheck = (v) => {
    setSuConfirmPw(v);
    if (!v) setConfirmPwHint("");
    else setConfirmPwHint(suPw === v ? "✓ Passwords match" : "Passwords do not match");
  };

  const EyeIcon = ({ show, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      style={{
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "var(--text2)",
        padding: 0,
        display: "flex",
        alignItems: "center",
      }}
      aria-label={show ? "Hide password" : "Show password"}
    >
      {show ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div className="logo-icon"><Icon name="logo" size={18} /></div>
            <span className="logo-text" style={{ fontSize: 22 }}>InvMax</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 6 }}>
            Inventory Optimization System
          </div>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setErr(""); }}>Login</button>
          <button className={`auth-tab ${tab === "signup" ? "active" : ""}`} onClick={() => { setTab("signup"); setErr(""); }}>Sign Up</button>
        </div>

        {err && <div className="field-error" style={{ marginBottom: 14, padding: "8px 12px", background: "rgba(240,82,82,.1)", borderRadius: 8 }}>{err}</div>}

        {tab === "login" ? (
          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" value={liEmail} onChange={e => setLiEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="field">
              <label>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showLiPw ? "text" : "password"}
                  value={liPw}
                  onChange={e => setLiPw(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingRight: 40 }}
                  required
                />
                <EyeIcon show={showLiPw} onToggle={() => setShowLiPw(v => !v)} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-start", margin: "-6px 0 14px" }}>
              <button className="link-btn" type="button" onClick={() => setShowForgot(true)}>Forgot Password?</button>
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} type="submit" disabled={loading}>
              {loading ? "Logging in…" : "Login"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <div className="field">
              <label>Full Name</label>
              <input className="input" value={suName} onChange={e => setSuName(e.target.value)} placeholder="Juan dela Cruz" required />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" value={suEmail} onChange={e => setSuEmail(e.target.value)} placeholder="you@gmail.com" required />
            </div>
            <div className="field">
              <label>Phone Number (optional)</label>
              <input className="input" value={suPhone} onChange={e => setSuPhone(e.target.value.replace(/\D/g, ""))} placeholder="09XXXXXXXXX" maxLength={11} />
            </div>
            <div className="field">
              <label>Date of Birth</label>
              <input className="input" type="date" value={suDob} onChange={e => setSuDob(e.target.value)} required max={new Date().toISOString().split("T")[0]} />
              {signupAge !== "" && <div className="field-hint">Age: {signupAge}</div>}
            </div>
            <div className="field">
              <label>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showSuPw ? "text" : "password"}
                  value={suPw}
                  onChange={e => pwCheck(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingRight: 40 }}
                  required
                />
                <EyeIcon show={showSuPw} onToggle={() => setShowSuPw(v => !v)} />
              </div>
              <div className="password-rules">
                At least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character.
              </div>
              {pwHint && <div className="field-hint" style={{ color: pwHint.startsWith("✓") ? "var(--teal)" : "var(--amber)" }}>{pwHint}</div>}
            </div>
            <div className="field">
              <label>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showSuConfirmPw ? "text" : "password"}
                  value={suConfirmPw}
                  onChange={e => confirmPwCheck(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingRight: 40 }}
                  required
                />
                <EyeIcon show={showSuConfirmPw} onToggle={() => setShowSuConfirmPw(v => !v)} />
              </div>
              {confirmPwHint && (
                <div className="field-hint" style={{ color: confirmPwHint.startsWith("✓") ? "var(--teal)" : "var(--red)" }}>
                  {confirmPwHint}
                </div>
              )}
            </div>
            <div className="terms-box">
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowTerms(true)}>
                Open Terms and Conditions
              </button>
              <label className={`terms-check ${!termsOpened ? "disabled" : ""}`}>
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  disabled={!termsOpened}
                  onChange={e => setTermsAgreed(e.target.checked)}
                />
                I have opened and read the Terms and Conditions.
              </label>
              {!termsOpened && <div className="field-hint">You must open the terms first before you can agree.</div>}
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} type="submit" disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}
      </div>

      {showForgot && (
        <Modal title="Forgot Password" onClose={() => setShowForgot(false)}>
          <form onSubmit={handleForgotPassword}>
            <p style={{ color: "var(--text2)", marginBottom: 16, fontSize: 13 }}>
              Enter your account email. InvMax will send a reset link through Supabase Auth.
            </p>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" value={liEmail} onChange={e => setLiEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        </Modal>
      )}

      {showTerms && (
        <Modal title="Terms and Conditions" onClose={() => setShowTerms(false)} maxWidth={640}>
          <div className="terms-content">
            <p>
              By using InvMax, you agree to use the system for lawful inventory tracking,
              product monitoring, EOQ calculation, reports, and stock planning.
            </p>
            <p>
              Users are responsible for entering accurate product, stock, cost, demand,
              and profile information. Inventory recommendations are decision-support
              outputs and should be reviewed before business action.
            </p>
            <p>
              Each account must use a unique email address. If your school requires it,
              the database schema can also enforce unique full names across accounts.
            </p>
            <p>
              InvMax protects account access through password requirements and authenticated
              database rules. Do not share your password or account credentials.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => { setTermsOpened(true); setShowTerms(false); }}>
            I Have Read This
          </button>
        </Modal>
      )}
    </div>
  );
}
