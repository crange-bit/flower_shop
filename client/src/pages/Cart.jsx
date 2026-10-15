import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchCart, removeCartItem, updateCartItem } from "../store/cartSlice";
import { ConfirmDialog, Notify } from "./Modals";
import { QuantitySelector } from "./UI";

export default function Cart() {
	const items = useSelector((s) => s.cart.items);
	const dispatch = useDispatch();
	const [removeItemId, setRemoveItemId] = useState(null);
	const [notify, setNotify] = useState(null);

	useEffect(() => {
		dispatch(fetchCart());
	}, [dispatch]);

	const total = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

	const handleRemoveClick = (itemId, itemName) => {
		setRemoveItemId({ id: itemId, name: itemName });
	};

	const confirmRemove = async () => {
		if (removeItemId) {
			try {
				await dispatch(removeCartItem(removeItemId.id)).unwrap();
				await dispatch(fetchCart());
				setNotify({
					message: `${removeItemId.name} удалён из корзины`,
					type: "success",
				});
			} catch (err) {
				setNotify({
					message: err.response?.data?.error || "Ошибка удаления",
					type: "error",
				});
			}
			setRemoveItemId(null);
		}
	};

	const handleQuantityChange = async (cartId, quantity) => {
		try {
			await dispatch(updateCartItem({ id: cartId, quantity })).unwrap();
			await dispatch(fetchCart());
		} catch (err) {
			setNotify({
				message:
					err.response?.data?.error || "Ошибка обновления количества",
				type: "error",
			});
			await dispatch(fetchCart());
		}
	};

	if (items.length === 0) {
		return (
			<div className="container cart-container">
				<div className="card empty-state">
					<div className="empty-icon">Корзина</div>
					<h2>Корзина пуста</h2>
					<p>Добавьте товары из каталога</p>
					<Link to="/catalog" className="btn btn-primary">
						Перейти в каталог
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="container cart-container">
			{notify && (
				<Notify
					message={notify.message}
					type={notify.type}
					onClose={() => setNotify(null)}
				/>
			)}

			<ConfirmDialog
				isOpen={!!removeItemId}
				onClose={() => setRemoveItemId(null)}
				onConfirm={confirmRemove}
				title="Удаление товара"
				message={`Вы уверены, что хотите удалить «${removeItemId?.name}» из корзины?`}
			/>

			<h1 className="page-title cart-heading">Моя корзина</h1>

			<div className="cart-items">
				{items.map((i) => (
					<div key={i.cart_id} className="cart-item">
						{i.image_url && (
							<img
								src={`http://localhost:4000${i.image_url}`}
								alt={i.name}
								className="cart-item-img"
							/>
						)}

						<div className="cart-item-info">
							<div className="cart-item-title">{i.name}</div>
							<div className="cart-item-price">
								{Number(i.price).toLocaleString()} ₽ за шт.
							</div>
							<div className="cart-item-subtotal">
								Итого:{" "}
								{(
									Number(i.price) * i.quantity
								).toLocaleString()}{" "}
								₽
							</div>

							<div className="cart-item-qty">
								<QuantitySelector
									quantity={i.quantity}
									stock={i.stock}
									onQuantityChange={(q) =>
										handleQuantityChange(
											i.cart_id,
											q,
											i.name
										)
									}
								/>
							</div>
						</div>

						<button
							className="btn btn-danger cart-item-remove"
							onClick={() => handleRemoveClick(i.cart_id, i.name)}
						>
							Удалить
						</button>
					</div>
				))}
			</div>

			<div className="cart-total">
				<div className="cart-total-label">Итого к оплате:</div>
				<div className="cart-total-amount">
					{total.toLocaleString()} ₽
				</div>
			</div>

			<div className="cart-actions">
				<Link to="/catalog" className="btn btn-secondary">
					Продолжить покупки
				</Link>
				<Link to="/checkout" className="btn btn-primary">
					Оформить заказ
				</Link>
			</div>
		</div>
	);
}