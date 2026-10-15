const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dir = path.join(__dirname, "../uploads");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
module.exports = multer({
	storage: multer.diskStorage({
		destination: (_, __, cb) => cb(null, dir),
		filename: (_, file, cb) =>
			cb(null, `${Date.now()}-${file.originalname}`),
	}),
	limits: { fileSize: 5 * 1024 * 1024 },
});