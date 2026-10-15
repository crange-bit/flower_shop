import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { setAuth } from "../store/authSlice";
import { api } from "../api/axios";
import { useEffect } from "react";

export function Auth() {
	const [isReg, setIsReg] = useState(false);
	const [form, setForm] = useState({
		email: "",
		password_hash: "",
		password: "",
		full_name: "",
		phone: "",
	});
	const [err, setErr] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const dispatch = useDispatch();
	const nav = useNavigate();

	const validatePassword = (password) => {
		if (isReg && password.length > 0 && password.length < 6) {
			setPasswordError("Пароль должен содержать минимум 6 символов");
			return false;
		}
		setPasswordError("");
		return true;
	};

	const handlePasswordChange = (e) => {
		const newPassword = e.target.value;
		setForm({
			...form,
			[isReg ? "password_hash" : "password"]: newPassword,
		});
		validatePassword(newPassword);
	};

	const sub = async (e) => {
		e.preventDefault();
		setErr("");
		if (isReg) {
			const isValid = validatePassword(form.password_hash);
			if (!isValid) return;
		}
		try {
			const ep = isReg ? "/auth/register" : "/auth/login";
			const body = isReg
				? {
						email: form.email,
						password_hash: form.password_hash,
						full_name: form.full_name,
						phone: form.phone,
						role: "user",
				  }
				: { email: form.email, password: form.password };
			const { data } = await api.post(ep, body);
			dispatch(setAuth(data));
			nav("/");
		} catch (e) {
			const errorMsg = e.response?.data?.error;
			setErr(
				typeof errorMsg === "object"
					? JSON.stringify(errorMsg)
					: errorMsg || e.message || "Ошибка"
			);
		}
	};

	return (
		<div className="auth-container">
			<div className="card auth-card">
				<h2 className="page-title">{isReg ? "Регистрация" : "Вход"}</h2>
				<form onSubmit={sub}>
					<div className="form-group">
						<label>Email</label>
						<input
							type="email"
							value={form.email}
							onChange={(e) =>
								setForm({ ...form, email: e.target.value })
							}
							placeholder="example@mail.com"
							required
						/>
					</div>
					<div className="form-group">
						<label>Пароль</label>
						<input
							type="password"
							className={passwordError ? "error" : ""}
							value={isReg ? form.password_hash : form.password}
							onChange={handlePasswordChange}
							placeholder="Минимум 6 символов"
							required
						/>
						{passwordError && (
							<div className="error-text">{passwordError}</div>
						)}
						{isReg &&
							!passwordError &&
							form.password_hash &&
							form.password_hash.length >= 6 && (
								<div className="alert alert-success password-hint">
									Хорошая длина пароля
								</div>
							)}
					</div>
					{isReg && (
						<>
							<div className="form-group">
								<label>ФИО</label>
								<input
									value={form.full_name}
									onChange={(e) =>
										setForm({
											...form,
											full_name: e.target.value,
										})
									}
									placeholder="Иванов Иван Иванович"
									required
								/>
							</div>
							<div className="form-group">
								<label>Телефон</label>
								<input
									value={form.phone}
									onChange={(e) =>
										setForm({
											...form,
											phone: e.target.value,
										})
									}
									placeholder="+7 (999) 123-45-67"
								/>
							</div>
						</>
					)}
					<button
						type="submit"
						className="btn btn-primary btn-block"
						disabled={!!passwordError}
					>
						{isReg ? "Зарегистрироваться" : "Войти"}
					</button>
					{err && <div className="alert alert-error">{err}</div>}
				</form>
				{!isReg && (
					<Link to="/forgot-password" className="auth-forgot-link">
						Забыли пароль?
					</Link>
				)}
				<button
					onClick={() => {
						setIsReg(!isReg);
						setPasswordError("");
						setErr("");
					}}
					className="btn btn-outline btn-block"
				>
					{isReg
						? "Уже есть аккаунт? Войти"
						: "Нет аккаунта? Регистрация"}
				</button>
			</div>
		</div>
	);
}

export function ForgotPassword() {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState("");
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setStatus("");
		setMessage("");
		try {
			const { data } = await api.post("/auth/forgot-password", { email });
			setStatus("success");
			setMessage(data.message);
			setEmail("");
		} catch (err) {
			setStatus("error");
			setMessage(err.response?.data?.error || "Ошибка отправки");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-container">
			<h2 className="page-title">Восстановление пароля</h2>
			<p className="auth-subtitle">
				Введите ваш email, и мы отправим инструкцию по сбросу пароля
			</p>

			<form onSubmit={handleSubmit} className="auth-form">
				<div className="form-group">
					<label>Email</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						disabled={loading}
					/>
				</div>
				<button
					type="submit"
					className="btn btn-primary"
					disabled={loading}
				>
					{loading ? "Отправка..." : "Отправить инструкцию"}
				</button>
				{status === "success" && (
					<div className="alert alert-success">{message}</div>
				)}
				{status === "error" && (
					<div className="alert alert-error">{message}</div>
				)}
			</form>

			<Link to="/auth" className="auth-back-link">
				Вернуться ко входу
			</Link>
		</div>
	);
}

export function ResetPassword() {
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token");
	const navigate = useNavigate();
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [status, setStatus] = useState("");
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const [passwordError, setPasswordError] = useState("");

	const validatePassword = (password) => {
		if (password.length > 0 && password.length < 6) {
			setPasswordError("Пароль должен содержать минимум 6 символов");
			return false;
		}
		setPasswordError("");
		return true;
	};

	const handlePasswordChange = (e) => {
		const password = e.target.value;
		setNewPassword(password);
		validatePassword(password);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validatePassword(newPassword)) return;
		if (newPassword !== confirmPassword) {
			setStatus("error");
			setMessage("Пароли не совпадают");
			return;
		}
		if (!token) {
			setStatus("error");
			setMessage("Отсутствует токен сброса пароля");
			return;
		}

		setLoading(true);
		setStatus("");
		setMessage("");
		try {
			const { data } = await api.post("/auth/reset-password", {
				token,
				new_password: newPassword,
			});
			setStatus("success");
			setMessage(data.message);
			setTimeout(() => navigate("/auth"), 3000);
		} catch (err) {
			setStatus("error");
			setMessage(err.response?.data?.error || "Ошибка сброса пароля");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-container">
			<h2 className="page-title">Сброс пароля</h2>
			<form onSubmit={handleSubmit} className="auth-form">
				<div className="form-group">
					<label>Новый пароль</label>
					<input
						type="password"
						className={passwordError ? "error" : ""}
						value={newPassword}
						onChange={handlePasswordChange}
						required
						disabled={loading}
					/>
					{passwordError && (
						<div className="error-text password-hint">
							{passwordError}
						</div>
					)}
				</div>
				<div className="form-group">
					<label>Подтвердите пароль</label>
					<input
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						required
						disabled={loading}
					/>
				</div>
				<button
					type="submit"
					className="btn btn-primary"
					disabled={loading}
				>
					{loading ? "Сохранение..." : "Сбросить пароль"}
				</button>
				{status === "success" && (
					<div className="alert alert-success">{message}</div>
				)}
				{status === "error" && (
					<div className="alert alert-error">{message}</div>
				)}
			</form>
		</div>
	);
}

export function VerifyEmail() {
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token");
	const [status, setStatus] = useState("loading");
	const [message, setMessage] = useState("");

	useEffect(() => {
		const verifyEmail = async () => {
			if (!token) {
				setStatus("error");
				setMessage("Отсутствует токен подтверждения");
				return;
			}

			try {
				const { data } = await api.get(
					`/auth/verify-email?token=${token}`
				);
				setStatus("success");
				setMessage(data.message);
			} catch (err) {
				setStatus("error");
				setMessage(
					err.response?.data?.error || "Ошибка подтверждения email"
				);
			}
		};

		verifyEmail();
	}, [token]);

	return (
		<div className="auth-container">
			<h2>Подтверждение email</h2>
			{status === "loading" && (
				<div className="loading">Проверяем...</div>
			)}
			{status === "success" && (
				<>
					<div className="alert alert-success">{message}</div>
					<Link to="/auth" className="btn btn-primary">
						Перейти ко входу
					</Link>
				</>
			)}
			{status === "error" && (
				<>
					<div className="alert alert-error">{message}</div>
					<Link to="/auth" className="btn btn-primary">
						Вернуться ко входу
					</Link>
				</>
			)}
		</div>
	);
}