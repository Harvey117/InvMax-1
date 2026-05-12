import { useState } from "react";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import { supabase } from "../services/supabaseClient";
import { calcEOQ, fmtPeso, getCostPrice, getProfitPerUnit, getSellingPrice, getStockStatus } from "../utils/inventory";

function ProductForm({ editItem, form, setForm, saving, onClose, onSubmit }) {
  return (
    <Modal title={editItem ? "Edit Product" : "Add Product"} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <div className="field form-full">
            <label>Product Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Demand Rate (D) — units/yr</label>
            <input className="input" type="number" min="0" step="any" value={form.demand} onChange={e => setForm(f => ({ ...f, demand: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Order Cost (S) — ₱/order</label>
            <input className="input" type="number" min="0" step="any" value={form.order_cost} onChange={e => setForm(f => ({ ...f, order_cost: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Holding Cost (H) — ₱/unit/yr</label>
            <input className="input" type="number" min="0" step="any" value={form.holding} onChange={e => setForm(f => ({ ...f, holding: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Cost Price — ₱/unit</label>
            <input className="input" type="number" min="0" step="any" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Selling Price — ₱/unit</label>
            <input className="input" type="number" min="0" step="any" value={form.selling_price} onChange={e => setForm(f => ({ ...f, selling_price: e.target.value }))} required />
          </div>
          <div className="field form-full">
            <label>Initial Stock</label>
            <input className="input" type="number" min="0" step="1" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save Product"}</button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProductsPage({ products, session, onRefresh, toast }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [delItem, setDelItem] = useState(null);
  const emptyForm = { name: "", demand: "", order_cost: "", holding: "", cost_price: "", selling_price: "", stock: "" };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setForm(emptyForm); setShowAdd(true); };
  const openEdit = (p) => {
    setForm({
      name: p.name,
      demand: p.demand,
      order_cost: p.order_cost,
      holding: p.holding,
      cost_price: getCostPrice(p),
      selling_price: getSellingPrice(p),
      stock: p.stock,
    });
    setEditItem(p);
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    const row = {
      name: form.name.trim(),
      demand: Number(form.demand),
      order_cost: Number(form.order_cost),
      holding: Number(form.holding),
      cost_price: Number(form.cost_price),
      selling_price: Number(form.selling_price),
      price: Number(form.cost_price),
      stock: Number(form.stock),
    };
    if (!row.name) { toast("Product name required.", "warn"); setSaving(false); return; }
    if (row.demand <= 0) { toast("Demand Rate (D) must be greater than 0 for EOQ.", "warn"); setSaving(false); return; }
    if (row.order_cost <= 0) { toast("Order Cost (S) must be greater than 0 for EOQ.", "warn"); setSaving(false); return; }
    if (row.holding <= 0) { toast("Holding Cost (H) must be greater than 0 for EOQ.", "warn"); setSaving(false); return; }
    if (row.cost_price <= 0) { toast("Cost Price must be greater than 0.", "warn"); setSaving(false); return; }
    if (row.selling_price <= 0) { toast("Selling Price must be greater than 0.", "warn"); setSaving(false); return; }
    if (row.selling_price <= row.cost_price) { toast("Selling Price must be higher than Cost Price to calculate profit.", "warn"); setSaving(false); return; }
    if (row.stock < 0) { toast("Initial Stock cannot be negative.", "warn"); setSaving(false); return; }
    let error;
    if (editItem) {
      ({ error } = await supabase.from("products").update(row, { token: session.access_token, match: { id: editItem.id } }));
    } else {
      ({ error } = await supabase.from("products").insert({ ...row, user_id: session.user.id }, { token: session.access_token }));
    }
    setSaving(false);
    if (error) { toast("Save failed: " + error.message, "error"); return; }
    toast(editItem ? `"${row.name}" updated!` : `"${row.name}" added!`);
    setShowAdd(false); setEditItem(null);
    onRefresh();
  };

  const deleteProduct = async () => {
    const { error } = await supabase.from("products").delete({ token: session.access_token, match: { id: delItem.id } });
    if (error) { toast("Delete failed.", "error"); return; }
    toast(`"${delItem.name}" removed.`, "error");
    setDelItem(null); onRefresh();
  };

  return (
    <>
      <div className="page-title">Products</div>
      <div className="page-sub">Manage your inventory items</div>

      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Stock</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Profit/unit</th>
                <th>Demand/yr</th>
                <th>EOQ</th>
                <th>Status</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>No products yet.</td></tr>
              ) : products.map(p => {
                const st = getStockStatus(p);
                const eoq = calcEOQ(p.demand, p.order_cost, p.holding);
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.stock}</td>
                    <td>{fmtPeso(getCostPrice(p))}</td>
                    <td>{fmtPeso(getSellingPrice(p))}</td>
                    <td style={{ color: "var(--teal)" }}>{fmtPeso(getProfitPerUnit(p))}</td>
                    <td>{p.demand}</td>
                    <td style={{ color: "var(--teal)" }}>{eoq > 0 ? Math.round(eoq) : "—"}</td>
                    <td>
                      <span className={`badge badge-${st.label.toLowerCase()}`}>
                        <span className="status-dot" style={{ background: st.color }} />
                        {st.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-ghost btn-sm icon-btn" onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`}>
                          <Icon name="edit" size={14} />
                        </button>
                        <button className="btn btn-danger btn-sm icon-btn" onClick={() => setDelItem(p)} aria-label={`Delete ${p.name}`}>
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(showAdd || editItem) && (
        <ProductForm
          editItem={editItem}
          form={form}
          setForm={setForm}
          saving={saving}
          onSubmit={saveProduct}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
        />
      )}

      {delItem && (
        <Modal title="Delete Product" onClose={() => setDelItem(null)}>
          <p style={{ color: "var(--text2)", marginBottom: 20 }}>
            Are you sure you want to delete <strong style={{ color: "var(--text)" }}>"{delItem.name}"</strong>? This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-danger" onClick={deleteProduct}>Yes, Delete</button>
            <button className="btn btn-ghost" onClick={() => setDelItem(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </>
  );
}
