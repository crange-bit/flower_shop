const express = require("express");
const db = require("../config/db");
const { verifyToken, requireRole } = require("../middleware/auth");
const router = express.Router();

router.get("/", verifyToken, requireRole("manager"), async (req, res) => {
	try {
		const statuses = await db("order_statuses").select("*").orderBy("id");
		res.json(statuses);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post("/", verifyToken, requireRole("manager"), async (req, res) => {
	try {
		const { name, description } = req.body;
		const [status] = await db("order_statuses")
			.insert({ name, description })
			.returning("*");
		res.status(201).json(status);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.put("/:id", verifyToken, requireRole("manager"), async (req, res) => {
	try {
		const [status] = await db("order_statuses")
			.where({ id: req.params.id })
			.update(req.body)
			.returning("*");
		res.json(status);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.delete("/:id", verifyToken, requireRole("admin"), async (req, res) => {
	try {
		await db("order_statuses").where({ id: req.params.id }).del();
		res.json({ message: "Статус удален" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;