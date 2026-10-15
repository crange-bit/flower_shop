const express = require("express");
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");
const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
	try {
		const items = await db("cart_items")
			.join("products", "cart_items.product_id", "products.id")
			.where("cart_items.user_id", req.user.id)
			.select(
				"cart_items.id as cart_id",
				"products.id",
				"products.name",
				"products.price",
				"products.image_url",
				"products.stock",
				"cart_items.quantity"
			);
		res.json(items);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Ошибка загрузки корзины" });
	}
});

router.post("/", verifyToken, async (req, res) => {
	const { product_id, quantity = 1 } = req.body;
	try {
		const product = await db("products").where({ id: product_id }).first();
		if (!product) {
			return res.status(404).json({ error: "Товар не найден" });
		}

		const existing = await db("cart_items")
			.where({ user_id: req.user.id, product_id })
			.first();
		const currentQty = existing ? existing.quantity : 0;
		const newQty = currentQty + Number(quantity);

		if (newQty > product.stock) {
			return res.status(400).json({
				error: `На складе только ${product.stock} шт. В корзине уже ${currentQty} шт.`,
			});
		}

		await db("cart_items")
			.insert({ user_id: req.user.id, product_id, quantity })
			.onConflict(["user_id", "product_id"])
			.merge({ quantity: newQty });

		res.json({ message: "Обновлено", quantity: newQty });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Ошибка добавления в корзину" });
	}
});

router.patch("/:id", verifyToken, async (req, res) => {
	const { quantity } = req.body;
	const qty = parseInt(quantity);

	if (!qty || qty < 1) {
		return res
			.status(400)
			.json({ error: "Количество должно быть не меньше 1" });
	}

	try {
		const item = await db("cart_items")
			.join("products", "cart_items.product_id", "products.id")
			.where("cart_items.id", req.params.id)
			.where("cart_items.user_id", req.user.id)
			.select("cart_items.id", "products.stock", "products.name")
			.first();

		if (!item) {
			return res.status(404).json({ error: "Позиция не найдена" });
		}

		if (qty > item.stock) {
			return res.status(400).json({
				error: `На складе только ${item.stock} шт. товара «${item.name}»`,
			});
		}

		await db("cart_items")
			.where({ id: req.params.id })
			.update({ quantity: qty });
		res.json({ message: "Количество обновлено", quantity: qty });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Ошибка обновления количества" });
	}
});

router.delete("/:id", verifyToken, async (req, res) => {
	try {
		await db("cart_items")
			.where({ id: req.params.id, user_id: req.user.id })
			.del();
		res.json({ message: "Удалено" });
	} catch (err) {
		res.status(500).json({ error: "Ошибка удаления" });
	}
});

module.exports = router;