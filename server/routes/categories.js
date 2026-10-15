const express = require("express");
const db = require("../config/db");
const { verifyToken, requireRole } = require("../middleware/auth");
const router = express.Router();

router.get("/", async (_, res) => {
	try {
		res.json(await db("categories").select("*").orderBy("name"));
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post(
	"/",
	verifyToken,
	requireRole("manager", "admin"),
	async (req, res) => {
		try {
			const { name, description } = req.body;
			if (!name)
				return res.status(400).json({ error: "Название обязательно" });
			const existing = await db("categories").where({ name }).first();
			if (existing)
				return res
					.status(409)
					.json({ error: "Категория уже существует" });
			const [cat] = await db("categories")
				.insert({ name, description: description || null })
				.returning("*");
			res.status(201).json(cat);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}
);

router.patch(
	"/:id",
	verifyToken,
	requireRole("manager", "admin"),
	async (req, res) => {
		try {
			const { name, description } = req.body;
			if (name) {
				const exists = await db("categories")
					.where({ name })
					.whereNot({ id: req.params.id })
					.first();
				if (exists)
					return res
						.status(409)
						.json({ error: "Категория уже существует" });
			}
			const [cat] = await db("categories")
				.where({ id: req.params.id })
				.update({ name, description })
				.returning("*");
			if (!cat)
				return res.status(404).json({ error: "Категория не найдена" });
			res.json(cat);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}
);

router.delete(
	"/:id",
	verifyToken,
	requireRole("manager", "admin"),
	async (req, res) => {
		try {
			const products = await db("products").where({
				category_id: req.params.id,
			});
			if (products.length > 0)
				return res
					.status(400)
					.json({ error: "Нельзя удалить категорию с товарами" });
			await db("categories").where({ id: req.params.id }).del();
			res.json({ message: "Категория удалена" });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}
);

module.exports = router;