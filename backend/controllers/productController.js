const pool = require("../config/database");

// A product is "low stock" when quantity <= its own limit, or the organization default if it has none.
const SELECT_PRODUCTS = `
    SELECT p.id, p.name, p.sku, p.category, p.quantity, p.price,
           p.low_stock_threshold,
           COALESCE(p.low_stock_threshold, o.low_stock_threshold) AS effective_threshold,
           (p.quantity <= COALESCE(p.low_stock_threshold, o.low_stock_threshold)) AS is_low_stock,
           p.created_at, p.updated_at
    FROM products p
    JOIN organizations o ON o.id = p.organization_id
`;

// Checks and cleans the form data for add/edit. Returns { error } or { data }.
function readProductBody(body) {
    const name = (body.name || "").trim();
    const quantity = Number(body.quantity);
    const price = Number(body.price);
    const hasThreshold = body.lowStockThreshold !== "" && body.lowStockThreshold != null;
    const threshold = hasThreshold ? Number(body.lowStockThreshold) : null;

    if (!name) return { error: "Product name is required." };
    if (!Number.isInteger(quantity) || quantity < 0) return { error: "Quantity must be a whole number, 0 or more." };
    if (Number.isNaN(price) || price < 0) return { error: "Price must be a number, 0 or more." };
    if (hasThreshold && (!Number.isInteger(threshold) || threshold < 0)) {
        return { error: "Low-stock limit must be a whole number, 0 or more." };
    }

    return {
        data: {
            name,
            sku: (body.sku || "").trim() || null,
            category: (body.category || "").trim() || null,
            quantity,
            price,
            threshold,
        },
    };
}

// ---------- GET /api/products?search=lap&lowStock=true ----------
exports.getProducts = async (req, res) => {
    try {
        const params = [req.user.organizationId];
        let where = "WHERE p.organization_id = $1";

        if (req.query.search) {
            params.push(`%${req.query.search}%`);
            where += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length} OR p.category ILIKE $${params.length})`;
        }
        if (req.query.lowStock === "true") {
            where += " AND p.quantity <= COALESCE(p.low_stock_threshold, o.low_stock_threshold)";
        }

        const result = await pool.query(`${SELECT_PRODUCTS} ${where} ORDER BY p.name`, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not load products." });
    }
};

// ---------- GET /api/products/:id ----------
exports.getProduct = async (req, res) => {
    try {
        const result = await pool.query(
            `${SELECT_PRODUCTS} WHERE p.id = $1 AND p.organization_id = $2`,
            [req.params.id, req.user.organizationId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Product not found." });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not load the product." });
    }
};

// ---------- POST /api/products ----------
exports.createProduct = async (req, res) => {
    const { error, data } = readProductBody(req.body);
    if (error) return res.status(400).json({ error });

    try {
        const result = await pool.query(
            `INSERT INTO products (organization_id, name, sku, category, quantity, price, low_stock_threshold)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [req.user.organizationId, data.name, data.sku, data.category, data.quantity, data.price, data.threshold]
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not add the product." });
    }
};

// ---------- PUT /api/products/:id ----------
exports.updateProduct = async (req, res) => {
    const { error, data } = readProductBody(req.body);
    if (error) return res.status(400).json({ error });

    try {
        const result = await pool.query(
            `UPDATE products
             SET name = $1, sku = $2, category = $3, quantity = $4, price = $5,
                 low_stock_threshold = $6, updated_at = CURRENT_TIMESTAMP
             WHERE id = $7 AND organization_id = $8 RETURNING id`,
            [data.name, data.sku, data.category, data.quantity, data.price, data.threshold, req.params.id, req.user.organizationId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Product not found." });
        res.json({ id: result.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not update the product." });
    }
};

// ---------- PATCH /api/products/:id/stock   body: { change: 5 } or { quantity: 40 } ----------
exports.updateStock = async (req, res) => {
    const { change, quantity } = req.body;

    try {
        let result;
        if (quantity !== undefined) {
            const q = Number(quantity);
            if (!Number.isInteger(q) || q < 0) {
                return res.status(400).json({ error: "Quantity must be a whole number, 0 or more." });
            }
            result = await pool.query(
                `UPDATE products SET quantity = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2 AND organization_id = $3 RETURNING id`,
                [q, req.params.id, req.user.organizationId]
            );
        } else {
            const c = Number(change);
            if (!Number.isInteger(c) || c === 0) {
                return res.status(400).json({ error: "Enter a whole number to add or remove." });
            }
            // GREATEST keeps stock from going below zero
            result = await pool.query(
                `UPDATE products SET quantity = GREATEST(quantity + $1, 0), updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2 AND organization_id = $3 RETURNING id`,
                [c, req.params.id, req.user.organizationId]
            );
        }
        if (result.rows.length === 0) return res.status(404).json({ error: "Product not found." });

        const updated = await pool.query(
            `${SELECT_PRODUCTS} WHERE p.id = $1 AND p.organization_id = $2`,
            [req.params.id, req.user.organizationId]
        );
        res.json(updated.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not update the stock." });
    }
};

// ---------- DELETE /api/products/:id ----------
exports.deleteProduct = async (req, res) => {
    try {
        const result = await pool.query(
            "DELETE FROM products WHERE id = $1 AND organization_id = $2 RETURNING id",
            [req.params.id, req.user.organizationId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Product not found." });
        res.json({ message: "Product deleted." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not delete the product." });
    }
};

// ---------- GET /api/dashboard ----------
exports.getDashboard = async (req, res) => {
    try {
        const orgId = req.user.organizationId;

        const totals = await pool.query(
            `SELECT COUNT(*)::int AS total_products,
                    COALESCE(SUM(p.quantity), 0)::int AS total_quantity,
                    COALESCE(SUM(p.quantity * p.price), 0)::float AS stock_value,
                    COUNT(*) FILTER (WHERE p.quantity <= COALESCE(p.low_stock_threshold, o.low_stock_threshold))::int AS low_stock_count
             FROM products p JOIN organizations o ON o.id = p.organization_id
             WHERE p.organization_id = $1`,
            [orgId]
        );

        const low = await pool.query(
            `SELECT p.id, p.name, p.sku, p.category, p.quantity,
                    COALESCE(p.low_stock_threshold, o.low_stock_threshold) AS effective_threshold
             FROM products p JOIN organizations o ON o.id = p.organization_id
             WHERE p.organization_id = $1
               AND p.quantity <= COALESCE(p.low_stock_threshold, o.low_stock_threshold)
             ORDER BY p.quantity ASC, p.name
             LIMIT 10`,
            [orgId]
        );

        const t = totals.rows[0];
        res.json({
            totalProducts: t.total_products,
            totalQuantity: t.total_quantity,
            stockValue: t.stock_value,
            lowStockCount: t.low_stock_count,
            lowStockProducts: low.rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not load the dashboard." });
    }
};