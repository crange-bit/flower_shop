const express = require("express");
const db = require("../config/db");
const { verifyToken, requireRole } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

const reviewsDir = path.join(__dirname, "../uploads/reviews");
if (!fs.existsSync(reviewsDir)) fs.mkdirSync(reviewsDir, { recursive: true });
const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, reviewsDir),
	filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get("/", async (req, res) => {
	try {
		const reviews = await db("reviews")
			.join("users", "reviews.user_id", "users.id")
			.join("products", "reviews.product_id", "products.id")
			.where({ is_approved: true })
			.select(
				"reviews.*",
				"users.full_name",
				"products.name as product_name",
				"products.image_url as product_image"
			)
			.orderBy("reviews.created_at", "desc");
		res.json(
			reviews.map((r) => ({
				...r,
				images: r.images ? JSON.parse(r.images) : [],
			}))
		);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.get("/product/:productId", async (req, res) => {
	try {
		const reviews = await db("reviews")
			.join("users", "reviews.user_id", "users.id")
			.where({ product_id: req.params.productId, is_approved: true })
			.select("reviews.*", "users.full_name")
			.orderBy("reviews.created_at", "desc");
		const stats = await db("reviews")
			.where({ product_id: req.params.productId, is_approved: true })
			.avg("rating as avg_rating")
			.count("id as total_count")
			.first();
		res.json({
			reviews: reviews.map((r) => ({
				...r,
				images: r.images ? JSON.parse(r.images) : [],
			})),
			stats: {
				avg_rating: parseFloat(stats.avg_rating) || 0,
				total_count: parseInt(stats.total_count) || 0,
			},
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.get("/my", verifyToken, async (req, res) => {
	try {
		const reviews = await db("reviews")
			.join("products", "reviews.product_id", "products.id")
			.where({ user_id: req.user.id })
			.select("reviews.*", "products.name as product_name")
			.orderBy("reviews.created_at", "desc");
		res.json(
			reviews.map((r) => ({
				...r,
				images: r.images ? JSON.parse(r.images) : [],
			}))
		);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.get("/available-products", verifyToken, async (req, res) => {
	try {
		const products = await db("order_items")
			.join("orders", "order_items.order_id", "orders.id")
			.join("products", "order_items.product_id", "products.id")
			.where("orders.user_id", req.user.id)
			.whereNotExists(function () {
				this.select("*")
					.from("reviews")
					.whereRaw("reviews.product_id = order_items.product_id")
					.whereRaw("reviews.user_id = ?", [req.user.id]);
			})
			.distinct("products.id", "products.name")
			.orderBy("products.name");

		res.json(products);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post("/", verifyToken, upload.array("images", 5), async (req, res) => {
	try {
		const {
			product_id,
			rating,
			delivery_rating,
			quality_rating,
			price_rating,
			comment,
		} = req.body;
		const existing = await db("reviews")
			.where({ user_id: req.user.id, product_id })
			.first();
		if (existing)
			return res
				.status(400)
				.json({ error: "Вы уже оставляли отзыв на этот товар" });
		const ordered = await db("order_items")
			.join(
				"orders",
				"order_items.order_id",
				"orders.id",
				"order_statuses",
				"orders.status_id",
				"order_statuses.id"
			)
			.where("order_statuses.name", "delivered")
			.where("orders.user_id", req.user.id)
			.where("order_items.product_id", product_id)
			.first();

		if (!ordered) {
			return res.status(403).json({
				error: "Оставить отзыв можно только на товар, который вы заказывали",
			});
		}
		const imageUrls = req.files
			? req.files.map((f) => "/uploads/reviews/" + f.filename)
			: [];
		const [review] = await db("reviews")
			.insert({
				user_id: req.user.id,
				product_id,
				rating: parseInt(rating),
				delivery_rating: delivery_rating
					? parseInt(delivery_rating)
					: null,
				quality_rating: quality_rating
					? parseInt(quality_rating)
					: null,
				price_rating: price_rating ? parseInt(price_rating) : null,
				comment,
				images: JSON.stringify(imageUrls),
				is_approved: false,
			})
			.returning("*");
		res.json({ review, message: "Отзыв отправлен на модерацию" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.get(
	"/pending",
	verifyToken,
	requireRole("manager", "admin"),
	async (req, res) => {
		try {
			const reviews = await db("reviews")
				.join("users", "reviews.user_id", "users.id")
				.join("products", "reviews.product_id", "products.id")
				.where({ is_approved: false })
				.select(
					"reviews.*",
					"users.full_name",
					"products.name as product_name"
				)
				.orderBy("reviews.created_at", "desc");
			res.json(
				reviews.map((r) => ({
					...r,
					images: r.images ? JSON.parse(r.images) : [],
				}))
			);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}
);

router.patch(
	"/:id/approve",
	verifyToken,
	requireRole("manager", "admin"),
	async (req, res) => {
		try {
			await db("reviews")
				.where({ id: req.params.id })
				.update({ is_approved: true });
			res.json({ message: "Отзыв одобрен" });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}
);

router.delete(
	"/:id",
	verifyToken,
	requireRole("manager", "admin"),
	async (req, res) => {
		try {
			const review = await db("reviews")
				.where({ id: req.params.id })
				.first();
			if (review?.images) {
				JSON.parse(review.images).forEach((img) => {
					const fp = path.join(__dirname, "..", img);
					if (fs.existsSync(fp)) fs.unlinkSync(fp);
				});
			}
			await db("reviews").where({ id: req.params.id }).del();
			res.json({ message: "Отзыв удален" });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}
);

module.exports = router;