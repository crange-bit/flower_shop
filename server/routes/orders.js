const express = require("express");
const db = require("../config/db");
const { verifyToken, requireRole } = require("../middleware/auth");
const mailer = require("../utils/mailer");
const router = express.Router();

const DELIVERY_FEE = 500;
const FREE_DELIVERY_THRESHOLD = 5000;

const PURPOSE_LABELS = {
	celebration: "Праздник / поздравление",
	romantic: "Романтика / свидание",
	wedding: "Свадьба",
	birthday: "День рождения",
	anniversary: "Годовщина",
	sympathy: "Соболезнования",
	other: "Другое",
};

router.post("/", verifyToken, async (req, res) => {
	const {
		delivery_address,
		contact_phone,
		comment,
		purpose = "celebration",
	} = req.body;

	if (!delivery_address || !contact_phone) {
		return res.status(400).json({ error: "Адрес и телефон обязательны" });
	}

	const cleaned = String(contact_phone).replace(/[\s()+-]/g, "");
	if (
		!/^\+?\d+$/.test(String(contact_phone).replace(/[\s()-]/g, "")) ||
		cleaned.length < 10 ||
		cleaned.length > 15
	) {
		return res.status(400).json({ error: "Некорректный номер телефона" });
	}

	try {
		await db.transaction(async (trx) => {
			const cart = await trx("cart_items")
				.join("products", "cart_items.product_id", "products.id")
				.where("cart_items.user_id", req.user.id)
				.select(
					"cart_items.product_id",
					"cart_items.quantity",
					"products.price",
					"products.stock",
					"products.name"
				);

			if (!cart.length) throw new Error("Корзина пуста");

			let subtotal = 0;
			for (const item of cart) {
				if (item.quantity > item.stock) {
					throw new Error(
						`Недостаточно товара «${item.name}». Доступно: ${item.stock}`
					);
				}
				subtotal += Number(item.price) * item.quantity;
			}

			const deliveryCost =
				subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
			const orderTotal = subtotal + deliveryCost;

			const statusRecord = await trx("order_statuses")
				.where({ name: "new" })
				.first();
			if (!statusRecord) throw new Error("Статус заказа не найден");

			const [order] = await trx("orders")
				.insert({
					user_id: req.user.id,
					status_id: statusRecord.id,
					total_amount: orderTotal,
					delivery_address,
					contact_phone,
					comment: comment || null,
					purpose: purpose || "celebration",
					created_at: trx.fn.now(),
					updated_at: trx.fn.now(),
				})
				.returning("*");

			for (const item of cart) {
				await trx("order_items").insert({
					order_id: order.id,
					product_id: item.product_id,
					quantity: item.quantity,
					unit_price: item.price,
				});
				await trx("products")
					.where({ id: item.product_id })
					.decrement("stock", item.quantity);
			}

			await trx("cart_items").where("user_id", req.user.id).del();

			try {
				await mailer.sendMail(
					req.user.email,
					`Заказ #${order.id} оформлен`,
					`
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
						<h2 style="color: #7ba61d;">Ваш заказ #${order.id} оформлен!</h2>
						<p><strong>Сумма заказа:</strong> ${orderTotal} ₽</p>
						<p><strong>Адрес доставки:</strong> ${delivery_address}</p>
						<p><strong>Телефон:</strong> ${contact_phone}</p>
						<p><strong>Назначение:</strong> ${PURPOSE_LABELS[purpose] || purpose}</p>
						<p>Спасибо за заказ! Мы свяжемся с вами в ближайшее время.</p>
					</div>
					`
				);
			} catch (mailErr) {
				console.error("Ошибка отправки письма:", mailErr.message);
			}

			res.status(201).json({
				...order,
				message: "Заказ успешно оформлен!",
				total_amount: orderTotal,
			});
		});
	} catch (err) {
		console.error("Ошибка оформления заказа:", err);
		res.status(500).json({ error: err.message });
	}
});

router.get("/", verifyToken, async (req, res) => {
	try {
		const orders = await db("orders")
			.leftJoin("order_statuses", "orders.status_id", "order_statuses.id")
			.where("orders.user_id", req.user.id)
			.select("orders.*", "order_statuses.name as status_name")
			.orderBy("orders.created_at", "desc");

		if (orders.length === 0) {
			return res.json([]);
		}

		const orderIds = orders.map((o) => o.id);
		const items = await db("order_items")
			.join("products", "order_items.product_id", "products.id")
			.whereIn("order_items.order_id", orderIds)
			.select(
				"order_items.order_id",
				"order_items.product_id",
				"order_items.quantity",
				"order_items.unit_price",
				"products.name",
				"products.image_url"
			);

		const itemsByOrder = items.reduce((acc, item) => {
			if (!acc[item.order_id]) acc[item.order_id] = [];
			acc[item.order_id].push(item);
			return acc;
		}, {});

		res.json(
			orders.map((o) => ({
				...o,
				status: o.status_name || "new",
				items: itemsByOrder[o.id] || [],
			}))
		);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Ошибка загрузки заказов" });
	}
});

router.get("/statuses", async (_, res) => {
	try {
		res.json(
			await db("order_statuses")
				.select("id", "name", "description")
				.orderBy("id")
		);
	} catch (err) {
		res.status(500).json({ error: "Ошибка загрузки статусов" });
	}
});

router.get(
	"/all",
	verifyToken,
	requireRole("manager", "admin"),
	async (_, res) => {
		try {
			const orders = await db("orders")
				.leftJoin(
					"order_statuses",
					"orders.status_id",
					"order_statuses.id"
				)
				.leftJoin("users", "orders.user_id", "users.id")
				.select(
					"orders.*",
					"order_statuses.name as status_name",
					"users.email",
					"users.full_name"
				)
				.orderBy("orders.created_at", "desc");

			if (orders.length === 0) {
				return res.json([]);
			}

			const orderIds = orders.map((o) => o.id);
			const items = await db("order_items")
				.join("products", "order_items.product_id", "products.id")
				.whereIn("order_items.order_id", orderIds)
				.select(
					"order_items.order_id",
					"order_items.product_id",
					"order_items.quantity",
					"order_items.unit_price",
					"products.name",
					"products.image_url"
				);

			const itemsByOrder = items.reduce((acc, item) => {
				if (!acc[item.order_id]) acc[item.order_id] = [];
				acc[item.order_id].push(item);
				return acc;
			}, {});

			res.json(
				orders.map((o) => ({
					...o,
					status: o.status_name || "new",
					items: itemsByOrder[o.id] || [],
				}))
			);
		} catch (err) {
			console.error(err);
			res.status(500).json({ error: "Ошибка загрузки заказов" });
		}
	}
);

router.patch(
	"/:id/status",
	verifyToken,
	requireRole("manager", "admin"),
	async (req, res) => {
		const { status_id } = req.body;
		if (!status_id) {
			return res
				.status(400)
				.json({ error: "Необходимо указать status_id" });
		}
		try {
			const status = await db("order_statuses")
				.where({ id: status_id })
				.first();
			if (!status) {
				return res.status(400).json({ error: "Статус не найден" });
			}
			const [order] = await db("orders")
				.where({ id: req.params.id })
				.update({ status_id, updated_at: db.fn.now() })
				.returning("*");
			if (!order) {
				return res.status(404).json({ error: "Заказ не найден" });
			}
			const user = await db("users").where({ id: order.user_id }).first();
			if (user?.email) {
				try {
					await mailer.sendMail(
						user.email,
						`Статус заказа #${order.id} изменён`,
						`<p>Новый статус: <strong>${status.name}</strong></p>`
					);
				} catch (e) {
					console.error("Ошибка отправки письма:", e.message);
				}
			}
			res.json({
				...order,
				status: status.name,
				message: "Статус обновлён",
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({ error: "Ошибка обновления статуса" });
		}
	}
);

router.delete("/:id", verifyToken, requireRole("admin"), async (req, res) => {
	try {
		const order = await db("orders").where({ id: req.params.id }).first();
		if (!order) return res.status(404).json({ error: "Заказ не найден" });
		await db("order_items").where({ order_id: req.params.id }).del();
		await db("orders").where({ id: req.params.id }).del();
		res.json({ message: "Заказ удалён" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Ошибка удаления заказа" });
	}
});

module.exports = router;