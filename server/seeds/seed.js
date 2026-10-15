const bcrypt = require("bcrypt");

exports.seed = async function (knex) {
	// Очистка всех таблиц
	await knex("user_promotions").del();
	await knex("order_items").del();
	await knex("orders").del();
	await knex("cart_items").del();
	await knex("reviews").del();
	await knex("promotions").del();
	await knex("products").del();
	await knex("categories").del();
	await knex("user_roles").del();
	await knex("users").del();
	await knex("roles").del();
	await knex("order_statuses").del();

	// Добавление статусов заказов
	await knex("order_statuses").insert([
		{ id: 1, name: "new", description: "Новый заказ" },
		{ id: 2, name: "processing", description: "В обработке" },
		{ id: 3, name: "assembled", description: "Собран" },
		{ id: 4, name: "delivered", description: "Доставлен" },
		{ id: 5, name: "cancelled", description: "Отменен" },
	]);

	// Добавление ролей
	await knex("roles").insert([
		{ id: 1, name: "user" },
		{ id: 2, name: "manager" },
		{ id: 3, name: "admin" },
	]);

	// Добавление категорий
	await knex("categories").insert([
		{
			id: 1,
			name: "Розы",
			description: "Классические розы различных цветов и сортов",
		},
		{
			id: 2,
			name: "Тюльпаны",
			description: "Весенние тюльпаны всех оттенков",
		},
		{ id: 3, name: "Пионы", description: "Пышные и ароматные пионы" },
		{
			id: 4,
			name: "Хризантемы",
			description: "Осенние хризантемы для долгого стояния",
		},
		{ id: 5, name: "Лилии", description: "Изящные лилии с ярким ароматом" },
		{
			id: 6,
			name: "Орхидеи",
			description: "Экзотические орхидеи в горшках",
		},
		{ id: 7, name: "Гортензии", description: "Пышные шапки гортензий" },
		{
			id: 8,
			name: "Герберы",
			description: "Яркие и жизнерадостные герберы",
		},
		{
			id: 9,
			name: "Ирисы",
			description: "Элегантные ирисы для стильных букетов",
		},
		{
			id: 10,
			name: "Подсолнухи",
			description: "Солнечные подсолнухи для ярких композиций",
		},
	]);

	// Добавление товаров
	await knex("products").insert([
		{
			id: 1,
			category_id: 1,
			name: "Красные розы 50 см",
			description:
				"Классические красные розы на длинных стеблях. Бутон плотный, лепестки бархатистые. Идеально подходят для романтических подарков.",
			price: 3500.0,
			stock: 50,
			image_url: "/uploads/1779146350824-1674146378_63401090.jpg",
			is_active: true,
		},
		{
			id: 2,
			category_id: 1,
			name: "Белые розы 60 см",
			description:
				"Нежные белые розы с легким кремовым оттенком. Символ чистоты и невинности.",
			price: 4200.0,
			stock: 35,
			image_url: "/uploads/1779146350824-1674146378_63401090.jpg",
			is_active: true,
		},
		{
			id: 3,
			category_id: 1,
			name: "Розовые розы 40 см",
			description:
				"Нежно-розовые розы среднего размера. Прекрасный подарок для девушек и женщин.",
			price: 2900.0,
			stock: 45,
			image_url: "/uploads/1779146350824-1674146378_63401090.jpg",
			is_active: true,
		},
		{
			id: 4,
			category_id: 2,
			name: "Тюльпаны красные",
			description:
				"Яркие красные тюльпаны. Символ весны и любви. В упаковке 25 штук.",
			price: 1800.0,
			stock: 100,
			image_url: "/uploads/1779146350824-1674146378_63401090.jpg",
			is_active: true,
		},
		{
			id: 5,
			category_id: 2,
			name: "Тюльпаны желтые",
			description:
				"Солнечные желтые тюльпаны. Поднимают настроение и дарят тепло. 25 штук в букете.",
			price: 1800.0,
			stock: 80,
			image_url: "/uploads/1779146350824-1674146378_63401090.jpg",
			is_active: true,
		},
		{
			id: 6,
			category_id: 3,
			name: "Пионы розовые",
			description:
				"Пышные розовые пионы с большими бутонами. Ароматные и невероятно красивые.",
			price: 5000.0,
			stock: 20,
			image_url: "/uploads/1779146350824-1674146378_63401090.jpg",
			is_active: true,
		},
		{
			id: 7,
			category_id: 3,
			name: "Пионы белые",
			description:
				"Белоснежные пионы с кремовым центром. Элегантные и изысканные.",
			price: 5500.0,
			stock: 15,
			image_url: "/uploads/1779146350824-1674146378_63401090.jpg",
			is_active: true,
		},
		{
			id: 8,
			category_id: 4,
			name: "Хризантемы кустовые",
			description:
				"Кустовые хризантемы разных цветов. Стоят в вазе до 3 недель.",
			price: 1500.0,
			stock: 60,
			image_url: "/uploads/1779146350824-1674146378_63401090.jpg",
			is_active: true,
		},
		{
			id: 9,
			category_id: 5,
			name: "Лилии белые",
			description:
				"Белые лилии с сильным ароматом. Крупные цветы на высоких стеблях.",
			price: 3800.0,
			stock: 30,
			image_url: "/uploads/1779146350824-1674146378_63401090.jpg",
			is_active: true,
		},
		{
			id: 10,
			category_id: 6,
			name: "Орхидея фаленопсис",
			description:
				"Орхидея в горшке. Цветет до 3 месяцев. Проста в уходе.",
			price: 2500.0,
			stock: 25,
			image_url: "/uploads/1779146350824-1674146378_63401090.jpg",
			is_active: true,
		},
	]);

	// Хеширование пароля
	const hash = await bcrypt.hash("123456", 10);

	// Добавление пользователей
	await knex("users").insert([
		{
			id: 1,
			email: "pasha.hern@gmail.com",
			password_hash: hash,
			full_name: "Администратор",
			phone: "+79990000000",
			is_verified: true,
			verification_token: null,
		},
		{
			id: 2,
			email: "absolyutnotochno@yandex.ru",
			password_hash: hash,
			full_name: "Менеджер",
			phone: "+79991111111",
			is_verified: true,
			verification_token: null,
		},
		{
			id: 3,
			email: "user@test.ru",
			password_hash: hash,
			full_name: "Тестович",
			phone: "+79992222222",
			is_verified: true,
			verification_token: null,
		},
	]);

	// Добавление связей пользователей с ролями
	await knex("user_roles").insert([
		{ user_id: 1, role_id: 3 }, // Админ
		{ user_id: 2, role_id: 2 }, // Менеджер
		{ user_id: 3, role_id: 1 }, // Пользователь
	]);

	// Добавление отзывов
	await knex("reviews").insert([
		{
			user_id: 3,
			product_id: 1,
			rating: 5,
			delivery_rating: 5,
			quality_rating: 5,
			price_rating: 4,
			comment:
				"Отличные розы! Очень свежие, доставили вовремя. Буду заказывать еще.",
			images: null,
			is_approved: true,
		},
		{
			user_id: 3,
			product_id: 4,
			rating: 4,
			delivery_rating: 5,
			quality_rating: 4,
			price_rating: 4,
			comment:
				"Хорошие тюльпаны, но некоторые уже начали раскрываться. В целом довольна.",
			images: null,
			is_approved: true,
		},
		{
			user_id: 3,
			product_id: 6,
			rating: 5,
			delivery_rating: 5,
			quality_rating: 5,
			price_rating: 5,
			comment:
				"Восхитительные пионы! Стояли почти две недели. Огромное спасибо!",
			images: null,
			is_approved: true,
		},
	]);

	// Добавление акций
	const today = new Date();
	const futureDate = new Date();
	futureDate.setDate(today.getDate() + 365);

	await knex("promotions").insert([
		{
			name: "Скидка на первую покупку",
			description: "Скидка 10% для новых клиентов",
			code: "WELCOME10",
			type: "percentage",
			value: 10.0,
			min_order_amount: 1000,
			max_uses: 100,
			used_count: 0,
			start_date: today,
			end_date: futureDate,
			is_active: true,
		},
		{
			name: "Бесплатная доставка",
			description: "Бесплатная доставка при заказе от 5000 рублей",
			code: "FREESHIP",
			type: "fixed",
			value: 500.0,
			min_order_amount: 5000,
			max_uses: 50,
			used_count: 0,
			start_date: today,
			end_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
			is_active: true,
		},
		{
			name: "Розы в подарок",
			description: "3 красные розы в подарок при заказе от 3000 рублей",
			code: "ROSESGIFT",
			type: "percentage",
			value: 15.0,
			min_order_amount: 3000,
			max_uses: null,
			used_count: 0,
			start_date: today,
			end_date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
			is_active: true,
		},
	]);
};