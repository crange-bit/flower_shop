import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts, setPage } from "../store/productSlice";
import { addToCart, fetchCart } from "../store/cartSlice";
import { api } from "../api/axios";
import { QuantitySelector } from "./UI";
import { Notify, ProductModal } from "./Modals";

export default function Catalog() {
	const { data, loading, page, pages } = useSelector((s) => s.products);
	const dispatch = useDispatch();
	const [quantities, setQuantities] = useState({});
	const [notify, setNotify] = useState(null);
	const [modalId, setModalId] = useState(null);
	const [search, setSearch] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [minPrice, setMinPrice] = useState("");
	const [maxPrice, setMaxPrice] = useState("");
	const [sortBy, setSortBy] = useState("created_at");
	const [sortOrder, setSortOrder] = useState("desc");
	const [categories, setCategories] = useState([]);
	const cart = useSelector((s) => s.cart.items);
	const [quantityErrors, setQuantityErrors] = useState({});

	const searchInputRef = useRef(null);
	const debounceRef = useRef(null);

	useEffect(() => {
		api.get("/categories")
			.then((res) => setCategories(res.data))
			.catch(() => {});
	}, []);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			const params = {
				page,
				limit: 8,
				search,
				min_price: minPrice,
				max_price: maxPrice,
				sort_by: sortBy,
				sort_order: sortOrder,
			};
			if (categoryId) params.category_id = categoryId;
			dispatch(fetchProducts(params));
		}, 500);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [
		page,
		search,
		categoryId,
		minPrice,
		maxPrice,
		sortBy,
		sortOrder,
		dispatch,
	]);

	const handleQuantityChange = (productId, quantity) =>
		setQuantities((prev) => ({ ...prev, [productId]: quantity }));

	const handleAddToCart = async (product) => {
		const quantity = quantities[product.id] || 1;

		const cartItem = cart.find((i) => i.id === product.id);
		const alreadyInCart = cartItem ? cartItem.quantity : 0;
		const total = alreadyInCart + quantity;

		if (total > product.stock) {
			setQuantityErrors((prev) => ({
				...prev,
				[product.id]: `На складе только ${product.stock} шт. В корзине уже ${alreadyInCart} шт.`,
			}));
			return;
		}

		setQuantityErrors((prev) => {
			const n = { ...prev };
			delete n[product.id];
			return n;
		});

		try {
			await dispatch(
				addToCart({ product_id: product.id, quantity })
			).unwrap();
			await dispatch(fetchCart());
			setNotify({
				message: `${product.name} добавлен в корзину`,
				type: "success",
			});
			setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
		} catch (err) {
			setQuantityErrors((prev) => ({
				...prev,
				[product.id]:
					err.response?.data?.error || "Ошибка добавления в корзину",
			}));
		}
	};

	if (loading)
		return (
			<div className="loading">
				<div className="loading-spinner"></div>
				<p>Загрузка товаров...</p>
			</div>
		);

	return (
		<div className="container">
			{notify && (
				<Notify
					message={notify.message}
					type={notify.type}
					onClose={() => setNotify(null)}
				/>
			)}
			{modalId && (
				<ProductModal
					productId={modalId}
					onClose={() => setModalId(null)}
				/>
			)}

			<h1 className="page-title">Наши цветы</h1>

			<div className="filter-bar">
				<div className="filter-item wide">
					<label>Поиск</label>
					<input
						ref={searchInputRef}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Поиск по названию..."
					/>
				</div>
				<div className="filter-item">
					<label>Категория</label>
					<select
						value={categoryId}
						onChange={(e) => setCategoryId(e.target.value)}
					>
						<option value="">Все</option>
						{categories.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
					</select>
				</div>
				<div className="filter-item small">
					<label>От</label>
					<input
						type="number"
						value={minPrice}
						onChange={(e) => setMinPrice(e.target.value)}
						placeholder="0"
					/>
				</div>
				<div className="filter-item small">
					<label>До</label>
					<input
						type="number"
						value={maxPrice}
						onChange={(e) => setMaxPrice(e.target.value)}
						placeholder="10000"
					/>
				</div>
				<div className="filter-item">
					<label>Сортировка</label>
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
					>
						<option value="created_at">Новинки</option>
						<option value="price">Цена</option>
						<option value="name">Название</option>
						<option value="rating">Рейтинг</option>
					</select>
				</div>
				<div className="filter-item small">
					<label>Порядок</label>
					<select
						value={sortOrder}
						onChange={(e) => setSortOrder(e.target.value)}
					>
						<option value="desc">По убыв.</option>
						<option value="asc">По возр.</option>
					</select>
				</div>
			</div>

			<div className="products-grid">
				{data.map((p) => (
					<div
						key={p.id}
						className="product-card"
						onClick={() => setModalId(p.id)}
					>
						<div className="product-image-wrapper">
							{p.image_url && (
								<img
									src={`http://localhost:4000${p.image_url}`}
									alt={p.name}
									className="product-image"
								/>
							)}
						</div>
						<div className="product-info">
							<h3 className="product-title">{p.name}</h3>
							<p className="product-desc">
								{p.description?.substring(0, 80)}...
							</p>
							<div className="product-price">
								{p.price.toLocaleString()} рублей
							</div>
							<div
								className={`product-stock ${
									p.stock < 5
										? p.stock === 0
											? "stock-out"
											: "stock-low"
										: "stock-ok"
								}`}
							>
								{p.stock === 0
									? "Нет в наличии"
									: p.stock < 5
									? `Осталось ${p.stock} шт`
									: `В наличии: ${p.stock} шт`}
							</div>

							<div className="product-actions">
								{p.stock > 0 && (
									<QuantitySelector
										quantity={quantities[p.id] || 1}
										onQuantityChange={(q) =>
											handleQuantityChange(p.id, q)
										}
										stock={p.stock}
										disabled={false}
									/>
								)}
								{quantityErrors[p.id] && (
									<div className="qty-error product-qty-error">
										{quantityErrors[p.id]}
									</div>
								)}
								<button
									className="btn btn-primary btn-block add-to-cart-btn"
									onClick={(e) => {
										e.stopPropagation();
										handleAddToCart(p);
									}}
									disabled={p.stock === 0}
								>
									{p.stock === 0
										? "Нет в наличии"
										: "В корзину"}
								</button>
							</div>
						</div>
					</div>
				))}
			</div>

			{pages > 1 && (
				<div className="pagination">
					<button
						onClick={() => dispatch(setPage(page - 1))}
						disabled={page === 1}
					>
						Назад
					</button>
					{[...Array(Math.min(pages, 5))].map((_, i) => {
						let pageNum;
						if (pages <= 5) pageNum = i + 1;
						else if (page <= 3) pageNum = i + 1;
						else if (page >= pages - 2) pageNum = pages - 4 + i;
						else pageNum = page - 2 + i;
						return (
							<button
								key={pageNum}
								onClick={() => dispatch(setPage(pageNum))}
								className={page === pageNum ? "active" : ""}
							>
								{pageNum}
							</button>
						);
					})}
					<button
						onClick={() => dispatch(setPage(page + 1))}
						disabled={page === pages}
					>
						Вперед
					</button>
				</div>
			)}
		</div>
	);
}