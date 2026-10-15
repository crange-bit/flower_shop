const express = require("express");
const db = require("../config/db");
const upload = require("../middleware/upload");
const { verifyToken, requireRole } = require("../middleware/auth");
const router = express.Router();

router.get("/", async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 9;
	const search = req.query.search || "";
	const categoryId = req.query.category_id;
	const minPrice = parseFloat(req.query.min_price) || 0;
	const maxPrice = parseFloat(req.query.max_price) || 1000000;
	const sortBy = req.query.sort_by || "created_at";
	const sortOrder = req.query.sort_order === "asc" ? "asc" : "desc";

	try {
		let query = db("products")
			.leftJoin("categories", "products.category_id", "categories.id")
			.leftJoin("reviews", function () {
				this.on("products.id", "=", "reviews.product_id").andOn(
					"reviews.is_approved",
					"=",
					db.raw("true")
				);
			})
			.where({ "products.is_active": true })
			.whereBetween("products.price", [minPrice, maxPrice]);

		if (search) {
			query = query.where(function () {
				this.where("products.name", "ilike", `%${search}%`).orWhere(
					"products.description",
					"ilike",
					`%${search}%`
				);
			});
		}

		if (categoryId) {
			query = query.where("products.category_id", categoryId);
		}

		query = query
			.groupBy("products.id", "categories.name")
			.select(
				"products.*",
				"categories.name as category_name",
				db.raw("COALESCE(AVG(reviews.rating), 0) as avg_rating"),
				db.raw("COUNT(DISTINCT reviews.id) as review_count")
			);

		if (sortBy === "rating") {
			query = query.orderBy("avg_rating", sortOrder);
		} else if (sortBy === "price") {
			query = query.orderBy("products.price", sortOrder);
		} else if (sortBy === "name") {
			query = query.orderBy("products.name", sortOrder);
		} else {
			query = query.orderBy("products.created_at", "desc");
		}

		const countQuery = db("products").where({ is_active: true });

		if (search) {
			countQuery.where(function () {
				this.where("products.name", "ilike", `%${search}%`).orWhere(
					"products.description",
					"ilike",
					`%${search}%`
				);
			});
		}
		if (categoryId) {
			countQuery.where("products.category_id", categoryId);
		}
		countQuery.whereBetween("price", [minPrice, maxPrice]);

		const [{ count }] = await countQuery.count("* as count");

		const items = await query.limit(limit).offset((page - 1) * limit);

		res.json({
			data: items,
			total: parseInt(count),
			page,
			pages: Math.ceil(count / limit),
		});
	} catch (err) {
		console.error("Ошибка получения товаров:", err);
		res.status(500).json({ error: err.message });
	}
});

router.get("/:id", async (req, res) => {
	try {
		const product = await db("products")
			.leftJoin("categories", "products.category_id", "categories.id")
			.leftJoin("reviews", function () {
				this.on("products.id", "=", "reviews.product_id").andOn(
					"reviews.is_approved",
					"=",
					db.raw("true")
				);
			})
			.where("products.id", req.params.id)
			.groupBy(
				"products.id",
				"categories.name",
				"products.category_id",
				"products.name",
				"products.description",
				"products.price",
				"products.stock",
				"products.image_url",
				"products.is_active",
				"products.created_at"
			)
			.select(
				"products.*",
				"categories.name as category_name",
				db.raw("COALESCE(AVG(reviews.rating), 0) as avg_rating"),
				db.raw("COUNT(DISTINCT reviews.id) as review_count"),
				db.raw(
					"COALESCE(AVG(reviews.delivery_rating), 0) as avg_delivery_rating"
				),
				db.raw(
					"COALESCE(AVG(reviews.quality_rating), 0) as avg_quality_rating"
				),
				db.raw(
					"COALESCE(AVG(reviews.price_rating), 0) as avg_price_rating"
				)
			)
			.first();

		if (!product) {
			return res.status(404).json({ error: "Товар не найден" });
		}

		const reviews = await db("reviews")
			.join("users", "reviews.user_id", "users.id")
			.where({
				product_id: req.params.id,
				is_approved: true,
			})
			.select(
				"reviews.id",
				"reviews.rating",
				"reviews.delivery_rating",
				"reviews.quality_rating",
				"reviews.price_rating",
				"reviews.comment",
				"reviews.images",
				"users.full_name",
				"reviews.created_at"
			)
			.orderBy("reviews.created_at", "desc")
			.limit(3);

		const reviewsWithImages = reviews.map((r) => ({
			...r,
			images: r.images ? JSON.parse(r.images) : [],
		}));

		res.json({
			...product,
			reviews: reviewsWithImages,
		});
	} catch (err) {
		console.error("Ошибка получения товара:", err);
		res.status(500).json({ error: err.message });
	}
});

router.post(
	"/",
	verifyToken,
	requireRole("manager", "admin"),
	upload.single("image"),
	async (req, res) => {
		try {
			const { category_id, name, description, price, stock } = req.body;

			if (!name || !price) {
				return res
					.status(400)
					.json({ error: "Название и цена обязательны" });
			}

			const image_url = req.file ? `/uploads/${req.file.filename}` : null;

			const [product] = await db("products")
				.insert({
					category_id:
						category_id &&
						category_id !== "null" &&
						category_id !== ""
							? parseInt(category_id)
							: null,
					name,
					description: description || null,
					price: parseFloat(price),
					stock: parseInt(stock) || 0,
					image_url,
					is_active: true,
					created_at: db.fn.now(),
				})
				.returning("*");

			res.status(201).json(product);
		} catch (err) {
			console.error("Ошибка создания товара:", err);
			res.status(500).json({ error: err.message });
		}
	}
);

router.patch(
	"/:id",
	verifyToken,
	requireRole("manager", "admin"),
	upload.single("image"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const { category_id, name, description, price, stock } = req.body;

			const existing = await db("products").where({ id }).first();
			if (!existing) {
				return res.status(404).json({ error: "Товар не найден" });
			}

			const updateData = {};
			if (name) updateData.name = name;
			if (description !== undefined)
				updateData.description = description || null;
			if (price) updateData.price = parseFloat(price);
			if (stock !== undefined) updateData.stock = parseInt(stock) || 0;
			if (category_id !== undefined) {
				updateData.category_id =
					category_id && category_id !== "null" && category_id !== ""
						? parseInt(category_id)
						: null;
			}
			if (req.file) {
				updateData.image_url = `/uploads/${req.file.filename}`;
			}

			const [updated] = await db("products")
				.where({ id })
				.update(updateData)
				.returning("*");

			res.json(updated);
		} catch (err) {
			console.error("Ошибка обновления товара:", err);
			res.status(500).json({ error: err.message });
		}
	}
);

router.delete("/:id", verifyToken, requireRole("admin"), async (req, res) => {
	try {
		const { id } = req.params;
		const existing = await db("products").where({ id }).first();

		if (!existing) {
			return res.status(404).json({ error: "Товар не найден" });
		}

		const inOrders = await db("order_items")
			.where({ product_id: id })
			.first();
		const inCart = await db("cart_items").where({ product_id: id }).first();

		if (inOrders || inCart) {
			await db("products").where({ id }).update({ is_active: false });
			return res.json({ message: "Товар деактивирован" });
		}

		await db("products").where({ id }).del();
		res.json({ message: "Товар удален" });
	} catch (err) {
		console.error("Ошибка удаления товара:", err);
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;