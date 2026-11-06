import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function AddProduct() {
  const [form, setForm] = useState({ name: "", sku: "", category: "", quantity: "", price: "", lowStockThreshold: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api("/products", { method: "POST", body: form });
      navigate("/products");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <>
      <header className="page-head">
        <h1>Add product</h1>
      </header>

      <form className="panel form-grid" onSubmit={handleSubmit}>
        {error && <p className="alert alert-error">{error}</p>}

        <label className="field span-2">
          Product name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>

        <label className="field">
          SKU (optional)
          <input name="sku" value={form.sku} onChange={handleChange} />
        </label>

        <label className="field">
          Category (optional)
          <input name="category" value={form.category} onChange={handleChange} />
        </label>

        <label className="field">
          Quantity in stock
          <input name="quantity" type="number" min="0" step="1" value={form.quantity} onChange={handleChange} required />
        </label>

        <label className="field">
          Price (₹)
          <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required />
        </label>

        <label className="field span-2">
          Low-stock limit (optional)
          <input
            name="lowStockThreshold"
            type="number"
            min="0"
            step="1"
            value={form.lowStockThreshold}
            onChange={handleChange}
            placeholder="Leave empty to use the default from Settings"
          />
        </label>

        <div className="form-actions span-2">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Add product"}
          </button>
          <Link className="btn btn-ghost" to="/products">Cancel</Link>
        </div>
      </form>
    </>
  );
}