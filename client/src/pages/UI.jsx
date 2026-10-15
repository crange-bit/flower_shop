import { useState } from "react";

export function Pagination({ page, pages, onChange }) {
	if (pages <= 1) return null;
	return (
		<nav
			className="pagination-container"
			role="navigation"
			aria-label="Пагинация"
		>
			<button
				disabled={page === 1}
				onClick={() => onChange(page - 1)}
				aria-label="Предыдущая страница"
				className="btn-pagination"
			>
				←
			</button>
			<span className="pagination-info">
				{page}/{pages}
			</span>
			<button
				disabled={page === pages}
				onClick={() => onChange(page + 1)}
				aria-label="Следующая страница"
				className="btn-pagination"
			>
				→
			</button>
		</nav>
	);
}

export function QuantitySelector({
	quantity,
	onQuantityChange,
	stock,
	disabled,
}) {
	const [inputValue, setInputValue] = useState(quantity.toString());
	const [error, setError] = useState("");

	const handleDecrease = (e) => {
		e.stopPropagation();
		if (quantity > 1) {
			const newQuantity = quantity - 1;
			onQuantityChange(newQuantity);
			setInputValue(newQuantity.toString());
			setError("");
		}
	};

	const handleIncrease = (e) => {
		e.stopPropagation();
		if (quantity < stock) {
			const newQuantity = quantity + 1;
			onQuantityChange(newQuantity);
			setInputValue(newQuantity.toString());
			setError("");
		} else {
			setError(`Максимум ${stock} штук`);
		}
	};

	const handleInputChange = (e) => {
		const value = e.target.value;
		if (value === "") {
			setInputValue("");
			return;
		}
		const num = parseInt(value);
		if (!isNaN(num)) {
			if (num >= 1 && num <= stock) {
				onQuantityChange(num);
				setInputValue(num.toString());
				setError("");
			} else if (num > stock) {
				setError(`Максимум ${stock} штук`);
				setInputValue(stock.toString());
				onQuantityChange(stock);
			} else if (num < 1) {
				setError("Минимум 1 штука");
				setInputValue("1");
				onQuantityChange(1);
			}
		}
	};

	const handleBlur = () => {
		if (inputValue === "" || isNaN(parseInt(inputValue))) {
			setInputValue("1");
			onQuantityChange(1);
		}
	};

	return (
		<div className="qty-control" onClick={(e) => e.stopPropagation()}>
			<button
				type="button"
				onClick={handleDecrease}
				disabled={disabled || quantity <= 1}
				className="qty-btn"
			>
				-
			</button>
			<input
				type="text"
				value={inputValue}
				onChange={handleInputChange}
				onBlur={handleBlur}
				disabled={disabled}
				className={`qty-input ${error ? "input-error" : ""}`}
				onClick={(e) => e.stopPropagation()}
				onMouseDown={(e) => e.stopPropagation()}
				onFocus={(e) => e.stopPropagation()}
			/>
			<button
				type="button"
				onClick={handleIncrease}
				disabled={disabled || quantity >= stock}
				className="qty-btn"
			>
				+
			</button>
			<span className="qty-stock">доступно: {stock}</span>
		</div>
	);
}

export function StarRating({ rating, onChange, size = 20, readonly = false }) {
	const [hover, setHover] = useState(0);
	return (
		<div
			className={`star-rating ${readonly ? "readonly" : ""}`}
			style={{ fontSize: size }}
		>
			{[1, 2, 3, 4, 5].map((star) => (
				<span
					key={star}
					className={`star ${
						star <= (hover || rating) ? "star-filled" : ""
					}`}
					onClick={() => !readonly && onChange && onChange(star)}
					onMouseEnter={() => !readonly && setHover(star)}
					onMouseLeave={() => !readonly && setHover(0)}
				>
					★
				</span>
			))}
		</div>
	);
}