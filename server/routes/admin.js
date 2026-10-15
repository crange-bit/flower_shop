const express = require("express");
const db = require("../config/db");
const { verifyToken, requireRole } = require("../middleware/auth");
const router = express.Router();

router.use(verifyToken, requireRole("admin"));

router.get("/users", async (_, res) => {
	try {
		const users = await db("users")
			.select(
				"users.id",
				"users.email",
				"users.full_name",
				"users.phone",
				"users.is_verified"
			)
			.orderBy("users.id", "desc");

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
});

router.patch("/users/:id/role", async (req, res) => {
	const { role_id } = req.body;
	if (!role_id) {
		return res.status(400).json({ error: "Необходимо указать role_id" });
	}
	try {
		const role = await db("roles").where({ id: role_id }).first();
		if (!role) {
			return res.status(400).json({ error: "Роль не найдена" });
		}
		const existing = await db("user_roles")
			.where({ user_id: req.params.id })
			.first();
		if (existing) {
			await db("user_roles")
				.where({ user_id: req.params.id })
				.update({ role_id });
		} else {
			await db("user_roles").insert({
				user_id: req.params.id,
				role_id,
			});
		}
		const updatedUser = await db("users")
			.where({ id: req.params.id })
			.select("id", "email", "full_name")
			.first();
		res.json({ ...updatedUser, role: role.name, role_id: role.id });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Ошибка обновления роли" });
	}
});

router.delete("/users/:id", async (req, res) => {
	try {
		await db("user_roles").where({ user_id: req.params.id }).del();
		await db("users").where({ id: req.params.id }).del();
		res.json({ message: "Пользователь удалён" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Ошибка удаления пользователя" });
	}
});

module.exports = router;