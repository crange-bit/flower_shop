import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { api } from "../api/axios";
import { ConfirmDialog, Notify } from "./Modals";
import { STATUS_LABELS, PURPOSE_LABELS } from "../utils/labels";

export default function Admin() {
	const { user } = useSelector((s) => s.auth);
	const navigate = useNavigate();

	const [tab, setTab] = useState("products");
	const [data, setData] = useState([]);
	const [categories, setCategories] = useState([]);
	const [statuses, setStatuses] = useState([]);
	const [roles, setRoles] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [form, setForm] = useState({});
	const [file, setFile] = useState(null);
	const [deleteId, setDeleteId] = useState(null);
	const [deleteType, setDeleteType] = useState("");
	const [notify, setNotify] = useState(null);

	const isAdmin = user?.role === "admin";

	useEffect(() => {
		if (user && user.role !== "admin" && user.role !== "manager") {
			navigate("/");
		}
	}, [user, navigate]);

	const fetchData = useCallback(async () => {
		if (!user || (user.role !== "admin" && user.role !== "manager")) return;
		setLoading(true);
		setError("");
		try {
			if (tab === "products") {
				const [prodRes, catRes] = await Promise.all([
					api.get("/products", { params: { limit: 100 } }),
					api.get("/categories"),
				]);
				setData(prodRes.data.data || []);
				setCategories(catRes.data);
			} else if (tab === "categories") {
				const res = await api.get("/categories");
				setData(res.data);
			} else if (tab === "orders") {
				const [ordRes, statRes] = await Promise.all([
					api.get("/orders/all"),
					api.get("/orders/statuses"),
				]);
				setData(ordRes.data);
				setStatuses(statRes.data);
			} else if (tab === "users") {
				const res = await api.get("/users");
				setData(res.data);
				if (isAdmin) {
					const rolesRes = await api.get("/roles");
					setRoles(rolesRes.data);
				}
			} else if (tab === "reviews") {
				const res = await api.get("/reviews/pending");
				setData(res.data);
			} else if (tab === "promotions") {
				const res = await api.get("/promotions/all");
				setData(res.data || []);
			}
		} catch (err) {
			console.error("Ошибка загрузки:", err);
			const msg = err.response?.data?.error || "Ошибка загрузки данных";
			setError(msg);
			setNotify({ message: msg, type: "error" });
		} finally {
			setLoading(false);
		}
	}, [tab, user, isAdmin]);

	useEffect(() => {
		const t = setTimeout(() => fetchData(), 0);
		return () => clearTimeout(t);
	}, [fetchData]);

	useEffect(() => {
		if (tab !== "orders") return;
		const interval = setInterval(fetchData, 30000);
		return () => clearInterval(interval);
	}, [tab, fetchData]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleFile = (e) => setFile(e.target.files[0]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const isEdit = !!form.id;

			if (tab === "products") {
				if (isEdit && !file) {
					const payload = {
						name: form.name,
						price: parseFloat(form.price),
						stock: parseInt(form.stock) || 0,
						description: form.description || "",
						category_id:
							form.category_id && form.category_id !== ""
								? form.category_id
								: null,
					};
					await api.patch("/products/" + form.id, payload, {
						headers: { "Content-Type": "application/json" },
					});
					setNotify({ message: "Товар обновлён", type: "success" });
				} else {
					const formData = new FormData();
					formData.append("name", form.name);
					formData.append("price", form.price);
					formData.append("stock", form.stock || 0);
					formData.append("description", form.description || "");
					if (form.category_id && form.category_id !== "") {
						formData.append("category_id", form.category_id);
					}
					if (file) formData.append("image", file);

					if (isEdit) {
						await api.patch("/products/" + form.id, formData, {
							headers: { "Content-Type": "multipart/form-data" },
						});
						setNotify({
							message: "Товар обновлён",
							type: "success",
						});
					} else {
						await api.post("/products", formData, {
							headers: { "Content-Type": "multipart/form-data" },
						});
						setNotify({
							message: "Товар добавлен",
							type: "success",
						});
					}
				}
			} else if (tab === "categories") {
				const payload = {
					name: form.name,
					description: form.description || "",
				};
				if (isEdit) {
					await api.patch("/categories/" + form.id, payload);
					setNotify({
						message: "Категория обновлена",
						type: "success",
					});
				} else {
					await api.post("/categories", payload);
					setNotify({
						message: "Категория добавлена",
						type: "success",
					});
				}
			} else if (tab === "promotions") {
				const payload = {
					name: form.name,
					code: form.code,
					type: form.type,
					value: parseFloat(form.value),
					min_order_amount: parseFloat(form.min_order_amount) || 0,
					start_date: form.start_date,
					end_date: form.end_date,
					is_active: true,
				};
				if (isEdit) {
					await api.put("/promotions/" + form.id, payload);
					setNotify({ message: "Акция обновлена", type: "success" });
				} else {
					await api.post("/promotions", payload);
					setNotify({ message: "Акция добавлена", type: "success" });
				}
			}

			setForm({});
			setFile(null);
			await fetchData();
		} catch (err) {
			console.error("Ошибка сохранения:", err);
			const msg = err.response?.data?.error || "Ошибка сохранения";
			setError(msg);
			setNotify({ message: msg, type: "error" });
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteId) return;
		try {
			let endpoint = "";
			if (deleteType === "order") endpoint = "/orders/";
			else if (deleteType === "category") endpoint = "/categories/";
			else if (deleteType === "product") endpoint = "/products/";
			else if (deleteType === "review") endpoint = "/reviews/";
			else if (deleteType === "promotion") endpoint = "/promotions/";

			await api.delete(endpoint + deleteId);
			setNotify({ message: "Удалено", type: "success" });
			await fetchData();
		} catch (err) {
			setNotify({
				message: err.response?.data?.error || "Ошибка удаления",
				type: "error",
			});
		} finally {
			setDeleteId(null);
			setDeleteType("");
		}
	};

	const updateStatus = async (orderId, statusId) => {
		try {
			await api.patch("/orders/" + orderId + "/status", {
				status_id: statusId,
			});
			setNotify({ message: "Статус заказа обновлён", type: "success" });
			await fetchData();
		} catch (err) {
			setNotify({
				message:
					err.response?.data?.error || "Ошибка обновления статуса",
				type: "error",
			});
		}
	};

	const updateRole = async (userId, roleId) => {
		try {
			await api.patch("/admin/users/" + userId + "/role", {
				role_id: roleId,
			});
			setNotify({
				message: "Роль пользователя обновлена",
				type: "success",
			});
			await fetchData();
		} catch (err) {
			setNotify({
				message: err.response?.data?.error || "Ошибка обновления роли",
				type: "error",
			});
		}
	};

	const approveReview = async (id) => {
		try {
			await api.patch("/reviews/" + id + "/approve");
			setNotify({ message: "Отзыв одобрен", type: "success" });
			await fetchData();
		} catch (err) {
			setNotify({
				message: err.response?.data?.error || "Ошибка одобрения",
				type: "error",
			});
		}
	};

	const deleteReview = async (id) => {
		if (!window.confirm("Удалить этот отзыв?")) return;
		try {
			await api.delete(`/reviews/${id}`);
			setNotify({ message: "Отзыв удалён", type: "success" });
			await fetchData();
		} catch (err) {
			setNotify({
				message: err.response?.data?.error || "Ошибка удаления",
				type: "error",
			});
		}
	};

	if (!user || (user.role !== "admin" && user.role !== "manager")) {
		return null;
	}

	return (
		<div className="admin-container">
			{notify && (
				<Notify
					message={notify.message}
					type={notify.type}
					onClose={() => setNotify(null)}
				/>
			)}

			<ConfirmDialog
				isOpen={!!deleteId}
				onClose={() => {
					setDeleteId(null);
					setDeleteType("");
				}}
				onConfirm={handleDelete}
				title={
					deleteType === "order"
						? "Удаление заказа"
						: deleteType === "category"
						? "Удаление категории"
						: deleteType === "product"
						? "Удаление товара"
						: deleteType === "review"
						? "Удаление отзыва"
						: deleteType === "promotion"
						? "Удаление акции"
						: "Подтверждение"
				}
				message={
					deleteType === "order"
						? "Удалить заказ #" + deleteId + "?"
						: deleteType === "category"
						? "Удалить категорию? Товары останутся без категории."
						: deleteType === "product"
						? "Удалить товар?"
						: deleteType === "review"
						? "Удалить отзыв?"
						: deleteType === "promotion"
						? "Удалить акцию?"
						: "Вы уверены?"
				}
			/>

			<h2>
				Панель управления {isAdmin ? "(Администратор)" : "(Менеджер)"}
			</h2>
			{error && <div className="alert alert-error">{error}</div>}

			<div className="admin-tabs">
				<button
					onClick={() => setTab("products")}
					className={`admin-tab ${
						tab === "products" ? "active" : ""
					}`}
				>
					Товары
				</button>
				<button
					onClick={() => setTab("categories")}
					className={`admin-tab ${
						tab === "categories" ? "active" : ""
					}`}
				>
					Категории
				</button>
				<button
					onClick={() => setTab("orders")}
					className={`admin-tab ${tab === "orders" ? "active" : ""}`}
				>
					Заказы
				</button>
				<button
					onClick={() => setTab("users")}
					className={`admin-tab ${tab === "users" ? "active" : ""}`}
				>
					Пользователи
				</button>
				<button
					onClick={() => setTab("reviews")}
					className={`admin-tab ${tab === "reviews" ? "active" : ""}`}
				>
					Отзывы
				</button>
				<button
					onClick={() => setTab("promotions")}
					className={`admin-tab ${
						tab === "promotions" ? "active" : ""
					}`}
				>
					Акции
				</button>
			</div>

			{loading ? (
				<div className="loading">Загрузка данных…</div>
			) : (
				<>
					{(tab === "products" ||
						tab === "categories" ||
						tab === "promotions") && (
						<div className="admin-form">
							<h3>
								{form.id ? "Редактирование" : "Добавление"}{" "}
								{tab === "products"
									? "товара"
									: tab === "categories"
									? "категории"
									: "акции"}
							</h3>
							<form onSubmit={handleSubmit}>
								<div className="form-group">
									<label>Название</label>
									<input
										name="name"
										value={form.name || ""}
										onChange={handleChange}
										required
									/>
								</div>

								{tab === "products" && (
									<>
										<div className="form-group">
											<label>Цена</label>
											<input
												name="price"
												type="number"
												step="0.01"
												value={form.price || ""}
												onChange={handleChange}
												required
											/>
										</div>
										<div className="form-group">
											<label>Остаток</label>
											<input
												name="stock"
												type="number"
												value={form.stock || ""}
												onChange={handleChange}
											/>
										</div>
										<div className="form-group">
											<label>Категория</label>
											<select
												name="category_id"
												value={form.category_id || ""}
												onChange={handleChange}
											>
												<option value="">
													Выберите категорию
												</option>
												{categories.map((c) => (
													<option
														key={c.id}
														value={c.id}
													>
														{c.name}
													</option>
												))}
											</select>
										</div>
										<div className="form-group">
											<label>Описание</label>
											<textarea
												name="description"
												value={form.description || ""}
												onChange={handleChange}
												rows="3"
											/>
										</div>
										<div className="form-group">
											<label>Фото</label>
											<input
												type="file"
												onChange={handleFile}
												accept="image/*"
											/>
										</div>
									</>
								)}

								{tab === "categories" && (
									<div className="form-group">
										<label>Описание</label>
										<textarea
											name="description"
											value={form.description || ""}
											onChange={handleChange}
											rows="3"
										/>
									</div>
								)}

								{tab === "promotions" && (
									<>
										<div className="form-group">
											<label>Промокод</label>
											<input
												name="code"
												value={form.code || ""}
												onChange={handleChange}
												required
											/>
										</div>
										<div className="form-group">
											<label>Тип</label>
											<select
												name="type"
												value={
													form.type || "percentage"
												}
												onChange={handleChange}
											>
												<option value="percentage">
													Процент (%)
												</option>
												<option value="fixed">
													Фикс (₽)
												</option>
											</select>
										</div>
										<div className="form-group">
											<label>Значение</label>
											<input
												name="value"
												type="number"
												step="0.01"
												value={form.value || ""}
												onChange={handleChange}
												required
											/>
										</div>
										<div className="form-group">
											<label>Мин. сумма</label>
											<input
												name="min_order_amount"
												type="number"
												step="0.01"
												value={
													form.min_order_amount || ""
												}
												onChange={handleChange}
											/>
										</div>
										<div className="form-group">
											<label>Дата начала</label>
											<input
												name="start_date"
												type="date"
												value={form.start_date || ""}
												onChange={handleChange}
												required
											/>
										</div>
										<div className="form-group">
											<label>Дата окончания</label>
											<input
												name="end_date"
												type="date"
												value={form.end_date || ""}
												onChange={handleChange}
												required
											/>
										</div>
									</>
								)}

								<div className="admin-form-actions">
									<button
										type="submit"
										className="btn btn-primary"
										disabled={loading}
									>
										{form.id ? "Сохранить" : "Добавить"}
									</button>
									{form.id && (
										<button
											type="button"
											onClick={() => {
												setForm({});
												setFile(null);
											}}
											className="btn btn-secondary"
										>
											Отмена
										</button>
									)}
								</div>
							</form>
						</div>
					)}

					<div className="table-wrapper">
						{data.length === 0 ? (
							<p style={{ padding: "2rem", textAlign: "center" }}>
								Нет записей
							</p>
						) : (
							<table>
								<thead>
									<tr>
										<th>ID</th>
										<th>Информация</th>
										<th>Детали</th>
										<th>Управление</th>
									</tr>
								</thead>
								<tbody>
									{data.map((item) => (
										<tr key={item.id}>
											<td>#{item.id}</td>
											<td>
												{tab === "users" && (
													<>
														<strong>
															{item.full_name}
														</strong>
														<br />
														{item.email}
													</>
												)}
												{tab === "reviews" && (
													<>
														<strong>
															Товар:{" "}
															{item.product_name}
														</strong>
														<br />
														Автор: {item.full_name}
													</>
												)}
												{tab === "products" &&
													item.name}
												{tab === "categories" &&
													item.name}
												{tab === "orders" && (
													<>
														<strong>
															#{item.id}
														</strong>
														<br />
														{item.full_name} —{" "}
														{item.email}
													</>
												)}
												{tab === "promotions" && (
													<>
														{item.name} | Код:{" "}
														{item.code}
													</>
												)}
											</td>
											<td>
												{tab === "users" && (
													<span className="badge badge-success">
														{item.role}
													</span>
												)}
												{tab === "reviews" && (
													<>
														Рейтинг: {item.rating}{" "}
														<span
															style={{
																color: "#ffc107",
															}}
														>
															{"★".repeat(
																Math.floor(
																	item.rating
																)
															)}
															{"☆".repeat(
																5 -
																	Math.floor(
																		item.rating
																	)
															)}
														</span>
														<br />
														<span
															style={{
																fontSize:
																	"0.85rem",
																color: "#666",
															}}
														>
															{item.comment?.substring(
																0,
																50
															)}
															…
														</span>
													</>
												)}
												{tab === "products" &&
													`Цена: ${item.price} | Ост: ${item.stock}`}
												{tab === "categories" &&
													item.description?.substring(
														0,
														50
													)}
												{tab === "orders" && (
													<>
														<div>
															Сумма:{" "}
															{item.total_amount}{" "}
															₽
														</div>
														<div>
															Позиций:{" "}
															{item.items
																?.length || 0}
														</div>
														<div>
															Назначение:{" "}
															{PURPOSE_LABELS[
																item.purpose
															] || item.purpose}
														</div>
														<div>
															Дата:{" "}
															{new Date(
																item.created_at
															).toLocaleString(
																"ru-RU"
															)}
														</div>
													</>
												)}
												{tab === "promotions" &&
													`До: ${
														item.end_date?.split(
															"T"
														)[0]
													}`}
											</td>
											<td>
												{tab === "users" && isAdmin && (
													<select
														value={
															item.role_id || ""
														}
														onChange={(e) =>
															updateRole(
																item.id,
																e.target.value
															)
														}
													>
														<option value="">
															Сменить роль
														</option>
														{roles.map((r) => (
															<option
																key={r.id}
																value={r.id}
															>
																{r.name}
															</option>
														))}
													</select>
												)}
												{tab === "users" &&
													!isAdmin && (
														<span
															style={{
																color: "#888",
																fontSize:
																	"0.8rem",
															}}
														>
															Только просмотр
														</span>
													)}

												{tab === "reviews" && (
													<div className="admin-actions">
														<button
															onClick={() =>
																approveReview(
																	item.id
																)
															}
															className="btn btn-primary admin-btn-sm"
														>
															Одобрить
														</button>
														<button
															onClick={() =>
																deleteReview(
																	item.id
																)
															}
															className="btn btn-danger admin-btn-sm"
														>
															Удалить
														</button>
													</div>
												)}

												{tab === "orders" && (
													<div className="admin-actions">
														<select
															value={
																item.status_id ||
																""
															}
															onChange={(e) =>
																updateStatus(
																	item.id,
																	e.target
																		.value
																)
															}
														>
															{statuses.map(
																(s) => (
																	<option
																		key={
																			s.id
																		}
																		value={
																			s.id
																		}
																	>
																		{STATUS_LABELS[
																			s
																				.name
																		] ||
																			s.name}
																	</option>
																)
															)}
														</select>
														{isAdmin && (
															<button
																onClick={() => {
																	setDeleteId(
																		item.id
																	);
																	setDeleteType(
																		"order"
																	);
																}}
																className="btn btn-danger admin-btn-sm"
															>
																Удл.
															</button>
														)}
													</div>
												)}

												{(tab === "products" ||
													tab === "categories" ||
													tab === "promotions") && (
													<div className="admin-actions">
														<button
															onClick={() => {
																setForm({
																	...item,
																	category_id:
																		item.category_id ||
																		"",
																	start_date:
																		item.start_date?.split(
																			"T"
																		)[0] ||
																		"",
																	end_date:
																		item.end_date?.split(
																			"T"
																		)[0] ||
																		"",
																});
															}}
															className="btn btn-secondary admin-btn-sm"
														>
															Ред.
														</button>
														{isAdmin && (
															<button
																onClick={() => {
																	if (
																		tab ===
																		"products"
																	) {
																		setDeleteId(
																			item.id
																		);
																		setDeleteType(
																			"product"
																		);
																	} else if (
																		tab ===
																		"categories"
																	) {
																		setDeleteId(
																			item.id
																		);
																		setDeleteType(
																			"category"
																		);
																	} else if (
																		tab ===
																		"promotions"
																	) {
																		setDeleteId(
																			item.id
																		);
																		setDeleteType(
																			"promotion"
																		);
																	}
																}}
																className="btn btn-danger admin-btn-sm"
															>
																Удл.
															</button>
														)}
													</div>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</>
			)}
		</div>
	);
}