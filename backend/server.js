require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be set before starting the server.");
}

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("This origin is not allowed by CORS."));
    },
}));
app.use(express.json());

app.get("/", (req, res) => {
    res.send("StockFlow Backend Running");
});

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});