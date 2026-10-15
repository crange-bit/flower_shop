const express = require("express");
const db = require("../config/db");
const { verifyToken, requireRole } = require("../middleware/auth");
const router = express.Router();

router.get("/", async (req, res) => {
	try {
		const now = new Date().toISOString().split("T")[0];
		const promotions = await db("promotions")
			.where("start_date", "<=", now)
			.where("end_date", ">=", now)
			.where({ is_active: true })
			.orderBy("created_at", "desc");
		res.json(promotions);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.get(
	"/all",
	verifyToken,
	requireRole("admin", "manager"),
	async (req, res) => {
		try {
			const promotions = await db("promotions").orderBy(
				"created_at",
				"desc"
			);
			res.json(promotions);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}
);

router.post("/apply", async (req, res) => {
	try {
		const { code, total_amount, userId } = req.body;
		const now = new Date().toISOString().split("T")[0];
		const promotion = await db("promotions")
			.where({ code, is_active: true })
			.where("start_date", "<=", now)
			.where("end_date", ">=", now)
			.first();
		if (!promotion)
			return res.status(404).json({ error: "Промокод не найден" });
		if (promotion.max_uses && promotion.used_count >= promotion.max_uses)
			return res.status(400).json({ error: "Лимит использований" });
		if (total_amount < promotion.min_order_amount)
			return res.status(400).json({
				error: "Минимальная сумма: " + promotion.min_order_amount,
			});

		if (userId) {
			const userUsed = await db("user_promotions")
				.where({
					user_id: userId,
					promotion_id: promotion.id,
					is_used: true,
				})
				.first();
			if (userUsed)
				return res
					.status(400)
					.json({ error: "Вы уже использовали этот промокод" });
		}

		let discount =
			promotion.type === "percentage"
				? (total_amount * promotion.value) / 100
				: promotion.value;
		res.json({
			discount,
			promotion,
			discount_amount: discount,
			final_amount: total_amount - discount,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post("/use", verifyToken, async (req, res) => {
	try {
		const { code } = req.body;
		const promotion = await db("promotions").where({ code }).first();
		if (!promotion)
			return res.status(404).json({ error: "Промокод не найден" });
		await db("user_promotions").insert({
			user_id: req.user.id,
			promotion_id: promotion.id,
			is_used: true,
			used_at: db.fn.now(),
		});
		await db("promotions")
			.where({ id: promotion.id })
			.increment("used_count", 1);
		res.json({ message: "Промокод активирован" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post(
	"/",
	verifyToken,
	requireRole("admin", "manager"),
	async (req, res) => {
		try {
			const {
				name,
				code,
				type,
				value,
				min_order_amount,
				start_date,
				end_date,
			} = req.body;

			if (!name || !code || !type || !value || !start_date || !end_date) {
				return res
					.status(400)
					.json({ error: "Заполните все обязательные поля" });
			}
			if (!["percentage", "fixed"].includes(type)) {
				return res.status(400).json({ error: "Неверный тип акции" });
			}

			const existing = await db("promotions").where({ code }).first();
			if (existing) {
				return res.status(409).json({
					error: `Промокод «${code}» уже существует. Придумайте другой код.`,
				});
			}

			const [promotion] = await db("promotions")
				.insert({
					name,
					code,
					type,
					value: parseFloat(value),
					min_order_amount: parseFloat(min_order_amount) || 0,
					start_date,
					end_date,
					is_active: true,
				})
				.returning("*");

			res.status(201).json(promotion);
		} catch (err) {
			console.error("Ошибка создания акции:", err);
			res.status(500).json({ error: "Ошибка создания акции" });
		}
	}
);

router.put(
	"/:id",
	verifyToken,
	requireRole("admin", "manager"),
	async (req, res) => {
		try {
			const [promotion] = await db("promotions")
				.where({ id: req.params.id })
				.update(req.body)
				.returning("*");
			res.json(promotion);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}
);

router.delete("/:id", verifyToken, requireRole("admin"), async (req, res) => {
	try {
		await db("promotions").where({ id: req.params.id }).del();
		res.json({ message: "Акция удалена" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;