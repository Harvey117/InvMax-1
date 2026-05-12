import { useState } from "react";
import Icon from "../components/Icon";
import { supabase } from "../services/supabaseClient";
import { validatePassword } from "../utils/inventory";

export default function ProfilePage({ session, profile, onProfileUpdate, onLogout, toast }) {
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [dob, setDob] = useState(profile?.dob || "");
  const [pw, setPw] = useState("");
  const [pwHint, setPwHint] = useState("");
  const [saving, setSaving] = useState(false);
  const age = dob ? Math.floor((Date.now() - new Date(dob)) / 31557600000) : "";

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (pw) {
      const errors = validatePassword(pw);
      if (errors.length) { toast("Password missing: " + errors.join(", "), "warn"); setSaving(false); return; }
      const { error } = await supabase.auth.updateUser(session.access_token, { password: pw });
      if (error) { toast("Password update failed: " + error.message, "error"); setSaving(false); return; }
    }
    const { error } = await supabase.from("profiles").upsert({ id: session.user.id, name, phone, dob }, { token: session.access_token });
    setSaving(false);
    if (error) { toast("Update failed: " + error.message, "error"); return; }
    toast("Profile updated!");
    onProfileUpdate({ name, phone, dob });
    setPw("");
  };

  const pwCheck = (v) => { setPw(v); const e = validatePassword(v); setPwHint(!v ? "" : e.length ? "Missing: " + e.join(", ") : "✓ Strong"); };

  const initial = (name || session.user?.email || "?")[0].toUpperCase();

  return (
    <>
      <div className="page-title">Profile</div>
      <div className="page-sub">Manage your account</div>

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-body">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div className="avatar" style={{ width: 52, height: 52, fontSize: 20 }}>{initial}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{name || "—"}</div>
              <div style={{ color: "var(--text2)", fontSize: 13 }}>{session.user?.email}</div>
            </div>
          </div>
          <div className="sep" />
          <form onSubmit={save}>
            <div className="field">
              <label>Full Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="field">
              <label>Phone Number</label>
              <input className="input" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="09XXXXXXXXX" />
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Date of Birth</label>
                <input className="input" type="date" value={dob} onChange={e => setDob(e.target.value)} max={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="field">
                <label>Age</label>
                <input className="input" value={age === "" ? "" : `${age} years old`} readOnly placeholder="Auto-calculated" />
              </div>
            </div>
            <div className="field">
              <label>New Password (leave blank to keep current)</label>
              <input className="input" type="password" value={pw} onChange={e => pwCheck(e.target.value)} placeholder="••••••••" />
              {pwHint && <div className="field-hint" style={{ color: pwHint.startsWith("✓") ? "var(--teal)" : "var(--amber)" }}>{pwHint}</div>}
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Update Profile"}</button>
          </form>
          <div className="sep" />
          <div className="danger-zone">
            <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Account Actions</div>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>
              Permanent account deletion must be handled by a secure backend or Supabase Edge Function.
              For this frontend version, you can safely sign out of your account.
            </p>
            <button className="btn btn-ghost btn-sm" onClick={onLogout}><Icon name="logout" size={14} /> Sign Out</button>
          </div>
        </div>
      </div>
    </>
  );
}
