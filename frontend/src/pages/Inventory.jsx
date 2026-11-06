import { useEffect, useState } from "react";
import { api, count } from "../services/api";

function StatusBadge({ quantity, isLow }) {
  if (Number(quantity) === 0) return <span className="badge badge-out">Out of stock</span>;
  if (isLow) return <span className="badge badge-low">Low stock</span>;
  return <span className="badge badge-ok">In stock</span>;
}

// One table row: shows the stock level and lets the user add or remove units
function StockRow({ product, onChange, onError }) {
  const [amount, setAmount] = useState(1);
  const [busy, setBusy] = useState(false);

  const adjust = async (direction) => {
    const n = Number(amount);
    if (!Number.isInteger(n) || n < 1) {
      onError("Enter a whole number of 1 or more.");
      return;
    }
    setBusy(true);
    try {
      const updated = await api(`/products/${product.id}/stock`, {
        method: "PATCH",
        body: { change: direction * n },
      });
      onChange(updated);
      onError("");
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // The bar fills up to 3x the limit, so low products show a short bar
  const fill = Math.min(100, (product.quantity / Math.max(product.effective_threshold * 3, 1)) * 100);
  const levelClass = product.quantity === 0 ? "level-out" : product.is_low_stock ? "level-low" : "level-ok";

  return (
    <tr>
      <td>
        <strong>{product.name}</strong>
        {product.sku && <div className="muted small">{product.sku}</div>}
      </td>
      <td className="num">{count(product.quantity)}</td>
      <td className="level-cell">
        <div className="level"><div className={`level-fill ${levelClass}`} style={{ width: `${fill}%` }} /></div>
        <span className="muted small">Limit {count(product.effective_threshold)}</span>
      </td>
      <td><StatusBadge quantity={product.quantity} isLow={product.is_low_stock} /></td>
      <td className="row-actions">
        <input
          className="amount"
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label={`Amount for ${product.name}`}
        />
        <button className="btn btn-small" disabled={busy} onClick={() => adjust(-1)}>Remove</button>
        <button className="btn btn-small btn-primary" disabled={busy} onClick={() => adjust(1)}>Add</button>
      </td>
    </tr>
  );
}

export default function Inventory() {
  const [products, setProducts] = useState(null);
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      api(`/products?search=${encodeURIComponent(search)}&lowStock=${lowOnly}`)
        .then(setProducts)
        .catch((err) => setError(err.message));
    }, 250);
    return () => clearTimeout(timer);
  }, [search, lowOnly]);

  const replaceProduct = (updated) =>
    setProducts((list) => list.map((p) => (p.id === updated.id ? updated : p)));

  return (
    <>
      <header className="page-head">
        <h1>Inventory</h1>
      </header>

      {error && <p className="alert alert-error">{error}</p>}

      <section className="panel">
        <div className="toolbar">
          <input
            className="search"
            type="search"
            placeholder="Search by name, SKU or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="check">
            <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
            Show low stock only
          </label>
        </div>

        {!products ? (
          <p className="page-loading">Loading inventory...</p>
        ) : products.length === 0 ? (
          <p className="empty">
            {lowOnly ? "No products are low on stock." : search ? "No products match your search." : "You have no products yet."}
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="num">In stock</th>
                  <th>Stock level</th>
                  <th>Status</th>
                  <th>Adjust stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <StockRow key={p.id} product={p} onChange={replaceProduct} onError={setError} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}