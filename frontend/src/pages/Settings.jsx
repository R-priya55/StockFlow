import { useEffect, useState } from "react";
import { api, getUser, saveUser } from "../services/api";

export default function Settings() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/settings")
      .then((s) => setForm({ organizationName: s.organizationName, lowStockThreshold: s.lowStockThreshold }))
      .catch((err) => setError(err.message));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const result = await api("/settings", { method: "PUT", body: form });
      saveUser({ ...getUser(), organizationName: result.organizationName }); // updates the Navbar
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!form) return error ? <p className="alert alert-error">{error}</p> : <p className="page-loading">Loading settings...</p>;

  return (
    <>
      <header className="page-head">
        <h1>Settings</h1>
      </header>

      <form className="panel settings-form" onSubmit={handleSubmit}>
        {error && <p className="alert alert-error">{error}</p>}
        {saved && <p className="alert alert-ok">Settings saved.</p>}

        <label className="field">
          Organization name
          <input name="organizationName" value={form.organizationName} onChange={handleChange} required />
        </label>

        <label className="field">
          Default low-stock limit
          <input
            name="lowStockThreshold"
            type="number"
            min="0"
            step="1"
            value={form.lowStockThreshold}
            onChange={handleChange}
            required
          />
          <small className="muted">
            A product is marked low stock when its quantity is at or below this number. You can set a
            different limit for a single product when you add or edit it.
          </small>
        </label>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </form>
    </>
  );
}