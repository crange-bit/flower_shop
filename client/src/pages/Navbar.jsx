import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import { fetchCart } from "../store/cartSlice";
import logo from "../images/logo.svg";

export default function Navbar() {
	const { token } = useSelector((s) => s.auth);
	const cartCount = useSelector((s) => s.cart.items.length);
	const dispatch = useDispatch();
	const nav = useNavigate();

	return (
		<nav className="navbar">
			<div className="navbar-left">
				<Link to="/" className="navbar-logo">
					<img src={logo} alt="Логотип" />
				</Link>
				<div className="navbar-menu">
					<Link to="/">Главная</Link>
					<Link to="/catalog">Каталог</Link>
					<Link to="/about">О нас</Link>
					<Link to="/reviews">Отзывы</Link>
					<Link to="/contacts">Контакты</Link>
				</div>
			</div>

			<div className="navbar-right">
				<div className="navbar-actions">
					{token ? (
						<>
							<Link to="/cart" className="nav-action-btn">
								Корзина
								{cartCount > 0 && (
									<span className="nav-count">
										{cartCount}
									</span>
								)}
							</Link>
							<Link to="/profile" className="nav-action-btn">
								Профиль
							</Link>
							<button
								onClick={() => {
									dispatch(logout());
									dispatch(fetchCart());
									nav("/");
								}}
								className="nav-action-btn logout-btn"
							>
								Выйти
							</button>
						</>
					) : (
						<Link to="/auth" className="nav-action-btn btn-login">
							Войти
						</Link>
					)}
				</div>
			</div>
		</nav>
	);
}