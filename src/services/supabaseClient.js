import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../config/supabase";

function createClient(url, key) {
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  const rpc = async (path, method = "GET", body) => {
    const res = await fetch(`${url}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || json.error_description || "Request failed");
    return json;
  };

  const readJson = async (res) => {
    try {
      return await res.json();
    } catch (_) {
      return null;
    }
  };

  const toError = (json, fallback = "Request failed") => {
    return new Error(json?.message || json?.error_description || json?.error || fallback);
  };

  const auth = {
    async signUp({ email, password, options }) {
      try {
        const d = await rpc("/auth/v1/signup", "POST", { email, password, data: options?.data });
        return { data: d, error: null };
      } catch (e) {
        return { data: null, error: e };
      }
    },

    async signInWithPassword({ email, password }) {
      try {
        const d = await rpc("/auth/v1/token?grant_type=password", "POST", { email, password });
        return { data: { user: d.user, session: d }, error: null };
      } catch (e) {
        return { data: null, error: e };
      }
    },

    async resetPasswordForEmail(email, redirectTo) {
      try {
        const d = await rpc("/auth/v1/recover", "POST", {
          email,
          redirect_to: redirectTo,
        });
        return { data: d, error: null };
      } catch (e) {
        return { data: null, error: e };
      }
    },

    async signOut(token) {
      try {
        const res = await fetch(`${url}/auth/v1/logout`, {
          method: "POST",
          headers: { ...headers, Authorization: `Bearer ${token}` },
        });
        const json = await readJson(res);
        return { error: res.ok ? null : toError(json, "Sign out failed") };
      } catch (e) {
        return { error: e };
      }
    },

    async updateUser(token, updates) {
      try {
        const res = await fetch(`${url}/auth/v1/user`, {
          method: "PUT",
          headers: { ...headers, Authorization: `Bearer ${token}` },
          body: JSON.stringify(updates),
        });
        const d = await readJson(res);
        return { data: d, error: res.ok ? null : toError(d, "Update failed") };
      } catch (e) {
        return { data: null, error: e };
      }
    },
  };

  const from = table => ({
    async select(cols = "*", { token, match, order, eq } = {}) {
      try {
        let path = `/rest/v1/${table}?select=${cols}`;
        if (match) Object.entries(match).forEach(([k, v]) => { path += `&${k}=eq.${v}`; });
        if (eq) path += `&${eq[0]}=eq.${eq[1]}`;
        if (order) path += `&order=${order}`;
        const h = token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
        const res = await fetch(`${url}${path}`, { headers: h });
        const json = await readJson(res);
        return { data: json, error: res.ok ? null : toError(json) };
      } catch (e) {
        return { data: null, error: e };
      }
    },

    async insert(rows, { token } = {}) {
      try {
        const h = token
          ? { ...headers, Authorization: `Bearer ${token}`, Prefer: "return=representation" }
          : { ...headers, Prefer: "return=representation" };
        const res = await fetch(`${url}/rest/v1/${table}`, {
          method: "POST",
          headers: h,
          body: JSON.stringify(rows),
        });
        const json = await readJson(res);
        return { data: json, error: res.ok ? null : toError(json, "Insert failed") };
      } catch (e) {
        return { data: null, error: e };
      }
    },

    async update(row, { token, match } = {}) {
      try {
        let path = `/rest/v1/${table}?`;
        if (match) Object.entries(match).forEach(([k, v]) => { path += `${k}=eq.${v}&`; });
        const h = token
          ? { ...headers, Authorization: `Bearer ${token}`, Prefer: "return=representation" }
          : { ...headers, Prefer: "return=representation" };
        const res = await fetch(`${url}${path}`, { method: "PATCH", headers: h, body: JSON.stringify(row) });
        const json = await readJson(res);
        return { data: json, error: res.ok ? null : toError(json, "Update failed") };
      } catch (e) {
        return { data: null, error: e };
      }
    },

    async delete({ token, match } = {}) {
      try {
        let path = `/rest/v1/${table}?`;
        if (match) Object.entries(match).forEach(([k, v]) => { path += `${k}=eq.${v}&`; });
        const h = token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
        const res = await fetch(`${url}${path}`, { method: "DELETE", headers: h });
        const json = await readJson(res);
        return { error: res.ok ? null : toError(json, "Delete failed") };
      } catch (e) {
        return { error: e };
      }
    },

    async upsert(row, { token } = {}) {
      try {
        const h = token
          ? { ...headers, Authorization: `Bearer ${token}`, Prefer: "return=representation,resolution=merge-duplicates" }
          : { ...headers, Prefer: "return=representation,resolution=merge-duplicates" };
        const res = await fetch(`${url}/rest/v1/${table}`, {
          method: "POST",
          headers: h,
          body: JSON.stringify(row),
        });
        const json = await readJson(res);
        return { data: json, error: res.ok ? null : toError(json, "Save failed") };
      } catch (e) {
        return { data: null, error: e };
      }
    },
  });

  return { auth, from };
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
