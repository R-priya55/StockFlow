import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, count, money } from "../services/api";

function StatusBadge({ quantity, isLow }) {
  if (Number(quantity) === 0) return <span className="badge badge-out">Out of stock</span>;
  if (isLow) return <span className="badge badge-low">Low stock</span>;
  return <span className="badge badge-ok">In stock</span>;
}

export default function Products() {
  const [products, setProducts] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      api(`/products?search=${encodeURIComponent(search)}`)
        .then(setProducts)
        .catch((err) => setError(err.message));
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api(`/products/${product.id}`, { method: "DELETE" });
      setProducts((list) => list.filter((p) => p.id !== product.id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <header className="page-head">
        <h1>Products</h1>
        <Link className="btn btn-primary" to="/products/new">Add product</Link>
      </header>

      {error && <p className="alert alert-error">{error}</p>}

      <section className="panel">
        <input
          className="search"
          type="search"
          placeholder="Search by name, SKU or category"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {!products ? (
          <p className="page-loading">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="empty">
            {search ? "No products match your search." : "You have no products yet."}{" "}
            {!search && <Link to="/products/new">Add your first product</Link>}
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="num">Quantity</th>
                  <th className="num">Price</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      {p.sku && <div className="muted small">{p.sku}</div>}
                    </td>
                    <td>{p.category || "—"}</td>
                    <td className="num">{count(p.quantity)}</td>
                    <td className="num">{money(p.price)}</td>
                    <td><StatusBadge quantity={p.quantity} isLow={p.is_low_stock} /></td>
                    <td className="row-actions">
                      <Link className="btn btn-small" to={`/products/${p.id}/edit`}>Edit</Link>
                      <button className="btn btn-small btn-danger" onClick={() => handleDelete(p)}>Delete</button>
                    </td>
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