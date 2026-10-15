const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
	const auth = req.headers.authorization;
	if (!auth || !auth.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Требуется авторизация" });
	}
	try {
		const token = auth.split(" ")[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;
		next();
	} catch (error) {
		console.error("Ошибка верификации токена:", error.message);
		return res
			.status(403)
			.json({ error: "Неверный или просроченный токен" });
	}
};

exports.requireRole =
	(...roles) =>
	(req, res, next) => {
		if (!req.user || !roles.includes(req.user.role)) {
			return res.status(403).json({ error: "Недостаточно прав" });
		}
		next();
	};