require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("node:fs");
const path = require("node:path");
const pool = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set before starting the server.");
}

if (process.env.FRONTEND_URL) {
    app.use(cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("This origin is not allowed by CORS."));
        },
    }));

app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ status: "ok" });
    } catch (err) {
        console.error("Health check failed:", err);
        res.status(503).json({ status: "error", error: "Database connection failed." });
    }
});

// All API routes start with /api
app.use("/api", authRoutes);
app.use("/api", productRoutes);

const frontendPath = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get("/{*path}", (req, res) => {
        res.sendFile(path.join(frontendPath, "index.html"));
    });
}

async function start() {
    try {
        const schemaPath = path.join(__dirname, "db", "schema.sql");
        await pool.query(fs.readFileSync(schemaPath, "utf8"));
        const port = process.env.PORT || 5000;
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (err) {
        console.error("Could not initialize the database or start the server:", err);
        process.exitCode = 1;
        await pool.end();
    }
}

start();