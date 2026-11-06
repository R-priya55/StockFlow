import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Load the product and fill the form
  useEffect(() => {
    api(`/products/${id}`)
      .then((p) =>
        setForm({
          name: p.name,
          sku: p.sku ?? "",
          category: p.category ?? "",
          quantity: p.quantity,
          price: p.price,
          lowStockThreshold: p.low_stock_threshold ?? "",
        })
      )
      .catch((err) => setError(err.message));
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api(`/products/${id}`, { method: "PUT", body: form });
      navigate("/products");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (!form) return error ? <p className="alert alert-error">{error}</p> : <p className="page-loading">Loading product...</p>;

  return (
    <>
      <header className="page-head">
        <h1>Edit product</h1>
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
            {saving ? "Saving..." : "Save changes"}
          </button>
          <Link className="btn btn-ghost" to="/products">Cancel</Link>
        </div>
      </form>
    </>
  );
}