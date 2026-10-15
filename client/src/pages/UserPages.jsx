import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/axios";
import { Notify, ImageModal } from "./Modals";
import { StarRating } from "./UI";
import { STATUS_LABELS, PURPOSE_LABELS } from "../utils/labels";

export function Profile() {
	const [orders, setOrders] = useState([]);
	const [selectedOrder, setSelectedOrder] = useState(null);
	const [showPasswordForm, setShowPasswordForm] = useState(false);
	const [passwordData, setPasswordData] = useState({
		current_password: "",
		new_password: "",
		confirm_password: "",
	});
	const [passwordStatus, setPasswordStatus] = useState("");
	const [passwordMessage, setPasswordMessage] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [notify, setNotify] = useState(null);
	const user = useSelector((s) => s.auth.user);
	const navigate = useNavigate();

	useEffect(() => {
		const loadOrders = async () => {
			try {
				const response = await api.get("/orders");
				setOrders(response.data);
			} catch {
				setNotify({
					message: "Ошибка загрузки заказов",
					type: "error",
				});
			}
		};
		loadOrders();
	}, []);

	const validatePassword = (password) => {
		if (password.length > 0 && password.length < 6) {
			setPasswordError("Пароль должен содержать минимум 6 символов");
			return false;
		}
		setPasswordError("");
		return true;
	};

	const handlePasswordChange = async (e) => {
		e.preventDefault();
		if (!validatePassword(passwordData.new_password)) return;
		if (passwordData.new_password !== passwordData.confirm_password) {
			setPasswordStatus("error");
			setPasswordMessage("Новые пароли не совпадают");
			setNotify({ message: "Новые пароли не совпадают", type: "error" });
			return;
		}
		if (passwordData.current_password === passwordData.new_password) {
			setPasswordStatus("error");
			setPasswordMessage("Новый пароль должен отличаться от текущего");
			setNotify({
				message: "Новый пароль должен отличаться от текущего",
				type: "error",
			});
			return;
		}
		try {
			await api.post("/auth/change-password", {
				current_password: passwordData.current_password,
				new_password: passwordData.new_password,
			});
			setPasswordStatus("success");
			setPasswordMessage("Пароль успешно изменён");
			setNotify({ message: "Пароль успешно изменён", type: "success" });
			setTimeout(() => {
				setShowPasswordForm(false);
				setPasswordData({
					current_password: "",
					new_password: "",
					confirm_password: "",
				});
				setPasswordStatus("");
				setPasswordMessage("");
			}, 3000);
		} catch (error) {
			const errorMsg =
				error.response?.data?.error || "Ошибка смены пароля";
			setPasswordStatus("error");
			setPasswordMessage(errorMsg);
			setNotify({ message: errorMsg, type: "error" });
		}
	};

	const getStatusText = (status) => STATUS_LABELS[status] || status;

	return (
		<div className="container profile-container">
			{notify && (
				<Notify
					message={notify.message}
					type={notify.type}
					onClose={() => setNotify(null)}
				/>
			)}

			<h1 className="page-title profile-heading">Личный кабинет</h1>

			<div className="card profile-card">
				<h2 className="section-title">Информация о пользователе</h2>
				<p>
					<strong>Email:</strong> {user?.email}
				</p>
				<p>
					<strong>ФИО:</strong> {user?.full_name}
				</p>
				<p>
					<strong>Роль:</strong>{" "}
					<span className="badge badge-success">{user?.role}</span>
				</p>

				<div className="profile-actions">
					{(user?.role === "admin" || user?.role === "manager") && (
						<button
							className="btn btn-primary admin-panel-btn"
							onClick={() => navigate("/admin")}
						>
							Панель управления
						</button>
					)}
					<button
						className="btn btn-secondary"
						onClick={() => setShowPasswordForm(!showPasswordForm)}
					>
						{showPasswordForm ? "Отмена" : "Сменить пароль"}
					</button>
				</div>

				{showPasswordForm && (
					<form
						onSubmit={handlePasswordChange}
						className="password-form"
					>
						<div className="form-group">
							<label>Текущий пароль</label>
							<input
								type="password"
								value={passwordData.current_password}
								onChange={(e) =>
									setPasswordData({
										...passwordData,
										current_password: e.target.value,
									})
								}
								required
							/>
						</div>
						<div className="form-group">
							<label>Новый пароль</label>
							<input
								type="password"
								className={passwordError ? "error" : ""}
								value={passwordData.new_password}
								onChange={(e) =>
									setPasswordData({
										...passwordData,
										new_password: e.target.value,
									})
								}
								required
							/>
							{passwordError && (
								<div className="error-text">
									{passwordError}
								</div>
							)}
						</div>
						<div className="form-group">
							<label>Подтвердите новый пароль</label>
							<input
								type="password"
								value={passwordData.confirm_password}
								onChange={(e) =>
									setPasswordData({
										...passwordData,
										confirm_password: e.target.value,
									})
								}
								required
							/>
						</div>
						<button type="submit" className="btn btn-primary">
							Сохранить новый пароль
						</button>
						{passwordStatus === "success" && (
							<div className="alert alert-success">
								{passwordMessage}
							</div>
						)}
						{passwordStatus === "error" && (
							<div className="alert alert-error">
								{passwordMessage}
							</div>
						)}
					</form>
				)}
			</div>

			<div className="card">
				<h2 className="section-title">История заказов</h2>
				{orders.length === 0 ? (
					<div className="empty-state">
						<div className="empty-icon">Нет заказов</div>
						<p>У вас пока нет заказов</p>
						<Link to="/catalog" className="btn btn-primary">
							Перейти в каталог
						</Link>
					</div>
				) : (
					orders.map((o) => (
						<div
							key={o.id}
							className="order-card clickable"
							onClick={() => setSelectedOrder(o)}
						>
							<div className="order-header">
								<span className="order-id">#{o.id}</span>
								<span
									className={`order-status status-${o.status}`}
								>
									{getStatusText(o.status)}
								</span>
							</div>

							<div className="order-date">
								{new Date(o.created_at).toLocaleDateString(
									"ru-RU",
									{
										day: "numeric",
										month: "long",
										year: "numeric",
									}
								)}
							</div>

							<div className="order-items-preview">
								{o.items?.slice(0, 2).map((item) => (
									<span key={item.product_id}>
										{item.name} × {item.quantity}
									</span>
								))}
								{o.items?.length > 2 && (
									<span>и ещё {o.items.length - 2} поз.</span>
								)}
							</div>

							<div className="order-total">
								Сумма:{" "}
								{Number(o.total_amount)?.toLocaleString()} ₽
							</div>
						</div>
					))
				)}
			</div>

			{selectedOrder && (
				<div
					className="modal-overlay"
					onClick={() => setSelectedOrder(null)}
				>
					<div
						className="modal-box order-modal"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							className="modal-close-btn"
							onClick={() => setSelectedOrder(null)}
						>
							×
						</button>

						<h2 className="modal-title">
							Заказ #{selectedOrder.id}
						</h2>

						<div className="order-modal-status">
							<span
								className={`order-status status-${selectedOrder.status}`}
							>
								{getStatusText(selectedOrder.status)}
							</span>
							<span className="order-modal-date">
								{new Date(
									selectedOrder.created_at
								).toLocaleString("ru-RU")}
							</span>
						</div>

						<h3>Состав заказа</h3>
						<div className="order-items">
							{selectedOrder.items?.map((item) => (
								<div
									key={item.product_id}
									className="order-item"
								>
									{item.image_url && (
										<img
											src={`http://localhost:4000${item.image_url}`}
											alt={item.name}
											className="order-item-img"
										/>
									)}
									<div className="order-item-info">
										<div className="order-item-name">
											{item.name}
										</div>
										<div className="order-item-price">
											{item.quantity} ×{" "}
											{Number(
												item.unit_price
											).toLocaleString()}{" "}
											₽
										</div>
									</div>
									<div className="order-item-subtotal">
										{(
											item.quantity *
											Number(item.unit_price)
										).toLocaleString()}{" "}
										₽
									</div>
								</div>
							))}
						</div>

						<h3>Доставка</h3>
						<div className="order-details">
							<p>
								<strong>Адрес:</strong>{" "}
								{selectedOrder.delivery_address}
							</p>
							<p>
								<strong>Телефон:</strong>{" "}
								{selectedOrder.contact_phone}
							</p>
							{selectedOrder.purpose && (
								<p>
									<strong>Назначение:</strong>{" "}
									{PURPOSE_LABELS[selectedOrder.purpose] ||
										selectedOrder.purpose}
								</p>
							)}
							{selectedOrder.comment && (
								<p>
									<strong>Комментарий:</strong>{" "}
									{selectedOrder.comment}
								</p>
							)}
						</div>

						<div className="order-modal-total">
							<strong>Итого:</strong>{" "}
							{Number(
								selectedOrder.total_amount
							)?.toLocaleString()}{" "}
							₽
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export function Promotions() {
	const { user } = useSelector((s) => s.auth);
	const [promos, setPromos] = useState([]);
	const [notify, setNotify] = useState(null);
	const [form, setForm] = useState({
		name: "",
		code: "",
		type: "percentage",
		value: "",
		min_order_amount: "",
		start_date: "",
		end_date: "",
	});
	const isAdminOrManager = ["admin", "manager"].includes(user?.role);

	useEffect(() => {
		api.get("/promotions")
			.then((res) => setPromos(res.data))
			.catch(() => {});
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			await api.post("/promotions", form);
			setNotify({ message: "Акция создана", type: "success" });
			setForm({
				name: "",
				code: "",
				type: "percentage",
				value: "",
				min_order_amount: "",
				start_date: "",
				end_date: "",
			});
			const res = await api.get("/promotions");
			setPromos(res.data);
		} catch (err) {
			setNotify({
				message: err.response?.data?.error || "Ошибка",
				type: "error",
			});
		}
	};

	return (
		<div className="container promos-container">
			{notify && (
				<Notify
					message={notify.message}
					type={notify.type}
					onClose={() => setNotify(null)}
				/>
			)}
			<h1 className="page-title">Акции и промокоды</h1>

			{isAdminOrManager && (
				<div className="card promos-form-card">
					<h3>Добавить акцию</h3>
					<form onSubmit={handleSubmit}>
						<div className="form-group">
							<label>Название</label>
							<input
								value={form.name}
								onChange={(e) =>
									setForm({ ...form, name: e.target.value })
								}
								required
							/>
						</div>
						<div className="form-group">
							<label>Промокод</label>
							<input
								value={form.code}
								onChange={(e) =>
									setForm({
										...form,
										code: e.target.value.toUpperCase(),
									})
								}
								required
							/>
						</div>
						<div className="form-group">
							<label>Тип</label>
							<select
								value={form.type}
								onChange={(e) =>
									setForm({ ...form, type: e.target.value })
								}
							>
								<option value="percentage">Процент (%)</option>
								<option value="fixed">Фикс (₽)</option>
							</select>
						</div>
						<div className="form-group">
							<label>Значение</label>
							<input
								type="number"
								value={form.value}
								onChange={(e) =>
									setForm({ ...form, value: e.target.value })
								}
								required
							/>
						</div>
						<div className="form-group">
							<label>Мин. сумма заказа</label>
							<input
								type="number"
								value={form.min_order_amount}
								onChange={(e) =>
									setForm({
										...form,
										min_order_amount: e.target.value,
									})
								}
							/>
						</div>
						<div className="form-group">
							<label>Дата начала</label>
							<input
								type="date"
								value={form.start_date}
								onChange={(e) =>
									setForm({
										...form,
										start_date: e.target.value,
									})
								}
								required
							/>
						</div>
						<div className="form-group">
							<label>Дата окончания</label>
							<input
								type="date"
								value={form.end_date}
								onChange={(e) =>
									setForm({
										...form,
										end_date: e.target.value,
									})
								}
								required
							/>
						</div>
						<button type="submit" className="btn btn-primary">
							Создать
						</button>
					</form>
				</div>
			)}

			<div className="promos-grid">
				{promos.map((p) => (
					<div key={p.id} className="card promo-card">
						<h3>{p.name}</h3>
						<code className="promo-code">{p.code}</code>
						<p>
							{p.type === "percentage"
								? `Скидка ${p.value}%`
								: `Скидка ${p.value} ₽`}{" "}
							{p.min_order_amount > 0 &&
								`от ${p.min_order_amount} ₽`}
						</p>
						<small className="promo-validity">
							Действует до:{" "}
							{new Date(p.end_date).toLocaleDateString()}
						</small>
					</div>
				))}
			</div>
		</div>
	);
}

export function Reviews() {
	const { token } = useSelector((s) => s.auth);
	const [searchParams] = useSearchParams();
	const urlProductId = searchParams.get("product_id");
	const [reviews, setReviews] = useState([]);
	const [loading, setLoading] = useState(true);
	const [notify, setNotify] = useState(null);
	const [fullImage, setFullImage] = useState(null);
	const [products, setProducts] = useState([]);
	const [form, setForm] = useState({
		productId: urlProductId || "",
		rating: 5,
		delivery_rating: 5,
		quality_rating: 5,
		price_rating: 5,
		comment: "",
	});
	const [files, setFiles] = useState([]);

	useEffect(() => {
		api.get("/reviews")
			.then((res) => {
				setReviews(res.data);
				setLoading(false);
			})
			.catch(() => setLoading(false));
		if (token) {
			api.get("/reviews/available-products")
				.then((res) => setProducts(res.data))
				.catch(() => {});
		}
	}, [token]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!token)
			return setNotify({
				message: "Требуется авторизация",
				type: "error",
			});
		if (!form.productId)
			return setNotify({ message: "Выберите товар", type: "warning" });
		const formData = new FormData();
		formData.append("product_id", form.productId);
		formData.append("rating", form.rating);
		formData.append("delivery_rating", form.delivery_rating);
		formData.append("quality_rating", form.quality_rating);
		formData.append("price_rating", form.price_rating);
		formData.append("comment", form.comment);
		files.forEach((f) => formData.append("images", f));

		try {
			await api.post("/reviews", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			setNotify({
				message: "Отзыв отправлен на модерацию",
				type: "success",
			});
			setForm({
				productId: "",
				rating: 5,
				delivery_rating: 5,
				quality_rating: 5,
				price_rating: 5,
				comment: "",
			});
			setFiles([]);
		} catch (err) {
			setNotify({
				message: err.response?.data?.error || "Ошибка",
				type: "error",
			});
		}
	};

	if (loading) return <div className="loading">Загрузка отзывов...</div>;

	return (
		<div className="container reviews-container">
			{notify && (
				<Notify
					message={notify.message}
					type={notify.type}
					onClose={() => setNotify(null)}
				/>
			)}
			<h1 className="page-title">Отзывы</h1>

			{token && (
				<div className="card review-form-card">
					<h3>Оставить отзыв</h3>

					{products.length === 0 ? (
						<p className="no-reviews">
							У вас нет товаров, на которые можно оставить отзыв.
							Сначала оформите заказ.
						</p>
					) : (
						<form onSubmit={handleSubmit}>
							<div className="form-group">
								<label>Товар</label>
								<select
									value={form.productId}
									onChange={(e) =>
										setForm({
											...form,
											productId: e.target.value,
										})
									}
									required
								>
									<option value="">Выберите товар</option>
									{products.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name}
										</option>
									))}
								</select>
							</div>

							<div className="form-group">
								<label>Общая оценка</label>
								<StarRating
									rating={form.rating}
									onChange={(r) =>
										setForm({ ...form, rating: r })
									}
									size={24}
								/>
							</div>

							<div className="form-group">
								<label>Доставка</label>
								<StarRating
									rating={form.delivery_rating}
									onChange={(r) =>
										setForm({ ...form, delivery_rating: r })
									}
									size={24}
								/>
							</div>

							<div className="form-group">
								<label>Качество</label>
								<StarRating
									rating={form.quality_rating}
									onChange={(r) =>
										setForm({ ...form, quality_rating: r })
									}
									size={24}
								/>
							</div>

							<div className="form-group">
								<label>Цена</label>
								<StarRating
									rating={form.price_rating}
									onChange={(r) =>
										setForm({ ...form, price_rating: r })
									}
									size={24}
								/>
							</div>

							<div className="form-group">
								<label>Комментарий</label>
								<textarea
									value={form.comment}
									onChange={(e) =>
										setForm({
											...form,
											comment: e.target.value,
										})
									}
									rows="3"
								/>
							</div>

							<div className="form-group">
								<label>Фото (до 5)</label>
								<input
									type="file"
									multiple
									accept="image/*"
									onChange={(e) =>
										setFiles(Array.from(e.target.files))
									}
								/>
							</div>

							<button type="submit" className="btn btn-primary">
								Отправить на модерацию
							</button>
						</form>
					)}
				</div>
			)}

			<div className="reviews-list">
				{reviews.map((r) => (
					<div key={r.id} className="card review-card">
						<div className="review-content">
							<div className="review-author">{r.full_name}</div>
							<div className="review-stars">
								<StarRating
									rating={r.rating}
									readonly
									size={18}
								/>
							</div>
							<div className="review-meta">
								<span>Доставка: {r.delivery_rating}</span>
								<span>Качество: {r.quality_rating}</span>
								<span>Цена: {r.price_rating}</span>
							</div>
							<p className="review-comment">{r.comment}</p>
							<small className="review-product">
								Товар: {r.product_name}
							</small>
						</div>
						{r.images?.length > 0 && (
							<div className="review-images">
								{r.images.map((img, i) => (
									<img
										key={i}
										src={`http://localhost:4000${img}`}
										alt="review"
										className="review-thumb"
										onClick={() => setFullImage(img)}
									/>
								))}
							</div>
						)}
					</div>
				))}
				{reviews.length === 0 && (
					<p className="no-reviews">Пока нет одобренных отзывов</p>
				)}
			</div>
			{fullImage && (
				<ImageModal
					imageUrl={fullImage}
					onClose={() => setFullImage(null)}
				/>
			)}
		</div>
	);
}