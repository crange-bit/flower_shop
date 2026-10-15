exports.up = async (knex) => {
	// Таблица статусов заказов
	await knex.schema.createTable("order_statuses", (t) => {
		t.increments("id").primary();
		t.string("name").unique().notNullable();
		t.string("description").nullable();
	});

	// Таблица пользователей
	await knex.schema.createTable("users", (t) => {
		t.increments("id").primary();
		t.string("email").unique().notNullable();
		t.string("password_hash").notNullable();
		t.string("full_name");
		t.string("phone");
		t.timestamp("created_at").defaultTo(knex.fn.now());
		t.boolean("is_verified").defaultTo(false);
		t.string("verification_token").unique();
		t.string("reset_password_token").unique();
		t.timestamp("reset_password_expires");
	});

	// Таблица ролей
	await knex.schema.createTable("roles", (t) => {
		t.increments("id").primary();
		t.string("name").unique().notNullable();
	});

	// Таблица связи пользователей и ролей
	await knex.schema.createTable("user_roles", (t) => {
		t.increments("id").primary();
		t.integer("user_id")
			.unsigned()
			.notNullable()
			.references("id")
			.inTable("users")
			.onDelete("CASCADE");
		t.integer("role_id")
			.unsigned()
			.notNullable()
			.references("id")
			.inTable("roles")
			.onDelete("CASCADE");
		t.unique(["user_id", "role_id"]);
	});

	// Таблица категорий
	await knex.schema.createTable("categories", (t) => {
		t.increments("id").primary();
		t.string("name").unique().notNullable();
		t.text("description");
	});

	// Таблица товаров
	await knex.schema.createTable("products", (t) => {
		t.increments("id").primary();
		t.integer("category_id")
			.unsigned()
			.references("id")
			.inTable("categories")
			.onDelete("SET NULL");
		t.string("name").notNullable();
		t.text("description");
		t.decimal("price", 10, 2).notNullable();
		t.integer("stock").defaultTo(0);
		t.string("image_url");
		t.boolean("is_active").defaultTo(true);
		t.timestamp("created_at").defaultTo(knex.fn.now());
	});

	// Таблица корзины
	await knex.schema.createTable("cart_items", (t) => {
		t.increments("id").primary();
		t.integer("user_id")
			.unsigned()
			.notNullable()
			.references("id")
			.inTable("users")
			.onDelete("CASCADE");
		t.integer("product_id")
			.unsigned()
			.notNullable()
			.references("id")
			.inTable("products")
			.onDelete("CASCADE");
		t.integer("quantity").defaultTo(1);
		t.unique(["user_id", "product_id"]);
	});

	// Таблица заказов
	await knex.schema.createTable("orders", (t) => {
		t.increments("id").primary();
		t.integer("user_id")
			.unsigned()
			.notNullable()
			.references("id")
			.inTable("users")
			.onDelete("CASCADE");
		t.integer("status_id")
			.unsigned()
			.notNullable()
			.references("id")
			.inTable("order_statuses")
			.onDelete("RESTRICT");
		t.decimal("total_amount", 10, 2);
		t.string("delivery_address");
		t.string("contact_phone");
		t.text("comment");
		t.timestamp("created_at").defaultTo(knex.fn.now());
		t.timestamp("updated_at").defaultTo(knex.fn.now());
		t.string("purpose").defaultTo("celebration");
	});

	// Таблица позиций заказа
	await knex.schema.createTable("order_items", (t) => {
		t.increments("id").primary();
		t.integer("order_id")
			.unsigned()
			.notNullable()
			.references("id")
			.inTable("orders")
			.onDelete("CASCADE");
		t.integer("product_id")
			.unsigned()
			.notNullable()
			.references("id")
			.inTable("products")
			.onDelete("SET NULL");
		t.integer("quantity").notNullable();
		t.decimal("unit_price", 10, 2).notNullable();
	});

	// Таблица отзывов
	await knex.schema.createTable("reviews", (t) => {
		t.increments("id").primary();
		t.integer("user_id")
			.unsigned()
			.notNullable()
			.references("id")
			.inTable("users")
			.onDelete("CASCADE");
		t.integer("product_id")
			.unsigned()
			.notNullable()
			.references("id")
			.inTable("products")
			.onDelete("CASCADE");
		t.integer("rating").notNullable();
		t.integer("delivery_rating");
		t.integer("quality_rating");
		t.integer("price_rating");
		t.text("comment");
		t.text("images");
		t.boolean("is_approved").defaultTo(false);
		t.timestamp("created_at").defaultTo(knex.fn.now());
	});

	// Таблица акций
	await knex.schema.createTable("promotions", (t) => {
		t.increments("id").primary();
		t.string("name").notNullable();
		t.text("description");
		t.string("code").unique();
		t.string("type").notNullable();
		t.decimal("value", 10, 2).notNullable();
		t.integer("category_id")
			.unsigned()
			.references("id")
			.inTable("categories")
			.onDelete("SET NULL");
		t.integer("product_id")
			.unsigned()
			.references("id")
			.inTable("products")
			.onDelete("SET NULL");
		t.date("start_date").notNullable();
		t.date("end_date").notNullable();
		t.decimal("min_order_amount", 10, 2).defaultTo(0);
		t.integer("max_uses");
		t.integer("used_count").defaultTo(0);
		t.boolean("is_active").defaultTo(true);
		t.timestamp("created_at").defaultTo(knex.fn.now());
	});

	// Таблица использования промокодов
	await knex.schema.createTable("user_promotions", (t) => {
		t.increments("id").primary();
		t.integer("user_id")
			.unsigned()
			.notNullable()
			.references("id")
			.inTable("users")
			.onDelete("CASCADE");
		t.integer("promotion_id")
			.unsigned()
			.notNullable()
			.references("id")
			.inTable("promotions")
			.onDelete("CASCADE");
		t.boolean("is_used").defaultTo(false);
		t.timestamp("used_at");
	});
};

exports.down = async (knex) => {
	await knex.schema.dropTableIfExists("user_promotions");
	await knex.schema.dropTableIfExists("promotions");
	await knex.schema.dropTableIfExists("order_items");
	await knex.schema.dropTableIfExists("orders");
	await knex.schema.dropTableIfExists("cart_items");
	await knex.schema.dropTableIfExists("reviews");
	await knex.schema.dropTableIfExists("products");
	await knex.schema.dropTableIfExists("categories");
	await knex.schema.dropTableIfExists("user_roles");
	await knex.schema.dropTableIfExists("users");
	await knex.schema.dropTableIfExists("roles");
	await knex.schema.dropTableIfExists("order_statuses");
};