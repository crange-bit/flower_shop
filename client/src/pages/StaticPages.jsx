import { Link } from "react-router-dom";

export function About() {
	return (
		<div className="container page-container">
			<h1 className="page-title">О нас</h1>
			<div className="card about-content">
				<h2>Добро пожаловать в наш цветочный магазин!</h2>
				<p>
					Мы работаем с 2010 года и за это время стали одним из
					ведущих цветочных магазинов города.
				</p>
				<h3>Наши преимущества:</h3>
				<ul className="about-list">
					<li>Только свежие цветы</li>
					<li>Индивидуальный подход к каждому клиенту</li>
					<li>Быстрая доставка</li>
					<li>Доступные цены</li>
					<li>Опытные флористы</li>
				</ul>
			</div>
			<h1 className="page-title">Доставка и оплата</h1>
			<div className="card delivery-content">
				<h2>Условия доставки</h2>
				<div className="delivery-section">
					<h3>Способы доставки:</h3>
					<ul>
						<li>Курьерская доставка по городу - 300 рублей</li>
						<li>Самовывоз из магазина - бесплатно</li>
						<li>Доставка в пригород - от 500 рублей</li>
					</ul>
				</div>
				<div className="delivery-section">
					<h3>Сроки доставки:</h3>
					<ul>
						<li>В день заказа - при заказе до 18:00</li>
						<li>На следующий день - при заказе после 18:00</li>
					</ul>
				</div>
				<div className="delivery-section">
					<h3>Способы оплаты:</h3>
					<ul>
						<li>Наличными курьеру</li>
						<li>Банковской картой</li>
						<li>Онлайн оплата на сайте</li>
					</ul>
				</div>
			</div>
		</div>
	);
}

export function Contacts() {
	return (
		<div className="container page-container">
			<h1 className="page-title">Контакты</h1>
			<div className="card contacts-content">
				<div className="contacts-info">
					<h2>Наши контакты</h2>
					<p>
						<strong>Адрес:</strong> г. Владимир, проспект
						Строителей, д. 9Б
					</p>
					<p>
						<strong>Телефон:</strong> +8 (905) 690-94-60
					</p>
					<p>
						<strong>Email:</strong> info@flowershop.ru
					</p>
					<p>
						<strong>Режим работы:</strong>
					</p>
					<ul>
						<li>Пн-Пт: 9:00 - 20:00</li>
						<li>Сб-Вс: 10:00 - 18:00</li>
					</ul>
				</div>
			</div>
			<h1 className="page-title">Как до нас добраться</h1>
			<div className="contacts-map">
				<iframe
					title="Карта проезда"
					src="https://yandex.ru/map-widget/v1/?um=constructor%3A062608541ec3ff6f4e59f56cd4a79edf315ab927965484a4e3dc30aa04c3331c&amp;source=constructor"
					width="100%"
					height="400"
					allowFullScreen
					style={{ border: 0, borderRadius: "16px" }}
				/>
			</div>
		</div>
	);
}

export function Footer() {
	return (
		<footer className="footer">
			<div className="container">
				<div className="footer-content">
					<div className="footer-section">
						<div className="footer-brand">
							<h3>Магазин цветов RoseClick</h3>
							<p className="footer-slogan">
								Свежие цветы с доставкой
							</p>
						</div>
						<p className="footer-work-time">
							Работаем ежедневно с 09:00 до 21:00. Принимаем
							заказы круглосуточно на сайте.
						</p>
					</div>

					<div className="footer-section">
						<h4>Информация</h4>
						<ul className="footer-links">
							<li>
								<Link to="/about">О нас</Link>
							</li>
							<li>
								<Link to="/reviews">Отзывы</Link>
							</li>
							<li>
								<Link to="/promotions">Акции</Link>
							</li>
							<li>
								<Link to="/contacts">Контакты</Link>
							</li>
						</ul>
					</div>

					<div className="footer-section">
						<h4>Контакты</h4>
						<a href="tel:+89056909460" className="footer-phone">
							+8 (905) 690-94-60
						</a>
						<p className="footer-email">
							absolyutnotochno@yandex.ru
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}