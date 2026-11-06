import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setSession } from "../services/api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const data = await api("/auth/login", { method: "POST", body: form });
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
        <h1>Log in to StockFlow</h1>
        <p className="muted">Welcome back. Enter your details to continue.</p>

        {error && <p className="alert alert-error">{error}</p>}

        <label className="field">
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label className="field">
          Password
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>

        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? "Logging in..." : "Log in"}
        </button>

        <p className="auth-switch">
          New to StockFlow? <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </div>
  );
}