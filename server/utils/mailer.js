const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
	host: "smtp.yandex.ru",
	port: 465,
	secure: true,
	auth: {
		user: process.env.MAIL_USER,
		pass: process.env.MAIL_PASS,
	},
});

exports.sendMail = async (to, subject, html) => {
	const info = await transporter.sendMail({
		from: `"Магазин цветов RoseClick" <${process.env.MAIL_USER}>`,
		to,
		subject,
		html,
	});
	return info;
};