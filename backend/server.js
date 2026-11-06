
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("node:fs");
const path = require("node:path");

const pool = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();

// CORS configuration
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set before starting the server.");
}

app.use(cors({
    origin(origin, callback) {
        if (
            !origin ||
            !process.env.FRONTEND_URL ||
            allowedOrigins.includes(origin)
        ) {
            return callback(null, true);
        }

        return callback(new Error("This origin is not allowed by CORS."));
    },
}));

app.use(express.json());

// Database health check
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            status: "ok",
            message: "Database connected successfully"
        });
    } catch (err) {
        console.error("Health check failed:", err);

        res.status(503).json({
            status: "error",
            error: "Database connection failed."
        });
    }
});

// API routes
app.use("/api", authRoutes);
app.use("/api", productRoutes);

// Serve React frontend
const frontendPath = path.join(__dirname, "..", "frontend", "dist");

if (fs.existsSync(frontendPath)) {
    console.log("Frontend build found:", frontendPath);

    app.use(express.static(frontendPath));

    // React Router support
    app.get("/{*path}", (req, res) => {
        res.sendFile(path.join(frontendPath, "index.html"));
    });
} else {
    console.error("Frontend dist folder not found:", frontendPath);

    app.get("/", (req, res) => {
        res.status(503).send("Frontend build not found.");
    });
}

// Start server
async function start() {
    try {
        // Initialize database schema
        const schemaPath = path.join(__dirname, "db", "schema.sql");

        const schema = fs.readFileSync(schemaPath, "utf8");

        await pool.query(schema);

        console.log("Database initialized successfully.");

        const port = process.env.PORT || 5000;

        app.listen(port, "0.0.0.0", () => {
            console.log(`StockFlow server running on port ${port}`);
        });

    } catch (err) {
        console.error(
            "Could not initialize database or start server:",
            err
        );

        await pool.end();
        process.exit(1);
    }
}

start();
