const express = require("express");
const { protect } = require("../controllers/authController");
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    updateStock,
    deleteProduct,
    getDashboard,
} = require("../controllers/productController");

const router = express.Router();

router.get("/dashboard", protect, getDashboard);

router.get("/products", protect, getProducts);
router.get("/products/:id", protect, getProduct);
router.post("/products", protect, createProduct);
router.put("/products/:id", protect, updateProduct);
router.patch("/products/:id/stock", protect, updateStock);
router.delete("/products/:id", protect, deleteProduct);

module.exports = router;