import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, count, money } from "../services/api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/dashboard").then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="alert alert-error">{error}</p>;
  if (!data) return <p className="page-loading">Loading dashboard...</p>;

  return (
    <>
      <header className="page-head">
        <h1>Dashboard</h1>
      </header>

      <section className="stats">
        <div className="stat">
          <span className="stat-value">{count(data.totalProducts)}</span>
          <span className="stat-label">Products</span>
        </div>
        <div className="stat">
          <span className="stat-value">{count(data.totalQuantity)}</span>
          <span className="stat-label">Units in stock</span>
        </div>
        <div className="stat">
          <span className="stat-value">{money(data.stockValue)}</span>
          <span className="stat-label">Stock value</span>
        </div>
        <div className={`stat ${data.lowStockCount > 0 ? "stat-alert" : ""}`}>
          <span className="stat-value">{count(data.lowStockCount)}</span>
          <span className="stat-label">Low-stock products</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Low-stock products</h2>
          {data.lowStockProducts.length > 0 && <Link to="/inventory">Go to inventory</Link>}
        </div>

        {data.lowStockProducts.length === 0 ? (
          <p className="empty">Nothing is running low. Every product is above its limit.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="num">In stock</th>
                  <th className="num">Limit</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      {p.sku && <div className="muted small">{p.sku}</div>}
                    </td>
                    <td>{p.category || "—"}</td>
                    <td className="num">
                      <span className={p.quantity === 0 ? "text-danger" : "text-warn"}>{count(p.quantity)}</span>
                    </td>
                    <td className="num">{count(p.effective_threshold)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}