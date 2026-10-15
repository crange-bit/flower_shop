import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
	if (!isOpen) return null;
	return (
		<div className="confirm-dialog-overlay">
			<div className="confirm-dialog-box">
				<h3 className="dialog-title">{title}</h3>
				<p className="dialog-message">{message}</p>
				<div className="dialog-actions">
					<button onClick={onClose} className="btn btn-outline">
						Отмена
					</button>
					<button onClick={onConfirm} className="btn btn-danger">
						Подтвердить
					</button>
				</div>
			</div>
		</div>
	);
}

export function ImageModal({ imageUrl, onClose }) {
	if (!imageUrl) return null;
	return (
		<div
			className="image-modal-overlay"
			onClick={onClose}
			style={{ zIndex: 9999 }}
		>
			<img
				src={"http://localhost:4000" + imageUrl}
				alt="Full size"
				className="image-modal-content"
				onClick={(e) => e.stopPropagation()}
			/>
		</div>
	);
}

export function Notify({ message, type, onClose }) {
	useEffect(() => {
		const timer = setTimeout(() => onClose(), 5000);
		return () => clearTimeout(timer);
	}, [onClose]);

	return (
		<div className={`toast-notification toast-${type}`}>
			<div className="toast-content">
				<span className="toast-icon">
					{type === "success"
						? "Успешно"
						: type === "error"
						? "Ошибка"
						: type === "warning"
						? "Внимание"
						: "Информация"}
				</span>
				<span className="toast-message">{message}</span>
				<button onClick={onClose} className="toast-close">
					×
				</button>
			</div>
		</div>
	);
}

export function ProductModal({ productId, onClose }) {
	const [product, setProduct] = useState(null);
	const [loading, setLoading] = useState(true);
	const [fullImage, setFullImage] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		const loadProduct = async () => {
			if (!productId) return;
			setLoading(true);
			try {
				const response = await api.get(`/products/${productId}`);
				setProduct(response.data);
			} catch (error) {
				console.error("Ошибка загрузки товара:", error);
			} finally {
				setLoading(false);
			}
		};
		loadProduct();
	}, [productId]);

	if (!productId || loading || !product) return null;

	const handleWriteReview = () => {
		onClose();
		navigate(`/reviews?product_id=${productId}`);
	};

	const renderStars = (rating) => {
		const numRating = parseFloat(rating) || 0;
		const full = Math.floor(numRating);
		const empty = 5 - full;
		return (
			<span className="star-rating static">
				{"★".repeat(full)}
				{"☆".repeat(empty)}
			</span>
		);
	};

	const formatRating = (value) => (parseFloat(value) || 0).toFixed(1);

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div
				className="modal-box product-modal-box"
				onClick={(e) => e.stopPropagation()}
			>
				<button onClick={onClose} className="modal-close-btn">
					×
				</button>
				<h2 className="modal-title">{product.name}</h2>

				{product.image_url && (
					<img
						src={`http://localhost:4000${product.image_url}`}
						alt={product.name}
						className="product-modal-img"
						onClick={() => setFullImage(product.image_url)}
					/>
				)}

				<p className="modal-description">
					{product.description || "Описание отсутствует"}
				</p>

				<div className="product-modal-stats">
					<h3 className="stats-title">Оценки:</h3>
					<div className="stats-grid">
						<div className="stat-row">
							<span>Доставка:</span>
							<span>
								{renderStars(product.avg_delivery_rating)} (
								{formatRating(product.avg_delivery_rating)})
							</span>
						</div>
						<div className="stat-row">
							<span>Качество:</span>
							<span>
								{renderStars(product.avg_quality_rating)} (
								{formatRating(product.avg_quality_rating)})
							</span>
						</div>
						<div className="stat-row">
							<span>Цена:</span>
							<span>
								{renderStars(product.avg_price_rating)} (
								{formatRating(product.avg_price_rating)})
							</span>
						</div>
						<div className="stat-row stat-border">
							<span>Общий рейтинг:</span>
							<span>
								{renderStars(product.avg_rating)} (
								{formatRating(product.avg_rating)})
							</span>
						</div>
					</div>
				</div>

				<button
					onClick={handleWriteReview}
					className="btn btn-primary btn-block"
				>
					Написать отзыв
				</button>
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