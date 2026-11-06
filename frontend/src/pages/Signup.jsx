import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setSession } from "../services/api";

export default function Signup() {
  const [form, setForm] = useState({ organizationName: "", name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const data = await api("/auth/signup", { method: "POST", body: form });
      setSession(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create your StockFlow account</h1>
        <p className="muted">Set up your organization and start tracking stock.</p>

        {error && <p className="alert alert-error">{error}</p>}

        <label className="field">
          Organization name
          <input name="organizationName" value={form.organizationName} onChange={handleChange} required />
        </label>
        <label className="field">
          Your name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label className="field">
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label className="field">
          Password
          <input name="password" type="password" minLength="6" value={form.password} onChange={handleChange} required />
          <small className="muted">At least 6 characters.</small>
        </label>

        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? "Creating account..." : "Create account"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}