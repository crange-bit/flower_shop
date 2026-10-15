const express = require("express");
const db = require("../config/db");
const { verifyToken, requireRole } = require("../middleware/auth");
const router = express.Router();

router.get("/", verifyToken, requireRole("admin"), async (_, res) => {
	try {
		const roles = await db("roles").select("id", "name");
		res.json(roles);
	} catch (err) {
		console.error("Ошибка загрузки ролей:", err);
		res.status(500).json({ error: "Ошибка загрузки ролей" });
	}
});

module.exports = router;