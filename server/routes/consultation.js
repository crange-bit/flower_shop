const express = require("express");
const mailer = require("../utils/mailer");
const router = express.Router();

router.post("/", async (req, res) => {
	const { name, phone } = req.body;

	if (!name || !phone) {
		return res.status(400).json({ error: "Имя и телефон обязательны" });
	}

	const cleaned = String(phone).replace(/[\s()+-]/g, "");
	if (
		!/^\+?\d+$/.test(String(phone).replace(/[\s()-]/g, "")) ||
		cleaned.length < 10 ||
		cleaned.length > 15
	) {
		return res.status(400).json({ error: "Некорректный номер телефона" });
	}

	try {
		const now = new Date().toLocaleString("ru-RU", {
			timeZone: "Europe/Moscow",
		});

		await mailer.sendMail(
			process.env.MAIL_USER,
			"Новая заявка на консультацию с сайта RoseClick",
			`
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
				<h2 style="color: #7ba61d; margin-top: 0;">Новая заявка на консультацию</h2>
				<p>На сайте <strong>RoseClick</strong> была оставлена заявка на консультацию.</p>
				<table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
					<tr>
						<td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Имя клиента:</strong></td>
						<td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
					</tr>
					<tr>
						<td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Телефон:</strong></td>
						<td style="padding: 8px; border-bottom: 1px solid #eee;">${phone}</td>
					</tr>
					<tr>
						<td style="padding: 8px;"><strong>Дата и время:</strong></td>
						<td style="padding: 8px;">${now}</td>
					</tr>
				</table>
				<p style="margin-bottom: 0;">Пожалуйста, свяжитесь с клиентом как можно скорее.</p>
			</div>
			`
		);

		res.json({ message: "Заявка успешно отправлена" });
	} catch (err) {
		console.error("Ошибка отправки заявки:", err);
		res.status(500).json({ error: "Ошибка отправки заявки" });
	}
});

module.exports = router;