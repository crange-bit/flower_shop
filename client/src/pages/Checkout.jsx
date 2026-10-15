import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import { fetchCart } from "../store/cartSlice";
import { Notify, ConfirmDialog } from "./Modals";

const DELIVERY_FEE = 500;
const FREE_DELIVERY_THRESHOLD = 5000;

const PURPOSES = [
	{ value: "celebration", label: "Праздник / поздравление" },
	{ value: "romantic", label: "Романтика / свидание" },
	{ value: "wedding", label: "Свадьба" },
	{ value: "birthday", label: "День рождения" },
	{ value: "anniversary", label: "Годовщина" },
	{ value: "sympathy", label: "Соболезнования" },
	{ value: "other", label: "Другое" },
];

export default function Checkout() {
	const [form, setForm] = useState({
		delivery_address: "",
		contact_phone: "",
		comment: "",
		purpose: "celebration",
	});
	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [notify, setNotify] = useState(null);
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const cartItems = useSelector((s) => s.cart.items);
	const user = useSelector((s) => s.auth.user);
	const subtotal = cartItems.reduce(
		(s, i) => s + Number(i.price) * i.quantity,
		0
	);
	const deliveryCost = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

	const [availablePromos, setAvailablePromos] = useState([]);
	const [selectedPromoCode, setSelectedPromoCode] = useState("");
	const [promoDiscount, setPromoDiscount] = useState(0);
	const [promoError, setPromoError] = useState("");
	const [loadingPromo, setLoadingPromo] = useState(false);

	const finalTotal = subtotal - promoDiscount + deliveryCost;

	useEffect(() => {
		api.get("/promotions")
			.then((res) => setAvailablePromos(res.data))
			.catch(() => {});
	}, []);

	const handlePromoChange = async (e) => {
		const code = e.target.value;
		setSelectedPromoCode(code);
		if (!code) {
			setPromoDiscount(0);
			setPromoError("");
			return;
		}
		setLoadingPromo(true);
		setPromoError("");
		try {
			const res = await api.post("/promotions/apply", {
				code,
				total_amount: subtotal,
				userId: user?.id,
			});
			setPromoDiscount(res.data.discount_amount);
		} catch (err) {
			setPromoError(err.response?.data?.error || "Промокод не подходит");
			setPromoDiscount(0);
		} finally {
			setLoadingPromo(false);
		}
	};

	const validateForm = () => {
		const newErrors = {};
		if (!form.delivery_address.trim())
			newErrors.delivery_address = "Укажите адрес доставки";
		else if (form.delivery_address.length < 5)
			newErrors.delivery_address = "Адрес слишком короткий";

		if (!form.contact_phone.trim()) {
			newErrors.contact_phone = "Укажите контактный телефон";
		} else {
			const cleaned = form.contact_phone.replace(/[\s()+-]/g, "");
			if (!/^\+?\d+$/.test(form.contact_phone.replace(/[\s()-]/g, ""))) {
				newErrors.contact_phone =
					"Телефон может содержать только цифры и символы +, -, (, )";
			} else if (cleaned.length < 10) {
				newErrors.contact_phone =
					"Слишком короткий номер (минимум 10 цифр)";
			} else if (cleaned.length > 15) {
				newErrors.contact_phone =
					"Слишком длинный номер (максимум 15 цифр)";
			}
		}

		if (!form.purpose) newErrors.purpose = "Укажите назначение букета";

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleDeliveryAddressChange = (e) => {
		setForm({ ...form, delivery_address: e.target.value });
		if (errors.delivery_address) {
			const n = { ...errors };
			delete n.delivery_address;
			setErrors(n);
		}
	};
	const handleContactPhoneChange = (e) => {
		setForm({ ...form, contact_phone: e.target.value });
		if (errors.contact_phone) {
			const n = { ...errors };
			delete n.contact_phone;
			setErrors(n);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validateForm()) {
			setNotify({
				message: "Пожалуйста, заполните все поля правильно",
				type: "warning",
			});
			return;
		}
		setShowConfirm(true);
	};

	const confirmOrder = async () => {
		setShowConfirm(false);
		setLoading(true);
		try {
			await api.post("/orders", {
				...form,
				subtotal,
				deliveryCost,
				promo_code: selectedPromoCode || null,
				final_amount: finalTotal,
			});

			if (selectedPromoCode && promoDiscount > 0) {
				await api.post("/promotions/use", { code: selectedPromoCode });
			}
			setNotify({ message: "Заказ успешно оформлен", type: "success" });
			await dispatch(fetchCart());
			setTimeout(() => navigate("/profile"), 2000);
		} catch (err) {
			setNotify({
				message:
					err.response?.data?.error || "Ошибка оформления заказа",
				type: "error",
			});
		} finally {
			setLoading(false);
		}
	};

	if (cartItems.length === 0) {
		return (
			<div className="container checkout-container">
				<div className="card empty-state">
					<div className="empty-icon">Корзина</div>
					<h2>Корзина пуста</h2>
					<p>Добавьте товары перед оформлением заказа</p>
					<button
						onClick={() => navigate("/catalog")}
						className="btn btn-primary"
					>
						Перейти в каталог
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="container checkout-container">
			{notify && (
				<Notify
					message={notify.message}
					type={notify.type}
					onClose={() => setNotify(null)}
				/>
			)}
			<ConfirmDialog
				isOpen={showConfirm}
				onClose={() => setShowConfirm(false)}
				onConfirm={confirmOrder}
				title="Подтверждение заказа"
				message={`Вы уверены, что хотите оформить заказ на сумму ${finalTotal.toLocaleString()} ₽?`}
			/>

			<div className="card">
				<h2 className="section-title checkout-title">
					Оформление заказа
				</h2>

				<div className="checkout-summary">
					<h3>Ваш заказ:</h3>
					{cartItems.map((item) => (
						<div key={item.cart_id} className="checkout-item-row">
							<span>
								{item.name} × {item.quantity}
							</span>
							<span className="checkout-item-price">
								{(
									Number(item.price) * item.quantity
								).toLocaleString()}{" "}
								₽
							</span>
						</div>
					))}

					<div className="checkout-total-section">
						<div className="checkout-subtotal">
							<span>Сумма товаров:</span>
							<span>{subtotal.toLocaleString()} ₽</span>
						</div>

						<div
							className={`checkout-delivery ${
								deliveryCost === 0 ? "free" : ""
							}`}
						>
							<span>Доставка:</span>
							<span>
								{deliveryCost === 0
									? "Бесплатно"
									: `${deliveryCost} ₽`}
							</span>
						</div>

						<div className="form-group">
							<label>Промокод</label>
							<select
								value={selectedPromoCode}
								onChange={handlePromoChange}
								disabled={
									loadingPromo || availablePromos.length === 0
								}
							>
								<option value="">
									Не использовать промокод
								</option>
								{availablePromos.map((p) => (
									<option key={p.id} value={p.code}>
										{p.name} ({p.code})
									</option>
								))}
							</select>
							{promoError && (
								<div className="error-text">{promoError}</div>
							)}
						</div>

						{promoDiscount > 0 && (
							<div className="checkout-discount">
								<span>Скидка по промокоду:</span>
								<span>−{promoDiscount.toLocaleString()} ₽</span>
							</div>
						)}

						<div className="checkout-grand-total">
							<span>Итого к оплате:</span>
							<span className="grand-total-amount">
								{finalTotal.toLocaleString()} ₽
							</span>
						</div>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="checkout-form">
					<div className="form-group">
						<label>Адрес доставки *</label>
						<input
							type="text"
							value={form.delivery_address}
							onChange={handleDeliveryAddressChange}
							placeholder="г. Владимир, ул. Примерная, д. 1, кв. 1"
							className={
								errors.delivery_address ? "input-error" : ""
							}
							disabled={loading}
						/>
						{errors.delivery_address && (
							<div className="error-text">
								{errors.delivery_address}
							</div>
						)}
					</div>

					<div className="form-group">
						<label>Контактный телефон *</label>
						<input
							type="tel"
							value={form.contact_phone}
							onChange={handleContactPhoneChange}
							placeholder="+7 999 123-45-67"
							className={
								errors.contact_phone ? "input-error" : ""
							}
							disabled={loading}
							maxLength={18}
						/>
						{errors.contact_phone && (
							<div className="error-text">
								{errors.contact_phone}
							</div>
						)}
					</div>

					<div className="form-group">
						<label>Назначение букета *</label>
						<select
							value={form.purpose}
							onChange={(e) =>
								setForm({ ...form, purpose: e.target.value })
							}
							disabled={loading}
						>
							{PURPOSES.map((p) => (
								<option key={p.value} value={p.value}>
									{p.label}
								</option>
							))}
						</select>
						{errors.purpose && (
							<div className="error-text">{errors.purpose}</div>
						)}
					</div>

					{form.purpose === "sympathy" && (
						<div className="checkout-note checkout-note-sympathy">
							<strong>Примечание для флориста:</strong> букет
							предназначен для соболезнований. Используйте
							приглушённые, светлые оттенки. Чётное количество
							цветов допускается.
						</div>
					)}

					{form.purpose === "other" && (
						<div className="checkout-note">
							Опишите, пожалуйста, назначение букета в комментарии
							к заказу — это поможет флористу правильно подобрать
							композицию.
						</div>
					)}

					<div className="form-group">
						<label>Комментарий к заказу</label>
						<textarea
							value={form.comment}
							onChange={(e) =>
								setForm({ ...form, comment: e.target.value })
							}
							rows="3"
							placeholder="Пожелания по доставке, особые указания…"
							disabled={loading}
						/>
					</div>

					<div className="checkout-actions">
						<button
							type="submit"
							className="btn btn-primary btn-flex"
							disabled={loading}
						>
							{loading ? "Оформление…" : "Подтвердить заказ"}
						</button>
						<button
							type="button"
							onClick={() => navigate("/cart")}
							className="btn btn-secondary"
							disabled={loading}
						>
							Назад в корзину
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}