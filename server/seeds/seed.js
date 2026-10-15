const bcrypt = require("bcrypt");

exports.seed = async function (knex) {
	// Очистка всех таблиц в порядке зависимостей
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

	// Статусы заказов
	await knex("order_statuses").insert([
		{ id: 1, name: "new", description: "Новый заказ" },
		{ id: 2, name: "processing", description: "В обработке" },
		{ id: 3, name: "assembled", description: "Собран" },
		{ id: 4, name: "delivered", description: "Доставлен" },
		{ id: 5, name: "cancelled", description: "Отменён" },
	]);

	// Роли
	await knex("roles").insert([
		{ id: 1, name: "user" },
		{ id: 2, name: "manager" },
		{ id: 3, name: "admin" },
	]);

	// Категории
	await knex("categories").insert([
		{ id: 1, name: "Розы", description: "Классические розы различных цветов и сортов" },
		{ id: 2, name: "Тюльпаны", description: "Весенние тюльпаны всех оттенков" },
		{ id: 3, name: "Пионы", description: "Пышные и ароматные пионы" },
		{ id: 4, name: "Хризантемы", description: "Осенние хризантемы для долгого стояния" },
		{ id: 5, name: "Лилии", description: "Изящные лилии с ярким ароматом" },
		{ id: 6, name: "Орхидеи", description: "Экзотические орхидеи в горшках" },
		{ id: 7, name: "Гортензии", description: "Пышные шапки гортензий" },
		{ id: 8, name: "Герберы", description: "Яркие и жизнерадостные герберы" },
		{ id: 9, name: "Ирисы", description: "Элегантные ирисы для стильных букетов" },
		{ id: 10, name: "Подсолнухи", description: "Солнечные подсолнухи для ярких композиций" },
	]);

	// Товары (из вашего дампа, с сохранением ID и полей)
	await knex("products").insert([
		{
			id: 1,
			category_id: 1,
			name: "Красные розы 50 см",
			description:
				"Классические красные розы на длинных стеблях. Бутон плотный, лепестки бархатистые. Идеально подходят для романтических подарков.",
			price: 3500.0,
			stock: 0,
			image_url: "/uploads/1790873917608-Красные розы 50см.jpg",
			is_active: true,
			created_at: "2026-09-17 18:45:16.365757+03",
		},
		{
			id: 2,
			category_id: 1,
			name: "Белые розы 60 см",
			description:
				"Нежные белые розы с легким кремовым оттенком. Символ чистоты и невинности.",
			price: 4200.0,
			stock: 0,
			image_url: "/uploads/1790873926570-Белые розы 60см.jpg",
			is_active: true,
			created_at: "2026-09-17 18:45:16.365757+03",
		},
		{
			id: 3,
			category_id: 1,
			name: "Розовые розы 40 см",
			description:
				"Нежно-розовые розы среднего размера. Прекрасный подарок для девушек и женщин.",
			price: 2900.0,
			stock: 40,
			image_url: "/uploads/1790873941002-Розовые розы 40см.jpg",
			is_active: true,
			created_at: "2026-09-17 18:45:16.365757+03",
		},
		{
			id: 4,
			category_id: 2,
			name: "Тюльпаны красные",
			description:
				"Яркие красные тюльпаны. Символ весны и любви. В упаковке 25 штук.",
			price: 1800.0,
			stock: 99,
			image_url: "/uploads/1790873959646-Тюльпаны красные.jpg",
			is_active: true,
			created_at: "2026-09-17 18:45:16.365757+03",
		},
		{
			id: 5,
			category_id: 2,
			name: "Тюльпаны желтые",
			description:
				"Солнечные желтые тюльпаны. Поднимают настроение и дарят тепло. 25 штук в букете.",
			price: 1800.0,
			stock: 80,
			image_url: "/uploads/1790873970348-Тюльпаны желтые.jpg",
			is_active: true,
			created_at: "2026-09-17 18:45:16.365757+03",
		},
		{
			id: 6,
			category_id: 3,
			name: "Пионы розовые",
			description:
				"Пышные розовые пионы с большими бутонами. Ароматные и невероятно красивые.",
			price: 5000.0,
			stock: 20,
			image_url: "/uploads/1790873980113-Пионы розовые.jpg",
			is_active: true,
			created_at: "2026-09-17 18:45:16.365757+03",
		},
		{
			id: 7,
			category_id: 3,
			name: "Пионы белые",
			description:
				"Белоснежные пионы с кремовым центром. Элегантные и изысканные.",
			price: 5500.0,
			stock: 14,
			image_url: "/uploads/1790873989173-Пионы белые.jpg",
			is_active: true,
			created_at: "2026-09-17 18:45:16.365757+03",
		},
		{
			id: 8,
			category_id: 4,
			name: "Хризантемы кустовые",
			description:
				"Кустовые хризантемы разных цветов. Стоят в вазе до 3 недель.",
			price: 1500.0,
			stock: 60,
			image_url: "/uploads/1790874004160-Хризантемы кустовые.jpg",
			is_active: true,
			created_at: "2026-09-17 18:45:16.365757+03",
		},
		{
			id: 9,
			category_id: 5,
			name: "Лилии белые",
			description:
				"Белые лилии с сильным ароматом. Крупные цветы на высоких стеблях.",
			price: 3800.0,
			stock: 30,
			image_url: "/uploads/1790874019488-Лилии белые.jpg",
			is_active: true,
			created_at: "2026-09-17 18:45:16.365757+03",
		},
		{
			id: 10,
			category_id: 6,
			name: "Орхидея фаленопсис",
			description:
				"Орхидея в горшке. Цветет до 3 месяцев. Проста в уходе.",
			price: 2500.0,
			stock: 25,
			image_url: "/uploads/1790874030591-Орхидея фаленопсис.jpg",
			is_active: true,
			created_at: "2026-09-17 18:45:16.365757+03",
		},
	]);

	// Хеш пароля "123456"
	const hash = await bcrypt.hash("123456", 10);

	// Пользователи (хеши сохранены из дампа — все три от одного пароля)
	await knex("users").insert([
		{
			id: 1,
			email: "pasha.hern@gmail.com",
			password_hash:
				"$2b$10$EUF/62IaNKh.v6K3Zd9nR.x8XHhWWJIx24Mfw5JAR8caG/J6Ll13G",
			full_name: "Администратор",
			phone: "+79990000000",
			is_verified: true,
			verification_token: null,
			reset_password_token: null,
			reset_password_expires: null,
			created_at: "2026-09-17 18:45:16.446309+03",
		},
		{
			id: 2,
			email: "absolyutnotochno@yandex.ru",
			password_hash: hash,
			full_name: "Менеджер",
			phone: "+79991111111",
			is_verified: true,
			verification_token: null,
			reset_password_token: null,
			reset_password_expires: null,
			created_at: "2026-09-17 18:45:16.446309+03",
		},
		{
			id: 3,
			email: "user@test.ru",
			password_hash: hash,
			full_name: "Тестович",
			phone: "+79992222222",
			is_verified: true,
			verification_token: null,
			reset_password_token: null,
			reset_password_expires: null,
			created_at: "2026-09-17 18:45:16.446309+03",
		},
	]);

	// Роли пользователей
	await knex("user_roles").insert([
		{ id: 1, user_id: 1, role_id: 3 }, // Админ
		{ id: 2, user_id: 2, role_id: 2 }, // Менеджер
		{ id: 3, user_id: 3, role_id: 1 }, // Пользователь
	]);

	// Акции (из дампа: WELCOME10 и FREESHIP)
	const today = new Date();
	const futureDate = new Date();
	futureDate.setDate(today.getDate() + 365);

	await knex("promotions").insert([
		{
			id: 1,
			name: "Скидка на первую покупку",
			description: "Скидка 10% для новых клиентов",
			code: "WELCOME10",
			type: "percentage",
			value: 10.0,
			min_order_amount: 1000,
			max_uses: 100,
			used_count: 1,
			start_date: today,
			end_date: futureDate,
			is_active: true,
			created_at: "2026-09-17 18:45:16.453204+03",
		},
		{
			id: 2,
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
			created_at: "2026-09-17 18:45:16.453204+03",
		},
	]);

	// Обнуляем последовательности — чтобы новые записи получали правильные id
	await knex.raw(
		"SELECT setval('public.categories_id_seq', (SELECT MAX(id) FROM public.categories))"
	);
	await knex.raw(
		"SELECT setval('public.products_id_seq', (SELECT MAX(id) FROM public.products))"
	);
	await knex.raw(
		"SELECT setval('public.users_id_seq', (SELECT MAX(id) FROM public.users))"
	);
	await knex.raw(
		"SELECT setval('public.user_roles_id_seq', (SELECT MAX(id) FROM public.user_roles))"
	);
	await knex.raw(
		"SELECT setval('public.promotions_id_seq', (SELECT MAX(id) FROM public.promotions))"
	);
	await knex.raw(
		"SELECT setval('public.order_statuses_id_seq', (SELECT MAX(id) FROM public.order_statuses))"
	);
	await knex.raw(
		"SELECT setval('public.roles_id_seq', (SELECT MAX(id) FROM public.roles))"
	);
};
