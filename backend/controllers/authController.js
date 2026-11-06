const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

function makeToken(user) {
    return jwt.sign(
        { userId: user.id, organizationId: user.organization_id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

function publicUser(row) {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        organizationId: row.organization_id,
        organizationName: row.organization_name,
    };
}

// ---------- Middleware: blocks requests that are not logged in ----------
exports.protect = (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: "Please log in to continue." });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.userId, organizationId: payload.organizationId };
        next();
    } catch {
        return res.status(401).json({ error: "Your session has expired. Please log in again." });
    }
};

// ---------- POST /api/auth/signup: creates an organization and its first user ----------
exports.signup = async (req, res) => {
    const { organizationName, name, email, password } = req.body;

    if (!organizationName?.trim() || !name?.trim() || !email?.trim() || !password) {
        return res.status(400).json({ error: "Please fill in all fields." });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const existing = await client.query("SELECT id FROM users WHERE email = $1", [email.trim().toLowerCase()]);
        if (existing.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ error: "An account with this email already exists." });
        }

        const org = await client.query(
            "INSERT INTO organizations (name) VALUES ($1) RETURNING id, name",
            [organizationName.trim()]
        );
        const hash = await bcrypt.hash(password, 10);
        const user = await client.query(
            `INSERT INTO users (organization_id, name, email, password_hash)
             VALUES ($1, $2, $3, $4) RETURNING id, name, email, organization_id`,
            [org.rows[0].id, name.trim(), email.trim().toLowerCase(), hash]
        );

        await client.query("COMMIT");

        const row = { ...user.rows[0], organization_name: org.rows[0].name };
        res.status(201).json({ token: makeToken(row), user: publicUser(row) });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        res.status(500).json({ error: "Could not create your account. Please try again." });
    } finally {
        client.release();
    }
};

// ---------- POST /api/auth/login ----------
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
        return res.status(400).json({ error: "Enter your email and password." });
    }

    try {
        const result = await pool.query(
            `SELECT u.id, u.name, u.email, u.password_hash, u.organization_id, o.name AS organization_name
             FROM users u JOIN organizations o ON o.id = u.organization_id
             WHERE u.email = $1`,
            [email.trim().toLowerCase()]
        );
        const row = result.rows[0];
        const valid = row && (await bcrypt.compare(password, row.password_hash));

        if (!valid) {
            return res.status(401).json({ error: "Incorrect email or password." });
        }

        res.json({ token: makeToken(row), user: publicUser(row) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not log you in. Please try again." });
    }
};

// ---------- GET /api/auth/me ----------
exports.me = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.name, u.email, u.organization_id, o.name AS organization_name
             FROM users u JOIN organizations o ON o.id = u.organization_id
             WHERE u.id = $1`,
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Account not found." });
        }
        res.json({ user: publicUser(result.rows[0]) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not load your account." });
    }
};

// ---------- GET /api/settings ----------
exports.getSettings = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT name, low_stock_threshold FROM organizations WHERE id = $1",
            [req.user.organizationId]
        );
        const org = result.rows[0];
        res.json({ organizationName: org.name, lowStockThreshold: org.low_stock_threshold });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not load settings." });
    }
};

// ---------- PUT /api/settings ----------
exports.updateSettings = async (req, res) => {
    const name = (req.body.organizationName || "").trim();
    const threshold = Number(req.body.lowStockThreshold);

    if (!name) return res.status(400).json({ error: "Organization name is required." });
    if (!Number.isInteger(threshold) || threshold < 0) {
        return res.status(400).json({ error: "Low-stock limit must be a whole number, 0 or more." });
    }

    try {
        const result = await pool.query(
            "UPDATE organizations SET name = $1, low_stock_threshold = $2 WHERE id = $3 RETURNING name, low_stock_threshold",
            [name, threshold, req.user.organizationId]
        );
        const org = result.rows[0];
        res.json({ organizationName: org.name, lowStockThreshold: org.low_stock_threshold });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not save settings." });
    }
};