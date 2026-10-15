const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validate } = require("validate.js");
const crypto = require("crypto");
const db = require("../config/db");
const mailer = require("../utils/mailer");
const { verifyToken } = require("../middleware/auth");
const router = express.Router();

router.post("/register", async (req, res) => {
	const constraints = {
		email: { presence: true, email: true },
		password_hash: { presence: true, length: { minimum: 6 } },
		full_name: { presence: true },
	};
	const errors = validate(req.body, constraints);
	if (errors) return res.status(400).json({ error: errors });

	try {
		if (await db("users").where({ email: req.body.email }).first())
			return res.status(409).json({ error: "Email занят" });

		const hash = await bcrypt.hash(req.body.password_hash, 10);
		const verificationToken = crypto.randomBytes(32).toString("hex");
		const roleToAssign = req.body.role || "user";

		const user = await db.transaction(async (trx) => {
			const [newUser] = await trx("users")
				.insert({
					email: req.body.email,
					password_hash: hash,
					full_name: req.body.full_name,
					phone: req.body.phone,
					verification_token: verificationToken,
					is_verified: false,
				})
				.returning(["id", "email", "full_name", "verification_token"]);

			const roleRecord = await trx("roles")
				.where({ name: roleToAssign })
				.first();
			if (!roleRecord) throw new Error("Роль не найдена");

			await trx("user_roles").insert({
				user_id: newUser.id,
				role_id: roleRecord.id,
			});
			return newUser;
		});

		const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
		await mailer.sendMail(
			user.email,
			"Подтверждение регистрации - Цветочный магазин RoseClick",
			`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
            <h2 style="color: #6b8c21;">Добро пожаловать, ${req.body.full_name}!</h2>
            <p>Спасибо за регистрацию в нашем магазине цветов.</p>
            <p>Для активации аккаунта нажмите на кнопку ниже:</p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #6b8c21; color: white; text-decoration: none; border-radius: 5px;">Подтвердить Email</a>
            <p style="margin-top: 20px; font-size: 12px; color: #888;">Если вы не регистрировались, проигнорируйте это письмо.</p>
        </div>
        `
		);

		res.status(201).json({
			message:
				"Регистрация успешна! Проверьте вашу почту для подтверждения email.",
			user: { id: user.id, email: user.email, full_name: user.full_name },
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

router.get("/verify-email", async (req, res) => {
	const { token } = req.query;

	if (!token) {
		return res
			.status(400)
			.json({ error: "Токен подтверждения отсутствует" });
	}

	try {
		const user = await db("users")
			.where({ verification_token: token })
			.first();

		if (!user) {
			return res
				.status(400)
				.json({ error: "Неверный или устаревший токен" });
		}

		await db("users").where({ id: user.id }).update({
			is_verified: true,
			verification_token: null,
		});

		res.json({
			message: "Email успешно подтвержден! Теперь вы можете войти.",
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post("/login", async (req, res) => {
	const errors = validate(req.body, {
		email: { presence: true },
		password: { presence: true },
	});
	if (errors) return res.status(400).json({ error: errors });

	try {
		const user = await db("users").where({ email: req.body.email }).first();

		if (
			!user ||
			!(await bcrypt.compare(req.body.password, user.password_hash))
		) {
			return res.status(401).json({ error: "Неверные учетные данные" });
		}

		if (!user.is_verified) {
			return res.status(403).json({
				error: "Пожалуйста, подтвердите ваш email перед входом. Проверьте почту.",
			});
		}

		const roleData = await db("roles")
			.join("user_roles", "roles.id", "user_roles.role_id")
			.where("user_roles.user_id", user.id)
			.first();

		const role = roleData ? roleData.name : "user";
		const token = jwt.sign(
			{ id: user.id, email: user.email, role },
			process.env.JWT_SECRET,
			{ expiresIn: "24h" }
		);

		res.json({
			token,
			user: {
				id: user.id,
				email: user.email,
				role,
				full_name: user.full_name,
			},
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post("/forgot-password", async (req, res) => {
	const { email } = req.body;

	if (!email) {
		return res.status(400).json({ error: "Email обязателен" });
	}

	try {
		const user = await db("users").where({ email }).first();

		if (!user) {
			return res.json({
				message:
					"Если пользователь существует, инструкция отправлена на почту",
			});
		}

		const resetToken = crypto.randomBytes(32).toString("hex");
		const resetExpires = new Date(Date.now() + 3600000);

		await db("users").where({ id: user.id }).update({
			reset_password_token: resetToken,
			reset_password_expires: resetExpires,
		});

		const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
		await mailer.sendMail(
			user.email,
			"Сброс пароля - Цветочный магазин RoseClick",
			`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
            <h2 style="color: #6b8c21;">Сброс пароля</h2>
            <p>Вы (или кто-то другой) запросили смену пароля.</p>
            <p>Нажмите кнопку ниже, чтобы задать новый пароль:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #c9b376; color: white; text-decoration: none; border-radius: 5px;">Сбросить пароль</a>
            <p style="margin-top: 20px; font-size: 12px; color: #888;">Ссылка действительна 1 час.</p>
        </div>
        `
		);

		res.json({
			message: "Инструкция по сбросу пароля отправлена на почту",
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post("/reset-password", async (req, res) => {
	const { token, new_password } = req.body;

	if (!token || !new_password) {
		return res
			.status(400)
			.json({ error: "Токен и новый пароль обязательны" });
	}

	if (new_password.length < 6) {
		return res
			.status(400)
			.json({ error: "Пароль должен содержать минимум 6 символов" });
	}

	try {
		const user = await db("users")
			.where({
				reset_password_token: token,
			})
			.where("reset_password_expires", ">", new Date())
			.first();

		if (!user) {
			return res
				.status(400)
				.json({ error: "Неверный или устаревший токен" });
		}

		const hash = await bcrypt.hash(new_password, 10);

		await db("users").where({ id: user.id }).update({
			password_hash: hash,
			reset_password_token: null,
			reset_password_expires: null,
		});

		res.json({
			message:
				"Пароль успешно изменен! Теперь вы можете войти с новым паролем.",
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post("/change-password", verifyToken, async (req, res) => {
	const { current_password, new_password } = req.body;
	const userId = req.user.id;

	if (!userId) {
		return res.status(401).json({ error: "Необходима авторизация" });
	}

	if (!current_password || !new_password) {
		return res
			.status(400)
			.json({ error: "Текущий и новый пароль обязательны" });
	}

	if (new_password.length < 6) {
		return res.status(400).json({
			error: "Новый пароль должен содержать минимум 6 символов",
		});
	}

	try {
		const user = await db("users").where({ id: userId }).first();

		if (!user) {
			return res.status(404).json({ error: "Пользователь не найден" });
		}

		const isPasswordValid = await bcrypt.compare(
			current_password,
			user.password_hash
		);

		if (!isPasswordValid) {
			return res.status(401).json({ error: "Неверный текущий пароль" });
		}

		const hash = await bcrypt.hash(new_password, 10);

		await db("users").where({ id: userId }).update({ password_hash: hash });

		res.json({ message: "Пароль успешно изменен" });
	} catch (err) {
		console.error("Ошибка смены пароля:", err);
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;