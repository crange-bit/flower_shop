const express = require("express");
const db = require("../config/db");
const { verifyToken, requireRole } = require("../middleware/auth");
const router = express.Router();

router.get(
	"/",
	verifyToken,
	requireRole("manager", "admin"),
	async (req, res) => {
		try {
			const users = await db("users")
				.select(
					"id",
					"email",
					"full_name",
					"phone",
					"created_at",
					"is_verified"
				)
				.orderBy("created_at", "desc");

			const usersWithRoles = await Promise.all(
				users.map(async (user) => {
					const roleData = await db("roles")
						.join("user_roles", "roles.id", "user_roles.role_id")
						.where("user_roles.user_id", user.id)
						.first();
					return {
						...user,
						role: roleData ? roleData.name : "user",
						role_id: roleData ? roleData.id : null,
					};
				})
			);

			res.json(usersWithRoles);
		} catch (err) {
			console.error(err);
			res.status(500).json({ error: "Ошибка загрузки пользователей" });
		}
	}
);

router.get(
	"/:id/orders",
	verifyToken,
	requireRole("manager", "admin"),
	async (req, res) => {
		try {
			const orders = await db("orders")
				.leftJoin(
					"order_statuses",
					"orders.status_id",
					"order_statuses.id"
				)
				.where("orders.user_id", req.params.id)
				.select("orders.*", "order_statuses.name as status_name")
				.orderBy("orders.created_at", "desc");
			res.json(orders);
		} catch (err) {
			console.error(err);
			res.status(500).json({
				error: "Ошибка загрузки заказов пользователя",
			});
		}
	}
);

module.exports = router;