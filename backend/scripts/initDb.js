require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const pool = require("../config/database");

async function initializeDatabase() {
    try {
        const schema = fs.readFileSync(path.join(__dirname, "..", "db", "schema.sql"), "utf8");
        await pool.query(schema);
        console.log("StockFlow database tables are ready.");
    } catch (err) {
        console.error("Could not initialize the database:", err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

initializeDatabase();
