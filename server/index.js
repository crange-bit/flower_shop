require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const auth = require("./routes/auth");
const products = require("./routes/products");
const categories = require("./routes/categories");
const cart = require("./routes/cart");
const orders = require("./routes/orders");
const admin = require("./routes/admin");
const roles = require("./routes/roles");
const reviews = require("./routes/reviews");
const promotions = require("./routes/promotions");
const orderStatuses = require("./routes/order-statuses");
const users = require("./routes/users");
const consultation = require("./routes/consultation");
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5174" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", auth);
app.use("/api/products", products);
app.use("/api/categories", categories);
app.use("/api/cart", cart);
app.use("/api/orders", orders);
app.use("/api/admin", admin);
app.use("/api/roles", roles);
app.use("/api/reviews", reviews);
app.use("/api/promotions", promotions);
app.use("/api/order-statuses", orderStatuses);
app.use("/api/users", users);
app.use("/api/consultation", consultation);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`Сервер запущен на http://localhost:${PORT}`);
});