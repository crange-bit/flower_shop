import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { api } from "../api/axios";
import { Notify } from "./Modals";
import flower from "../images/flower.png";
import fresh from "../images/fresh.svg";
import delivery from "../images/delivery.svg";
import price from "../images/price.svg";
import gift from "../images/gift.svg";
import experience from "../images/experience.svg";
import quality from "../images/quality.svg";

export default function Home() {
	const { token } = useSelector((s) => s.auth);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [formData, setFormData] = useState({ name: "", phone: "" });
	const [notify, setNotify] = useState(null);
	const [loading, setLoading] = useState(false);

	const validateConsultation = () => {
		const errors = [];

		if (!formData.name.trim()) {
			errors.push("Укажите имя");
		} else if (formData.name.trim().length < 2) {
			errors.push("Имя слишком короткое");
		} else if (formData.name.trim().length > 50) {
			errors.push("Имя слишком длинное");
		}

		if (!formData.phone.trim()) {
			errors.push("Укажите телефон");
		} else {
			const cleaned = formData.phone.replace(/[\s()+-]/g, "");
			if (!/^\+?\d+$/.test(formData.phone.replace(/[\s()-]/g, ""))) {
				errors.push(
					"Телефон может содержать только цифры и символы +, -, (, )"
				);
			} else if (cleaned.length < 10) {
				errors.push("Слишком короткий номер (минимум 10 цифр)");
			} else if (cleaned.length > 15) {
				errors.push("Слишком длинный номер (максимум 15 цифр)");
			}
		}

		return errors;
	};

	const handleConsultationSubmit = async (e) => {
		e.preventDefault();
		const errors = validateConsultation();
		if (errors.length > 0) {
			setNotify({ message: errors[0], type: "warning" });
			return;
		}
		setLoading(true);
		try {
			await api.post("/consultation", formData);
			setNotify({
				message: "Заявка отправлена! Мы скоро свяжемся.",
				type: "success",
			});
			setIsModalOpen(false);
			setFormData({ name: "", phone: "" });
		} catch {
			setNotify({ message: "Ошибка отправки", type: "error" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="home-page">
			{notify && (
				<Notify
					message={notify.message}
					type={notify.type}
					onClose={() => setNotify(null)}
				/>
			)}

			<section className="hero-section">
				<div className="container">
					<div className="hero-content">
						<h1 className="hero-title">Магазин цветов RoseClick</h1>
						<p className="hero-subtitle">
							Свежие цветы и букеты для любого повода. Доставка по
							городу.
						</p>
						<div className="hero-buttons">
							<Link to="/catalog" className="btn btn-primary">
								Наш каталог
							</Link>
							{!token && (
								<Link to="/auth" className="btn btn-outline">
									Войти
								</Link>
							)}
						</div>
						<div className="hero-features">
							<div className="feature-item">
								<span className="feature-icon">✓</span> Свежие
								цветы
							</div>
							<div className="feature-item">
								<span className="feature-icon">✓</span> Быстрая
								доставка
							</div>
							<div className="feature-item">
								<span className="feature-icon">✓</span> Выгодные
								цены
							</div>
						</div>
					</div>
					<img src={flower} alt="Фото венка" />
				</div>
			</section>

			<section className="advantages-section">
				<div className="container">
					<h2 className="section-title">Наши преимущества</h2>
					<div className="advantages-grid">
						<div className="advantage-card">
							<div className="advantage-icon-placeholder">
								<img src={fresh} alt="Свежесть" />
							</div>
							<h3>Всегда свежие цветы</h3>
							<p>
								Поставки цветов каждые 2 дня. Гарантия свежести
								7 дней.
							</p>
						</div>
						<div className="advantage-card">
							<div className="advantage-icon-placeholder">
								<img src={delivery} alt="Доставка" />
							</div>
							<h3>Быстрая доставка</h3>
							<p>
								Доставка от 2 часов. Бесплатно при заказе от
								3000 рублей.
							</p>
						</div>
						<div className="advantage-card">
							<div className="advantage-icon-placeholder">
								<img src={price} alt="Цена" />
							</div>
							<h3>Доступные цены</h3>
							<p>
								Букеты от 1500 рублей. Система скидок для
								постоянных клиентов.
							</p>
						</div>
						<div className="advantage-card">
							<div className="advantage-icon-placeholder">
								<img src={gift} alt="Подарок" />
							</div>
							<h3>Подарок к заказу</h3>
							<p>
								Открытка и упаковка в подарок к каждому букету.
							</p>
						</div>
						<div className="advantage-card">
							<div className="advantage-icon-placeholder">
								<img src={experience} alt="Опыт" />
							</div>
							<h3>Опытные флористы</h3>
							<p>
								Индивидуальный подход к каждому клиенту.
								Уникальные композиции.
							</p>
						</div>
						<div className="advantage-card">
							<div className="advantage-icon-placeholder">
								<img src={quality} alt="Качество" />
							</div>
							<h3>Гарантия качества</h3>
							<p>
								Если букет не понравится - вернем деньги или
								заменим.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="consultation-section">
				<div className="container">
					<h2 className="section-title">Нужна помощь с выбором?</h2>
					<p className="section-subtitle">
						Наши флористы помогут подобрать идеальный букет для
						вашего случая
					</p>
					<button
						className="btn btn-primary btn-large"
						onClick={() => setIsModalOpen(true)}
					>
						Получить консультацию
					</button>
				</div>
			</section>

			{isModalOpen && (
				<div
					className="modal-overlay"
					onClick={() => setIsModalOpen(false)}
				>
					<div
						className="modal-box consultation-modal"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							className="modal-close-btn"
							onClick={() => setIsModalOpen(false)}
						>
							×
						</button>
						<h2 className="modal-title">Заявка на консультацию</h2>
						<form onSubmit={handleConsultationSubmit}>
							<div className="form-group">
								<label>Как вас зовут?</label>
								<input
									type="text"
									value={formData.name}
									onChange={(e) =>
										setFormData({
											...formData,
											name: e.target.value,
										})
									}
									placeholder="Ваше имя"
									required
									maxLength={50}
								/>
							</div>
							<div className="form-group">
								<label>Номер телефона</label>
								<input
									type="tel"
									value={formData.phone}
									onChange={(e) =>
										setFormData({
											...formData,
											phone: e.target.value,
										})
									}
									placeholder="+7 (___) ___-__-__"
									required
									maxLength={18}
								/>
							</div>
							<button
								type="submit"
								className="btn btn-primary btn-block"
								disabled={loading}
							>
								{loading ? "Отправка..." : "Отправить заявку"}
							</button>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}