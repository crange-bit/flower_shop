import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api/axios";

export const fetchCart = createAsyncThunk(
	"cart/fetch",
	async () => (await api.get("/cart")).data
);

export const addToCart = createAsyncThunk(
	"cart/add",
	async (item) => (await api.post("/cart", item)).data
);

export const updateCartItem = createAsyncThunk(
	"cart/update",
	async ({ id, quantity }) =>
		(await api.patch(`/cart/${id}`, { quantity })).data
);

export const removeCartItem = createAsyncThunk(
	"cart/remove",
	async (id) => (await api.delete(`/cart/${id}`)).data
);

export const cartSlice = createSlice({
	name: "cart",
	initialState: { items: [] },
	reducers: {
		clearCart: (state) => {
			state.items = [];
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchCart.fulfilled, (state, action) => {
				state.items = action.payload;
			})
			.addCase("auth/logout", (state) => {
				state.items = [];
			});
	},
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;